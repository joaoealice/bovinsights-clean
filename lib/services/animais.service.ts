import { createClient } from '@/lib/supabase/client'

// ============================================
// TIPOS
// ============================================

export type SexoAnimal = 'Macho' | 'Fêmea'

export type RacaAnimal =
  | 'Nelore'
  | 'Aberdeen Angus'
  | 'Angus'
  | 'Brahman'
  | 'Brangus'
  | 'Guzerá'
  | 'Hereford'
  | 'Senepol'
  | 'Tabapuã'
  | 'Gir'
  | 'Charolês'
  | 'Limousin'
  | 'Simental'
  | 'Misto'
  | 'Outro'

export type TipoAnimal = 'Engorda' | 'Terminação' | 'Recria' | 'Cria'

export type StatusAnimal = 'Ativo' | 'Vendido' | 'Morto' | 'Transferido'

export interface Animal {
  id: string
  usuario_id: string
  lote_id?: string
  brinco: string
  nome?: string
  sexo: SexoAnimal
  raca: RacaAnimal
  tipo: TipoAnimal
  data_entrada: string
  data_nascimento?: string
  idade_meses?: number
  peso_entrada: number // Peso inicial fixo (parâmetro)
  peso_atual?: number
  preco_arroba_compra?: number
  valor_total_compra?: number
  status: StatusAnimal
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface AnimalWithDetails extends Animal {
  lote?: {
    id: string
    nome: string
  }
  gmd?: number
  ganho_total?: number
  total_pesagens?: number
  ultima_pesagem?: string
  arroba_atual?: number
  valor_estimado?: number
}

export interface AnimalFilters {
  lote_id?: string
  sexo?: SexoAnimal
  raca?: RacaAnimal
  tipo?: TipoAnimal
  status?: StatusAnimal
}

export interface EstatisticasAnimais {
  total_animais: number
  total_ativos: number
  machos: number
  femeas: number
  peso_medio: number
  gmd_medio: number
}

// ============================================
// CONSTANTES
// ============================================

export const RACAS: { value: RacaAnimal; label: string }[] = [
  { value: 'Nelore', label: 'Nelore' },
  { value: 'Aberdeen Angus', label: 'Aberdeen Angus' },
  { value: 'Angus', label: 'Angus' },
  { value: 'Brahman', label: 'Brahman' },
  { value: 'Brangus', label: 'Brangus' },
  { value: 'Guzerá', label: 'Guzerá' },
  { value: 'Hereford', label: 'Hereford' },
  { value: 'Senepol', label: 'Senepol' },
  { value: 'Tabapuã', label: 'Tabapuã' },
  { value: 'Gir', label: 'Gir' },
  { value: 'Charolês', label: 'Charolês' },
  { value: 'Limousin', label: 'Limousin' },
  { value: 'Simental', label: 'Simental' },
  { value: 'Misto', label: 'Misto / Cruzado' },
  { value: 'Outro', label: 'Outro' },
]

export const TIPOS_ANIMAL: { value: TipoAnimal; label: string }[] = [
  { value: 'Engorda', label: 'Engorda' },
  { value: 'Terminação', label: 'Terminação' },
  { value: 'Recria', label: 'Recria' },
  { value: 'Cria', label: 'Cria' },
]

export const STATUS_ANIMAL: { value: StatusAnimal; label: string }[] = [
  { value: 'Ativo', label: 'Ativo' },
  { value: 'Vendido', label: 'Vendido' },
  { value: 'Morto', label: 'Morto' },
  { value: 'Transferido', label: 'Transferido' },
]

// ============================================
// FUNÇÕES CRUD
// ============================================

// Listar todos os animais do usuário
export async function getAnimais(): Promise<AnimalWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: animais, error } = await supabase
    .from('animais')
    .select(`
      *,
      lotes:lote_id(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Calcular detalhes para cada animal
  return await Promise.all(
    animais.map(async (animal: any) => {
      const detalhes = await calcularDetalhesAnimal(animal.id, animal.peso_entrada)

      return {
        ...animal,
        lote: animal.lotes,
        lotes: undefined,
        ...detalhes
      }
    })
  )
}

// Buscar animal por ID
export async function getAnimalById(id: string): Promise<AnimalWithDetails | null> {
  const supabase = createClient()

  const { data: animal, error } = await supabase
    .from('animais')
    .select(`
      *,
      lotes:lote_id(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!animal) return null

  const detalhes = await calcularDetalhesAnimal(animal.id, animal.peso_entrada)

  return {
    ...animal,
    lote: animal.lotes,
    lotes: undefined,
    ...detalhes
  }
}

