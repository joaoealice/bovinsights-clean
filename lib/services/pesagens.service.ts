import { createClient } from '@/lib/supabase/client'

// ============================================
// TIPOS
// ============================================

export interface Pesagem {
  id: string
  usuario_id: string
  animal_id: string
  lote_id?: string
  peso: number
  data_pesagem: string
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface PesagemWithDetails extends Pesagem {
  animal?: {
    id: string
    brinco: string
    nome: string | null
    sexo: 'Macho' | 'Fêmea' | null
  }
  lote?: {
    id: string
    nome: string
  }
  peso_anterior?: number
  ganho: number
  gmd: number // Ganho Médio Diário
  dias_desde_ultima: number
}

export interface PesagemFilters {
  lote_id?: string
  animal_id?: string
  data_inicio?: string
  data_fim?: string
}

export interface EstatisticasPesagem {
  total_pesagens: number
  peso_medio: number
  gmd_medio: number
  ultima_pesagem?: string
  maior_peso: number
  menor_peso: number
}

// ============================================
// FUNÇÕES CRUD
// ============================================

// Listar todas as pesagens do usuário
export async function getPesagens(): Promise<PesagemWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: pesagens, error } = await supabase
    .from('pesagens')
    .select(`
      *,
      animais!fk_pesagens_animal(id, brinco, nome, sexo),
      lotes!fk_pesagens_lote(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('data_pesagem', { ascending: false })

  if (error) throw error

  // Calcular ganhos e GMD para cada pesagem
  return await Promise.all(
    pesagens.map(async (pesagem: any) => {
      // Só calcular ganho/GMD se houver animal_id
      let ganho = 0, gmd = 0, dias = 0, peso_anterior: number | undefined

      if (pesagem.animal_id) {
        const resultado = await calcularGanho(pesagem.animal_id, pesagem.data_pesagem, pesagem.peso)
        ganho = resultado.ganho
        gmd = resultado.gmd
        dias = resultado.dias
        peso_anterior = resultado.peso_anterior
      }

      return {
        ...pesagem,
        animal: pesagem.animais,
        lote: pesagem.lotes,
        animais: undefined,
        lotes: undefined,
        peso_anterior,
        ganho,
        gmd,
        dias_desde_ultima: dias
      }
    })
  )
}

// Buscar pesagem por ID
export async function getPesagemById(id: string): Promise<PesagemWithDetails | null> {
  const supabase = createClient()

  const { data: pesagem, error } = await supabase
    .from('pesagens')
    .select(`
      *,
      animais!fk_pesagens_animal(id, brinco, nome, sexo),
      lotes!fk_pesagens_lote(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!pesagem) return null

  // Só calcular ganho/GMD se houver animal_id
  let ganho = 0, gmd = 0, dias = 0, peso_anterior: number | undefined

  if (pesagem.animal_id) {
    const resultado = await calcularGanho(pesagem.animal_id, pesagem.data_pesagem, pesagem.peso)
    ganho = resultado.ganho
    gmd = resultado.gmd
    dias = resultado.dias
    peso_anterior = resultado.peso_anterior
  }

  return {
    ...pesagem,
    animal: pesagem.animais,
    lote: pesagem.lotes,
    animais: undefined,
    lotes: undefined,
    peso_anterior,
    ganho,
    gmd,
    dias_desde_ultima: dias
  }
}

