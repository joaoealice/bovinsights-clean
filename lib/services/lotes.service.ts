import { createClient } from '@/lib/supabase/client'

export interface Lote {
  id: string
  usuario_id: string
  nome: string
  // Informações de entrada
  data_entrada?: string
  quantidade_total?: number
  peso_total_entrada?: number
  preco_arroba_compra?: number
  valor_animais?: number
  frete?: number
  comissao?: number
  custo_total?: number
  custo_por_cabeca?: number
  fornecedor?: string
  // Informações do lote
  capacidade_maxima: number
  localizacao?: string
  tipo_lote?: string
  status: 'ativo' | 'inativo' | 'manutencao' | 'vendido'
  observacoes?: string
  // Informações de manejo de pastagem
  piquete_id?: string | null
  peso_medio_animal?: number | null
  dias_permanencia_ideal?: number | null
  data_entrada_piquete?: string | null
  // Histórico de pesagens agregadas do lote
  historico_pesagens?: Array<{
    data: string
    peso_total: number
    quantidade_animais: number
    peso_medio: number
  }>
  created_at: string
  updated_at: string
}

export interface LoteWithStats extends Lote {
  total_animais: number
  peso_medio: number
  ocupacao_percentual: number
}

// Interface para dados do piquete vinculado
export interface PiqueteVinculado {
  id: string
  nome: string
  area_hectares: number
  tipo_pasto: string | null
  ms_total_kg: number | null
  altura_entrada_cm: number | null
  altura_saida_cm: number | null
  capacidade_ua: number | null
}

// Interface do lote com dados do piquete
export interface LoteWithPiquete extends LoteWithStats {
  piquete?: PiqueteVinculado | null
}

// Listar todos os lotes do usuário
export async function getLotes(): Promise<LoteWithStats[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: lotes, error } = await supabase
    .from('lotes')
    .select(`
      *,
      animais!fk_animais_lote(id, peso_atual)
    `)
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Calcular estatísticas
  // O LOTE é o eixo central - quantidade_total e peso_medio_animal do lote são a referência principal
  return lotes.map((lote: any) => {
    const animais = lote.animais || []
    const animaisCadastrados = animais.length

    // Quantidade de referência vem do LOTE (não dos animais cadastrados)
    const totalAnimais = lote.quantidade_total || animaisCadastrados

    // Peso médio: priorizar peso_medio_animal do lote (atualizado nas pesagens)
    let pesoMedio = lote.peso_medio_animal || 0
    if (pesoMedio === 0) {
      // Fallback: calcular dos animais cadastrados ou do peso de entrada
      if (animaisCadastrados > 0) {
        pesoMedio = animais.reduce((sum: number, a: any) => sum + (a.peso_atual || 0), 0) / animaisCadastrados
      } else if (lote.peso_total_entrada && lote.quantidade_total) {
        pesoMedio = lote.peso_total_entrada / lote.quantidade_total
      }
    }

    const ocupacao = lote.capacidade_maxima > 0
      ? (totalAnimais / lote.capacidade_maxima) * 100
      : 0

    return {
      ...lote,
      animais: undefined,
      total_animais: totalAnimais,
      peso_medio: Math.round(pesoMedio * 10) / 10,
      ocupacao_percentual: Math.round(ocupacao)
    }
  })
}