// Buscar animais por lote
export async function getAnimaisByLote(loteId: string): Promise<AnimalWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: animais, error } = await supabase
    .from('animais')
    .select(`
      *,
      lotes:lote_id(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .order('brinco')

  if (error) throw error

  return await Promise.all(
    animais.map(async (animal: any) => {
      const detalhes = await calcularDetalhesAnimal(animal.id, animal.peso_entrada)

      return {
        ...animal,
        lote: animal.lotes,
        lotes: undefined,
        ...detalhes
      }
    })
  )
}

// Criar novo animal (identificar animal do lote)
export async function createAnimal(
  data: Omit<Animal, 'id' | 'usuario_id' | 'created_at' | 'updated_at' | 'peso_atual'>
): Promise<Animal> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Calcular valor total se preço @ informado
  let valorTotalCompra = data.valor_total_compra
  if (data.preco_arroba_compra && data.peso_entrada && !valorTotalCompra) {
    const arrobas = data.peso_entrada / 30
    valorTotalCompra = Math.round(arrobas * data.preco_arroba_compra * 100) / 100
  }

  // Calcular idade em meses se data de nascimento informada
  let idadeMeses = data.idade_meses
  if (data.data_nascimento && !idadeMeses) {
    const nascimento = new Date(data.data_nascimento)
    const hoje = new Date()
    const diffTime = hoje.getTime() - nascimento.getTime()
    idadeMeses = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44))
  }

  const { data: animal, error } = await supabase
    .from('animais')
    .insert({
      ...data,
      usuario_id: user.id,
      peso_entrada: Math.round(data.peso_entrada * 10) / 10,
      peso_atual: Math.round(data.peso_entrada * 10) / 10, // Peso atual inicial = peso entrada
      valor_total_compra: valorTotalCompra,
      idade_meses: idadeMeses,
      status: data.status || 'Ativo'
    })
    .select()
    .single()

  if (error) throw error

  // Herdar historico de pesagens do lote
  await herdarHistoricoDoLote(supabase, user.id, animal.id, data.lote_id, data.data_entrada, data.peso_entrada)

  return animal
}

// Funcao auxiliar para herdar historico do lote
async function herdarHistoricoDoLote(
  supabase: any,
  userId: string,
  animalId: string,
  loteId: string | undefined,
  dataEntrada: string,
  pesoEntrada: number
) {
  if (!loteId) {
    // Sem lote, criar apenas pesagem inicial
    await supabase
      .from('pesagens')
      .insert({
        usuario_id: userId,
        animal_id: animalId,
        lote_id: loteId,
        peso: Math.round(pesoEntrada * 10) / 10,
        data_pesagem: dataEntrada,
        observacoes: 'Peso de entrada (identificacao individual)'
      })
    return
  }

  // Buscar pesagens do lote anteriores ou iguais a data de entrada do animal
  // que nao pertencam a nenhum animal especifico (pesagens em lote)
  const { data: pesagensLote } = await supabase
    .from('pesagens')
    .select('peso, data_pesagem, observacoes')
    .eq('lote_id', loteId)
    .lte('data_pesagem', dataEntrada)
    .order('data_pesagem', { ascending: true })

  // Buscar dados do lote para obter informacoes de entrada
  const { data: lote } = await supabase
    .from('lotes')
    .select('nome, data_entrada, peso_total_entrada, quantidade_total')
    .eq('id', loteId)
    .single()

  const pesagensParaInserir = []

  // Se ha pesagens do lote, herdar as relevantes
  if (pesagensLote && pesagensLote.length > 0) {
    // Verificar se ja existe pesagem na data de entrada do lote
    const temPesagemEntrada = pesagensLote.some(
      (p: any) => p.data_pesagem === dataEntrada || p.data_pesagem === lote?.data_entrada
    )

    if (!temPesagemEntrada && lote?.data_entrada) {
      // Criar pesagem de entrada do lote
      pesagensParaInserir.push({
        usuario_id: userId,
        animal_id: animalId,
        lote_id: loteId,
        peso: Math.round(pesoEntrada * 10) / 10,
        data_pesagem: lote.data_entrada,
        observacoes: `Peso de entrada (herdado do lote ${lote.nome})`
      })
    }

    // Adicionar pesagens herdadas do lote
    for (const pesagem of pesagensLote) {
      // Evitar duplicar a pesagem de entrada
      if (pesagem.data_pesagem === lote?.data_entrada) continue

      pesagensParaInserir.push({
        usuario_id: userId,
        animal_id: animalId,
        lote_id: loteId,
        peso: pesagem.peso,
        data_pesagem: pesagem.data_pesagem,
        observacoes: `${pesagem.observacoes || 'Pesagem'} (herdado do lote ${lote?.nome || ''})`
      })
    }
  } else {
    // Sem pesagens do lote, criar apenas pesagem de entrada
    pesagensParaInserir.push({
      usuario_id: userId,
      animal_id: animalId,
      lote_id: loteId,
      peso: Math.round(pesoEntrada * 10) / 10,
      data_pesagem: dataEntrada,
      observacoes: `Peso de entrada (identificacao individual - lote ${lote?.nome || ''})`
    })
  }

  // Se a data de entrada do animal for diferente da ultima pesagem, adicionar pesagem atual
  const ultimaPesagemData = pesagensParaInserir.length > 0
    ? pesagensParaInserir[pesagensParaInserir.length - 1].data_pesagem
    : null

  if (ultimaPesagemData !== dataEntrada) {
    pesagensParaInserir.push({
      usuario_id: userId,
      animal_id: animalId,
      lote_id: loteId,
      peso: Math.round(pesoEntrada * 10) / 10,
      data_pesagem: dataEntrada,
      observacoes: 'Peso de entrada (identificacao individual)'
    })
  }

  // Inserir todas as pesagens herdadas
  if (pesagensParaInserir.length > 0) {
    await supabase
      .from('pesagens')
      .insert(pesagensParaInserir)
  }
}

// Atualizar animal
export async function updateAnimal(id: string, data: Partial<Animal>): Promise<Animal> {
  const supabase = createClient()

  const updateData = { ...data }

  // Arredondar pesos se informados
  if (data.peso_entrada) {
    updateData.peso_entrada = Math.round(data.peso_entrada * 10) / 10
  }
  if (data.peso_atual) {
    updateData.peso_atual = Math.round(data.peso_atual * 10) / 10
  }

  // Recalcular valor total se preço @ alterado
  if (data.preco_arroba_compra && data.peso_entrada) {
    const arrobas = data.peso_entrada / 30
    updateData.valor_total_compra = Math.round(arrobas * data.preco_arroba_compra * 100) / 100
  }

  const { data: animal, error } = await supabase
    .from('animais')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return animal
}

// Deletar animal
export async function deleteAnimal(id: string): Promise<void> {
  const supabase = createClient()

  // Deletar pesagens associadas primeiro
  await supabase
    .from('pesagens')
    .delete()
    .eq('animal_id', id)

  const { error } = await supabase
    .from('animais')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar animais com filtros
export async function searchAnimais(
  query?: string,
  filters?: AnimalFilters
): Promise<AnimalWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('animais')
    .select(`
      *,
      lotes:lote_id(id, nome)
    `)
    .eq('usuario_id', user.id)

  // Aplicar filtros
  if (filters?.lote_id) {
    queryBuilder = queryBuilder.eq('lote_id', filters.lote_id)
  }
  if (filters?.sexo) {
    queryBuilder = queryBuilder.eq('sexo', filters.sexo)
  }
  if (filters?.raca) {
    queryBuilder = queryBuilder.eq('raca', filters.raca)
  }
  if (filters?.tipo) {
    queryBuilder = queryBuilder.eq('tipo', filters.tipo)
  }
  if (filters?.status) {
    queryBuilder = queryBuilder.eq('status', filters.status)
  }

  const { data: animais, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) throw error

  // Filtrar por brinco/nome se houver query
  let animaisFiltrados = animais
  if (query) {
    const queryLower = query.toLowerCase()
    animaisFiltrados = animais.filter((a: any) =>
      a.brinco?.toLowerCase().includes(queryLower) ||
      a.nome?.toLowerCase().includes(queryLower)
    )
  }

  return await Promise.all(
    animaisFiltrados.map(async (animal: any) => {
      const detalhes = await calcularDetalhesAnimal(animal.id, animal.peso_entrada)

      return {
        ...animal,
        lote: animal.lotes,
        lotes: undefined,
        ...detalhes
      }
    })
  )
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Calcular detalhes do animal (GMD, ganho total, etc.)
async function calcularDetalhesAnimal(
  animalId: string,
  pesoEntrada: number
): Promise<{
  gmd?: number
  ganho_total?: number
  total_pesagens?: number
  ultima_pesagem?: string
  arroba_atual?: number
  valor_estimado?: number
}> {
  const supabase = createClient()

  // Buscar pesagens do animal
  const { data: pesagens } = await supabase
    .from('pesagens')
    .select('peso, data_pesagem')
    .eq('animal_id', animalId)
    .order('data_pesagem', { ascending: true })

  if (!pesagens || pesagens.length === 0) {
    return {
      total_pesagens: 0,
      arroba_atual: pesoEntrada ? Math.round((pesoEntrada / 30) * 100) / 100 : undefined
    }
  }

  const primeiraPesagem = pesagens[0]
  const ultimaPesagem = pesagens[pesagens.length - 1]
  const pesoAtual = ultimaPesagem.peso

  // Calcular ganho total
  const ganhoTotal = pesoAtual - primeiraPesagem.peso

  // Calcular GMD
  const dias = Math.ceil(
    (new Date(ultimaPesagem.data_pesagem).getTime() - new Date(primeiraPesagem.data_pesagem).getTime()) /
    (1000 * 60 * 60 * 24)
  )
  const gmd = dias > 0 ? ganhoTotal / dias : 0

  // Calcular arroba atual
  const arrobaAtual = Math.round((pesoAtual / 30) * 100) / 100

  return {
    gmd: Math.round(gmd * 1000) / 1000,
    ganho_total: Math.round(ganhoTotal * 10) / 10,
    total_pesagens: pesagens.length,
    ultima_pesagem: ultimaPesagem.data_pesagem,
    arroba_atual: arrobaAtual
  }
}

// Obter estatísticas gerais de animais
export async function getEstatisticasAnimais(): Promise<EstatisticasAnimais> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: animais } = await supabase
    .from('animais')
    .select('sexo, peso_atual, status')
    .eq('usuario_id', user.id)

  if (!animais || animais.length === 0) {
    return {
      total_animais: 0,
      total_ativos: 0,
      machos: 0,
      femeas: 0,
      peso_medio: 0,
      gmd_medio: 0
    }
  }

  const ativos = animais.filter(a => a.status === 'Ativo')
  const machos = ativos.filter(a => a.sexo === 'Macho').length
  const femeas = ativos.filter(a => a.sexo === 'Fêmea').length

  const pesos = ativos.map(a => a.peso_atual || 0).filter(p => p > 0)
  const pesoMedio = pesos.length > 0
    ? pesos.reduce((a, b) => a + b, 0) / pesos.length
    : 0

  return {
    total_animais: animais.length,
    total_ativos: ativos.length,
    machos,
    femeas,
    peso_medio: Math.round(pesoMedio * 10) / 10,
    gmd_medio: 0 // Calculado separadamente se necessário
  }
}

// Transferir animal para outro lote
export async function transferirAnimal(animalId: string, novoLoteId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('animais')
    .update({ lote_id: novoLoteId })
    .eq('id', animalId)

  if (error) throw error
}

// Obter animais para seleção (dropdown)
export async function getAnimaisParaSelecao(loteId?: string): Promise<{
  id: string
  brinco: string
  nome: string | null
  sexo: SexoAnimal
}[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('animais')
    .select('id, brinco, nome, sexo')
    .eq('usuario_id', user.id)
    .eq('status', 'Ativo')

  if (loteId) {
    queryBuilder = queryBuilder.eq('lote_id', loteId)
  }

  const { data, error } = await queryBuilder.order('brinco')

  if (error) throw error
  return data
}

// Obter total de arrobas em estoque
export interface TotalArrobasEstoque {
  total_arrobas: number
  total_kg: number
  total_animais: number
  valor_estimado: number
}

export async function getTotalArrobasEstoque(precoArrobaAtual?: number): Promise<TotalArrobasEstoque> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar animais cadastrados individualmente
  const { data: animais } = await supabase
    .from('animais')
    .select('peso_atual')
    .eq('usuario_id', user.id)
    .eq('status', 'Ativo')

  // Buscar lotes ativos para usar como fallback
  const { data: lotes } = await supabase
    .from('lotes')
    .select('quantidade_total, peso_total_entrada')
    .eq('usuario_id', user.id)
    .eq('status', 'ativo')

  // Se há animais cadastrados, usar os dados deles
  if (animais && animais.length > 0) {
    const totalKg = animais.reduce((sum, a) => sum + (a.peso_atual || 0), 0)
    const totalArrobas = totalKg / 30
    const valorEstimado = precoArrobaAtual ? totalArrobas * precoArrobaAtual : 0

    return {
      total_arrobas: Math.round(totalArrobas * 100) / 100,
      total_kg: Math.round(totalKg * 10) / 10,
      total_animais: animais.length,
      valor_estimado: Math.round(valorEstimado * 100) / 100
    }
  }

  // Se não há animais cadastrados, usar dados dos lotes
  if (lotes && lotes.length > 0) {
    const totalAnimaisLotes = lotes.reduce((sum, l) => sum + (l.quantidade_total || 0), 0)
    const totalKgLotes = lotes.reduce((sum, l) => sum + (l.peso_total_entrada || 0), 0)
    const totalArrobasLotes = totalKgLotes / 30
    const valorEstimado = precoArrobaAtual ? totalArrobasLotes * precoArrobaAtual : 0

    return {
      total_arrobas: Math.round(totalArrobasLotes * 100) / 100,
      total_kg: Math.round(totalKgLotes * 10) / 10,
      total_animais: totalAnimaisLotes,
      valor_estimado: Math.round(valorEstimado * 100) / 100
    }
  }

  return {
    total_arrobas: 0,
    total_kg: 0,
    total_animais: 0,
    valor_estimado: 0
  }
}