// Buscar pesagens por animal
export async function getPesagensByAnimal(animalId: string): Promise<PesagemWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: pesagens, error } = await supabase
    .from('pesagens')
    .select(`
      *,
      animais!fk_pesagens_animal(id, brinco, nome, sexo),
      lotes!fk_pesagens_lote(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('animal_id', animalId)
    .order('data_pesagem', { ascending: false })

  if (error) throw error

  // Calcular ganhos sequencialmente (cada pesagem comparada com a anterior)
  const pesagensOrdenadas = [...pesagens].reverse() // Ordenar do mais antigo ao mais recente
  const resultados: PesagemWithDetails[] = []

  for (let i = 0; i < pesagensOrdenadas.length; i++) {
    const pesagem = pesagensOrdenadas[i]
    const pesagemAnterior = i > 0 ? pesagensOrdenadas[i - 1] : null

    let ganho = 0
    let gmd = 0
    let dias = 0
    let peso_anterior = undefined

    if (pesagemAnterior) {
      peso_anterior = pesagemAnterior.peso
      ganho = pesagem.peso - pesagemAnterior.peso
      dias = Math.ceil(
        (new Date(pesagem.data_pesagem).getTime() - new Date(pesagemAnterior.data_pesagem).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      gmd = dias > 0 ? Math.round((ganho / dias) * 1000) / 1000 : 0
    }

    resultados.push({
      ...pesagem,
      animal: pesagem.animais,
      lote: pesagem.lotes,
      animais: undefined,
      lotes: undefined,
      peso_anterior,
      ganho: Math.round(ganho * 10) / 10,
      gmd,
      dias_desde_ultima: dias
    })
  }

  return resultados.reverse() // Retornar na ordem original (mais recente primeiro)
}

// Buscar pesagens por lote
export async function getPesagensByLote(loteId: string): Promise<PesagemWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  console.log('[getPesagensByLote] Buscando pesagens:', { loteId, usuario_id: user.id })

  const { data: pesagens, error } = await supabase
    .from('pesagens')
    .select(`
      *,
      animais!fk_pesagens_animal(id, brinco, nome, sexo),
      lotes!fk_pesagens_lote(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .order('data_pesagem', { ascending: false })

  if (error) {
    console.error('[getPesagensByLote] Erro ao buscar pesagens:', error)
    throw error
  }

  console.log('[getPesagensByLote] Pesagens encontradas:', pesagens?.length || 0)

  return await Promise.all(
    pesagens.map(async (pesagem: any) => {
      // Só calcular ganho/GMD se houver animal_id (pesagens individuais)
      // Pesagens agregadas de lote não têm animal_id
      let ganho = 0, gmd = 0, dias = 0, peso_anterior: number | undefined

      if (pesagem.animal_id) {
        const resultado = await calcularGanho(pesagem.animal_id, pesagem.data_pesagem, pesagem.peso)
        ganho = resultado.ganho
        gmd = resultado.gmd
        dias = resultado.dias
        peso_anterior = resultado.peso_anterior
      }

      return {
        ...pesagem,
        animal: pesagem.animais,
        lote: pesagem.lotes,
        animais: undefined,
        lotes: undefined,
        peso_anterior,
        ganho,
        gmd,
        dias_desde_ultima: dias
      }
    })
  )
}

// Criar nova pesagem individual
export async function createPesagem(data: Omit<Pesagem, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>): Promise<Pesagem> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar o lote_id do animal se não foi fornecido
  let loteId = data.lote_id
  if (!loteId && data.animal_id) {
    const { data: animal } = await supabase
      .from('animais')
      .select('lote_id')
      .eq('id', data.animal_id)
      .single()

    loteId = animal?.lote_id || undefined
  }

  console.log('[createPesagem] Inserindo pesagem:', {
    animal_id: data.animal_id,
    lote_id: loteId,
    peso: data.peso,
    data_pesagem: data.data_pesagem
  })

  const { data: pesagem, error } = await supabase
    .from('pesagens')
    .insert({
      ...data,
      lote_id: loteId,
      usuario_id: user.id,
      peso: Math.round(data.peso * 10) / 10 // Arredondar para 1 casa decimal
    })
    .select()
    .single()

  if (error) {
    console.error('[createPesagem] Erro ao inserir pesagem:', error)
    throw error
  }

  console.log('[createPesagem] Pesagem inserida com sucesso:', pesagem.id)

  // Atualizar peso_atual do animal - COM VERIFICAÇÃO DE ERRO
  const { error: updateError } = await supabase
    .from('animais')
    .update({ peso_atual: data.peso })
    .eq('id', data.animal_id)

  if (updateError) {
    console.error('[createPesagem] Erro ao atualizar peso do animal:', updateError)
    // Não lançamos erro pois a pesagem já foi salva, mas logamos para debug
  }

  return pesagem
}

// Interface para pesagem agregada por lote
export interface PesagemLoteAgregada {
  id?: string
  lote_id: string
  peso_total: number
  quantidade_animais: number
  peso_medio: number
  data_pesagem: string
  observacoes?: string
}