// Buscar lote por ID (com dados do piquete vinculado)
export async function getLoteById(id: string): Promise<LoteWithPiquete | null> {
  const supabase = createClient()

  const { data: lote, error } = await supabase
    .from('lotes')
    .select(`
      *,
      animais!fk_animais_lote(id, brinco, nome, peso_atual, sexo, data_nascimento),
      piquete:areas_pastagem!lotes_piquete_id_fkey(
        id,
        nome,
        area_hectares,
        tipo_pasto,
        ms_total_kg,
        altura_entrada_cm,
        altura_saida_cm,
        capacidade_ua
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!lote) return null

  const animais = lote.animais || []
  const animaisCadastrados = animais.length

  // Quantidade de referência vem do LOTE (não dos animais cadastrados)
  const totalAnimais = lote.quantidade_total || animaisCadastrados

  // Peso médio: priorizar peso_medio_animal do lote (atualizado nas pesagens)
  let pesoMedio = lote.peso_medio_animal || 0
  if (pesoMedio === 0) {
    // Fallback: calcular dos animais cadastrados ou do peso de entrada
    if (animaisCadastrados > 0) {
      pesoMedio = animais.reduce((sum: number, a: any) => sum + (a.peso_atual || 0), 0) / animaisCadastrados
    } else if (lote.peso_total_entrada && lote.quantidade_total) {
      pesoMedio = lote.peso_total_entrada / lote.quantidade_total
    }
  }

  const ocupacao = lote.capacidade_maxima > 0
    ? (totalAnimais / lote.capacidade_maxima) * 100
    : 0

  return {
    ...lote,
    piquete: lote.piquete || null,
    total_animais: totalAnimais,
    peso_medio: Math.round(pesoMedio * 10) / 10,
    ocupacao_percentual: Math.round(ocupacao)
  }
}

// Criar novo lote com entrada de animais
export async function createLoteComEntrada(loteData: Omit<Lote, 'id' | 'usuario_id' | 'created_at' | 'updated_at'> & {
  sexo_tipo?: string
  quantidade_machos?: number
  quantidade_femeas?: number
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Extrair campos de sexo que não vão para a tabela lotes
  const { sexo_tipo, quantidade_machos, quantidade_femeas, ...loteDataClean } = loteData as any

  // Calcular valores se tiver entrada de animais
  let calculatedData = { ...loteDataClean }
  let pesoMedioPorAnimal = 0

  if (loteDataClean.peso_total_entrada && loteDataClean.preco_arroba_compra) {
    const pesoArrobas = loteDataClean.peso_total_entrada / 30
    const valorAnimais = pesoArrobas * loteDataClean.preco_arroba_compra
    const custoTotal = valorAnimais + (loteDataClean.frete || 0) + (loteDataClean.comissao || 0)
    const custoPorCabeca = loteDataClean.quantidade_total ? custoTotal / loteDataClean.quantidade_total : 0
    pesoMedioPorAnimal = loteDataClean.quantidade_total ? loteDataClean.peso_total_entrada / loteDataClean.quantidade_total : 0

    calculatedData = {
      ...loteDataClean,
      valor_animais: Math.round(valorAnimais * 100) / 100,
      custo_total: Math.round(custoTotal * 100) / 100,
      custo_por_cabeca: Math.round(custoPorCabeca * 100) / 100
    }
  }

  // Calcular peso médio para armazenar no lote
  if (pesoMedioPorAnimal > 0) {
    calculatedData.peso_medio_animal = Math.round(pesoMedioPorAnimal * 10) / 10
  }

  const { data: lote, error } = await supabase
    .from('lotes')
    .insert({
      ...calculatedData,
      usuario_id: user.id
    })
    .select()
    .single()

  if (error) throw error

  // NÃO criar animais automaticamente
  // O LOTE é o eixo central da operação
  // Animais são cadastrados OPCIONALMENTE quando o usuário quer identificar um animal específico
  // A quantidade de animais e o peso médio são referenciados diretamente do lote

  console.log('[createLoteComEntrada] Lote criado sem animais individuais:', {
    loteId: lote.id,
    nome: lote.nome,
    quantidade_total: lote.quantidade_total,
    peso_medio_animal: pesoMedioPorAnimal
  })

  return lote
}

// Atualizar lote
export async function updateLote(id: string, loteData: Partial<Lote>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lotes')
    .update(loteData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Deletar lote
export async function deleteLote(id: string) {
  const supabase = createClient()

  // Verificar se tem animais no lote
  const { data: animais } = await supabase
    .from('animais')
    .select('id')
    .eq('lote_id', id)

  if (animais && animais.length > 0) {
    throw new Error('Não é possível excluir um lote com animais. Mova os animais primeiro.')
  }

  const { error } = await supabase
    .from('lotes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Criar animais identificados para um lote existente (USO OPCIONAL)
// Use esta função APENAS quando o usuário quiser identificar animais individualmente
// O LOTE é o eixo central - animais individuais são opcionais
export async function criarAnimaisIdentificados(loteId: string): Promise<{ criados: number; total: number }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar dados do lote
  const { data: lote, error: loteError } = await supabase
    .from('lotes')
    .select('*')
    .eq('id', loteId)
    .single()

  if (loteError || !lote) throw new Error('Lote não encontrado')

  // Verificar quantos animais já existem
  const { data: animaisExistentes, error: countError } = await supabase
    .from('animais')
    .select('id')
    .eq('lote_id', loteId)
    .eq('status', 'Ativo')

  if (countError) throw countError

  const qtdExistente = animaisExistentes?.length || 0
  const qtdTotal = lote.quantidade_total || 0
  const qtdFaltante = qtdTotal - qtdExistente

  console.log('[criarAnimaisFaltantes] Lote:', loteId, '- Existentes:', qtdExistente, '- Total:', qtdTotal, '- Faltantes:', qtdFaltante)

  if (qtdFaltante <= 0) {
    return { criados: 0, total: qtdExistente }
  }

  // Calcular peso médio por animal
  const pesoMedioPorAnimal = lote.peso_total_entrada && qtdTotal > 0
    ? lote.peso_total_entrada / qtdTotal
    : 0

  // Criar animais faltantes
  const animaisParaInserir = []
  const prefixo = lote.nome?.substring(0, 3).toUpperCase() || 'LOT'

  for (let i = qtdExistente + 1; i <= qtdTotal; i++) {
    const brincoNumero = String(i).padStart(3, '0')
    animaisParaInserir.push({
      usuario_id: user.id,
      lote_id: loteId,
      brinco: `${prefixo}-${brincoNumero}`,
      nome: null,
      sexo: 'Macho', // Padrão
      raca: 'Nelore',
      tipo: lote.tipo_lote === 'engorda' ? 'Engorda' :
            lote.tipo_lote === 'recria' ? 'Recria' :
            lote.tipo_lote === 'cria' ? 'Cria' : 'Terminação',
      data_entrada: lote.data_entrada || new Date().toISOString().split('T')[0],
      peso_entrada: Math.round(pesoMedioPorAnimal * 10) / 10,
      peso_atual: Math.round(pesoMedioPorAnimal * 10) / 10,
      preco_arroba_compra: lote.preco_arroba_compra || null,
      status: 'Ativo'
    })
  }

  const { error: insertError } = await supabase
    .from('animais')
    .insert(animaisParaInserir)

  if (insertError) {
    console.error('[criarAnimaisIdentificados] Erro ao criar animais:', insertError)
    throw new Error('Erro ao criar animais: ' + insertError.message)
  }

  console.log('[criarAnimaisIdentificados] Animais criados:', qtdFaltante)

  return { criados: qtdFaltante, total: qtdTotal }
}

// Alias para compatibilidade com código antigo (deprecado)
export const criarAnimaisFaltantes = criarAnimaisIdentificados

// Buscar lotes com filtros
export async function searchLotes(query: string, status?: string): Promise<LoteWithStats[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('lotes')
    .select(`
      *,
      animais!fk_animais_lote(id, peso_atual)
    `)
    .eq('usuario_id', user.id)

  if (query) {
    queryBuilder = queryBuilder.ilike('nome', `%${query}%`)
  }

  if (status) {
    queryBuilder = queryBuilder.eq('status', status)
  }

  const { data: lotes, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) throw error

  // O LOTE é o eixo central - quantidade_total e peso_medio_animal do lote são a referência principal
  return lotes.map((lote: any) => {
    const animais = lote.animais || []
    const animaisCadastrados = animais.length

    // Quantidade de referência vem do LOTE (não dos animais cadastrados)
    const totalAnimais = lote.quantidade_total || animaisCadastrados

    // Peso médio: priorizar peso_medio_animal do lote (atualizado nas pesagens)
    let pesoMedio = lote.peso_medio_animal || 0
    if (pesoMedio === 0) {
      // Fallback: calcular dos animais cadastrados ou do peso de entrada
      if (animaisCadastrados > 0) {
        pesoMedio = animais.reduce((sum: number, a: any) => sum + (a.peso_atual || 0), 0) / animaisCadastrados
      } else if (lote.peso_total_entrada && lote.quantidade_total) {
        pesoMedio = lote.peso_total_entrada / lote.quantidade_total
      }
    }

    const ocupacao = lote.capacidade_maxima > 0
      ? (totalAnimais / lote.capacidade_maxima) * 100
      : 0

    return {
      ...lote,
      animais: undefined,
      total_animais: totalAnimais,
      peso_medio: Math.round(pesoMedio * 10) / 10,
      ocupacao_percentual: Math.round(ocupacao)
    }
  })
}