// Criar pesagem AGREGADA por lote (sem necessidade de animais cadastrados)
// O LOTE é o eixo central - quantidade vem do lote, não de animais
export async function createPesagemLoteAgregada(
  loteId: string,
  pesoTotal: number,
  quantidadeAnimais: number,
  dataPesagem: string,
  observacoes?: string
): Promise<{ success: boolean; pesoMedio: number; loteAtualizado: boolean }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Validações
  if (!loteId || loteId.trim() === '') {
    throw new Error('ID do lote é obrigatório')
  }

  if (pesoTotal <= 0) {
    throw new Error('Peso total deve ser maior que zero')
  }

  if (quantidadeAnimais <= 0) {
    throw new Error('Quantidade de animais deve ser maior que zero')
  }

  const pesoMedio = Math.round((pesoTotal / quantidadeAnimais) * 10) / 10

  console.log('[createPesagemLoteAgregada] Registrando pesagem agregada:', {
    loteId,
    pesoTotal,
    quantidadeAnimais,
    pesoMedio,
    dataPesagem,
    usuario_id: user.id
  })

  // Verificar se há animais identificados no lote
  const { data: animaisDoLote } = await supabase
    .from('animais')
    .select('id')
    .eq('lote_id', loteId)
    .eq('status', 'Ativo')

  const temAnimaisIdentificados = animaisDoLote && animaisDoLote.length > 0

  // Se há animais identificados, criar pesagens individuais com peso médio
  if (temAnimaisIdentificados) {
    const qtdParaPesar = Math.min(animaisDoLote.length, quantidadeAnimais)
    const pesagensParaInserir = animaisDoLote.slice(0, qtdParaPesar).map(animal => ({
      usuario_id: user.id,
      animal_id: animal.id,
      lote_id: loteId,
      peso: pesoMedio,
      data_pesagem: dataPesagem,
      observacoes: observacoes || `Pesagem em lote - Peso médio distribuído (${quantidadeAnimais} animais)`
    }))

    const { error: pesagemError } = await supabase
      .from('pesagens')
      .insert(pesagensParaInserir)

    if (pesagemError) {
      console.error('[createPesagemLoteAgregada] Erro ao inserir pesagens:', pesagemError)
      // Continua para atualizar o lote mesmo se falhar a pesagem individual
    }

    // Atualizar peso_atual dos animais identificados
    for (const animal of animaisDoLote.slice(0, qtdParaPesar)) {
      await supabase
        .from('animais')
        .update({ peso_atual: pesoMedio })
        .eq('id', animal.id)
    }
  }

  // Buscar lote atual para pegar historico existente
  const { data: loteAtual } = await supabase
    .from('lotes')
    .select('historico_pesagens')
    .eq('id', loteId)
    .single()

  // Criar novo registro de pesagem para o historico
  const novaPesagem = {
    data: dataPesagem,
    peso_total: pesoTotal,
    quantidade_animais: quantidadeAnimais,
    peso_medio: pesoMedio,
    observacoes: observacoes || null
  }

  // Adicionar ao historico existente ou criar novo array
  const historicoAtual = (loteAtual?.historico_pesagens as any[]) || []
  const historicoAtualizado = [...historicoAtual, novaPesagem]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Mais recente primeiro

  // SEMPRE atualizar o lote com os dados da pesagem (o lote é o eixo central)
  const { error: loteError } = await supabase
    .from('lotes')
    .update({
      peso_medio_animal: pesoMedio,
      quantidade_total: quantidadeAnimais,
      historico_pesagens: historicoAtualizado,
      updated_at: new Date().toISOString()
    })
    .eq('id', loteId)

  if (loteError) {
    console.error('[createPesagemLoteAgregada] Erro ao atualizar lote:', loteError)
  }

  console.log('[createPesagemLoteAgregada] Pesagem registrada com sucesso:', {
    temAnimaisIdentificados,
    pesoMedio,
    loteAtualizado: !loteError,
    historicoLength: historicoAtualizado.length
  })

  return {
    success: true,
    pesoMedio,
    loteAtualizado: !loteError
  }
}

// Criar pesagens em lote para ANIMAIS IDENTIFICADOS
// Use apenas quando há animais cadastrados individualmente no lote
export async function createPesagemLote(
  pesagens: { animal_id: string; peso: number }[],
  dataPesagem: string,
  loteId?: string,
  observacoes?: string
): Promise<Pesagem[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Validar que temos um lote_id válido
  if (!loteId || loteId.trim() === '') {
    throw new Error('ID do lote é obrigatório para pesagem em lote')
  }

  // Validar que temos pesagens para inserir
  if (!pesagens || pesagens.length === 0) {
    throw new Error('Nenhuma pesagem para registrar. Selecione animais ou use pesagem por lote inteiro.')
  }

  const pesagensParaInserir = pesagens.map(p => ({
    usuario_id: user.id,
    animal_id: p.animal_id,
    lote_id: loteId,
    peso: Math.round(p.peso * 10) / 10,
    data_pesagem: dataPesagem,
    observacoes
  }))

  console.log('[createPesagemLote] Inserindo pesagens:', {
    quantidade: pesagensParaInserir.length,
    loteId,
    dataPesagem,
    usuario_id: user.id
  })

  const { data, error } = await supabase
    .from('pesagens')
    .insert(pesagensParaInserir)
    .select()

  if (error) {
    console.error('[createPesagemLote] Erro ao inserir pesagens:', error)
    throw error
  }

  console.log('[createPesagemLote] Pesagens inseridas com sucesso:', data?.length)

  // Atualizar peso_atual de todos os animais
  for (const p of pesagens) {
    await supabase
      .from('animais')
      .update({ peso_atual: p.peso })
      .eq('id', p.animal_id)
  }

  // Atualizar peso médio do lote
  const pesoTotal = pesagens.reduce((sum, p) => sum + p.peso, 0)
  const pesoMedio = Math.round((pesoTotal / pesagens.length) * 10) / 10

  await supabase
    .from('lotes')
    .update({
      peso_medio_animal: pesoMedio,
      updated_at: new Date().toISOString()
    })
    .eq('id', loteId)

  return data
}

// Atualizar pesagem
export async function updatePesagem(id: string, data: Partial<Pesagem>): Promise<Pesagem> {
  const supabase = createClient()

  const updateData = { ...data }
  if (data.peso) {
    updateData.peso = Math.round(data.peso * 10) / 10
  }

  const { data: pesagem, error } = await supabase
    .from('pesagens')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return pesagem
}

// Deletar pesagem
export async function deletePesagem(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('pesagens')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar pesagens com filtros
export async function searchPesagens(
  query?: string,
  filters?: PesagemFilters
): Promise<PesagemWithDetails[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('pesagens')
    .select(`
      *,
      animais!fk_pesagens_animal(id, brinco, nome, sexo),
      lotes!fk_pesagens_lote(id, nome)
    `)
    .eq('usuario_id', user.id)

  // Filtros
  if (filters?.lote_id) {
    queryBuilder = queryBuilder.eq('lote_id', filters.lote_id)
  }

  if (filters?.animal_id) {
    queryBuilder = queryBuilder.eq('animal_id', filters.animal_id)
  }

  if (filters?.data_inicio) {
    queryBuilder = queryBuilder.gte('data_pesagem', filters.data_inicio)
  }

  if (filters?.data_fim) {
    queryBuilder = queryBuilder.lte('data_pesagem', filters.data_fim)
  }

  const { data: pesagens, error } = await queryBuilder.order('data_pesagem', { ascending: false })

  if (error) throw error

  // Filtrar por brinco/nome do animal se houver query
  let pesagensFiltradas = pesagens
  if (query) {
    const queryLower = query.toLowerCase()
    pesagensFiltradas = pesagens.filter((p: any) =>
      p.animais?.brinco?.toLowerCase().includes(queryLower) ||
      p.animais?.nome?.toLowerCase().includes(queryLower)
    )
  }

  return await Promise.all(
    pesagensFiltradas.map(async (pesagem: any) => {
      // Só calcular ganho/GMD se houver animal_id
      let ganho = 0, gmd = 0, dias = 0, peso_anterior: number | undefined

      if (pesagem.animal_id) {
        const resultado = await calcularGanho(pesagem.animal_id, pesagem.data_pesagem, pesagem.peso)
        ganho = resultado.ganho
        gmd = resultado.gmd
        dias = resultado.dias
        peso_anterior = resultado.peso_anterior
      }

      return {
        ...pesagem,
        animal: pesagem.animais,
        lote: pesagem.lotes,
        animais: undefined,
        lotes: undefined,
        peso_anterior,
        ganho,
        gmd,
        dias_desde_ultima: dias
      }
    })
  )
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Calcular ganho e GMD desde a última pesagem
async function calcularGanho(
  animalId: string,
  dataPesagemAtual: string,
  pesoAtual: number
): Promise<{ ganho: number; gmd: number; dias: number; peso_anterior?: number }> {
  const supabase = createClient()

  // Buscar pesagem anterior
  const { data: pesagemAnterior } = await supabase
    .from('pesagens')
    .select('peso, data_pesagem')
    .eq('animal_id', animalId)
    .lt('data_pesagem', dataPesagemAtual)
    .order('data_pesagem', { ascending: false })
    .limit(1)
    .single()

  if (!pesagemAnterior) {
    return { ganho: 0, gmd: 0, dias: 0 }
  }

  const ganho = pesoAtual - pesagemAnterior.peso
  const dias = Math.ceil(
    (new Date(dataPesagemAtual).getTime() - new Date(pesagemAnterior.data_pesagem).getTime()) /
    (1000 * 60 * 60 * 24)
  )
  const gmd = dias > 0 ? ganho / dias : 0

  return {
    ganho: Math.round(ganho * 10) / 10,
    gmd: Math.round(gmd * 1000) / 1000,
    dias,
    peso_anterior: pesagemAnterior.peso
  }
}

// Calcular GMD geral de um animal
export async function calcularGMDAnimal(animalId: string): Promise<{
  gmd: number
  total_pesagens: number
  ganho_total: number
  periodo_dias: number
}> {
  const supabase = createClient()

  const { data: pesagens } = await supabase
    .from('pesagens')
    .select('peso, data_pesagem')
    .eq('animal_id', animalId)
    .order('data_pesagem', { ascending: true })

  if (!pesagens || pesagens.length < 2) {
    return { gmd: 0, total_pesagens: pesagens?.length || 0, ganho_total: 0, periodo_dias: 0 }
  }

  const primeiraPesagem = pesagens[0]
  const ultimaPesagem = pesagens[pesagens.length - 1]

  const ganhoTotal = ultimaPesagem.peso - primeiraPesagem.peso
  const dias = Math.ceil(
    (new Date(ultimaPesagem.data_pesagem).getTime() - new Date(primeiraPesagem.data_pesagem).getTime()) /
    (1000 * 60 * 60 * 24)
  )
  const gmd = dias > 0 ? ganhoTotal / dias : 0

  return {
    gmd: Math.round(gmd * 1000) / 1000,
    total_pesagens: pesagens.length,
    ganho_total: Math.round(ganhoTotal * 10) / 10,
    periodo_dias: dias
  }
}

// Obter estatísticas gerais de pesagens
export async function getEstatisticasPesagens(): Promise<EstatisticasPesagem> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: pesagens } = await supabase
    .from('pesagens')
    .select('peso, data_pesagem')
    .eq('usuario_id', user.id)
    .order('data_pesagem', { ascending: false })

  if (!pesagens || pesagens.length === 0) {
    return {
      total_pesagens: 0,
      peso_medio: 0,
      gmd_medio: 0,
      maior_peso: 0,
      menor_peso: 0
    }
  }

  const pesos = pesagens.map(p => p.peso)
  const pesoMedio = pesos.reduce((a, b) => a + b, 0) / pesos.length

  return {
    total_pesagens: pesagens.length,
    peso_medio: Math.round(pesoMedio * 10) / 10,
    gmd_medio: 0, // Calculado separadamente se necessário
    ultima_pesagem: pesagens[0]?.data_pesagem,
    maior_peso: Math.max(...pesos),
    menor_peso: Math.min(...pesos)
  }
}

// Buscar animais de um lote para pesagem em lote
export async function getAnimaisParaPesagem(loteId: string): Promise<{
  id: string
  brinco: string
  nome: string | null
  peso_atual: number | null
  ultima_pesagem?: string
}[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: animais, error } = await supabase
    .from('animais')
    .select('id, brinco, nome, peso_atual')
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .eq('status', 'Ativo')
    .order('brinco')

  if (error) throw error

  // Buscar última pesagem de cada animal
  return await Promise.all(
    animais.map(async (animal) => {
      const { data: ultimaPesagem } = await supabase
        .from('pesagens')
        .select('data_pesagem')
        .eq('animal_id', animal.id)
        .order('data_pesagem', { ascending: false })
        .limit(1)
        .single()

      return {
        ...animal,
        ultima_pesagem: ultimaPesagem?.data_pesagem
      }
    })
  )
}
