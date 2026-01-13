import { createClient } from '@/lib/supabase/client'
import { registrarSaidaDespesa } from './movimentacoes.service'

// Tipos
export type CategoriaDespesa = 'suplementacao' | 'sal_mineral' | 'medicamentos' | 'mao_de_obra' | 'eletricidade' | 'manutencao' | 'outros'

export interface Despesa {
  id: string
  usuario_id: string
  lote_id: string | null
  categoria: CategoriaDespesa
  descricao: string
  valor: number
  data_despesa: string
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface DespesaWithLote extends Despesa {
  lote?: {
    id: string
    nome: string
  } | null
}

export interface FiltrosDespesa {
  categoria?: CategoriaDespesa
  lote_id?: string | 'sem_lote'
  data_inicio?: string
  data_fim?: string
}

export interface EstatisticasFinanceiras {
  total_gasto: number
  despesas_mes_atual: number
  custo_medio_por_lote: number
  maior_categoria: {
    categoria: CategoriaDespesa
    valor: number
  } | null
  total_por_categoria: Record<CategoriaDespesa, number>
}

// Constantes
export const CATEGORIAS_DESPESA = [
  { value: 'suplementacao' as const, label: 'Suplementação', icon: '🌾' },
  { value: 'sal_mineral' as const, label: 'Sal Mineral', icon: '🧂' },
  { value: 'medicamentos' as const, label: 'Medicamentos', icon: '💊' },
  { value: 'mao_de_obra' as const, label: 'Mão de Obra', icon: '👷' },
  { value: 'eletricidade' as const, label: 'Eletricidade', icon: '⚡' },
  { value: 'manutencao' as const, label: 'Manutenção', icon: '🔧' },
  { value: 'outros' as const, label: 'Outros', icon: '📦' },
]

export function getCategoriaInfo(categoria: CategoriaDespesa) {
  return CATEGORIAS_DESPESA.find(c => c.value === categoria) || CATEGORIAS_DESPESA[6]
}

// Listar todas as despesas do usuário
export async function getDespesas(): Promise<DespesaWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: despesas, error } = await supabase
    .from('despesas')
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('data_despesa', { ascending: false })

  if (error) throw error

  return despesas as DespesaWithLote[]
}

// Buscar despesa por ID
export async function getDespesaById(id: string): Promise<DespesaWithLote | null> {
  const supabase = createClient()

  const { data: despesa, error } = await supabase
    .from('despesas')
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!despesa) return null

  return despesa as DespesaWithLote
}

// Criar nova despesa
export async function createDespesa(despesaData: {
  categoria: CategoriaDespesa
  descricao: string
  valor: number
  data_despesa: string
  lote_id?: string | null
  observacoes?: string | null
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('despesas')
    .insert({
      ...despesaData,
      usuario_id: user.id,
      lote_id: despesaData.lote_id || null
    })
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error

  const despesa = data as DespesaWithLote

  // Registrar movimentação financeira
  try {
    const categoriaInfo = getCategoriaInfo(despesaData.categoria)
    await registrarSaidaDespesa({
      despesa_id: despesa.id,
      lote_id: despesa.lote_id,
      valor: despesa.valor,
      data_despesa: despesa.data_despesa,
      categoria_despesa: categoriaInfo.label,
      descricao: despesa.descricao,
      observacoes: despesa.observacoes,
    })
    console.log('[createDespesa] Movimentação financeira registrada')
  } catch (err) {
    console.error('Erro ao registrar movimentação:', err)
  }

  return despesa
}

// Atualizar despesa
export async function updateDespesa(id: string, despesaData: Partial<Omit<Despesa, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('despesas')
    .update(despesaData)
    .eq('id', id)
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error
  return data as DespesaWithLote
}

// Deletar despesa
export async function deleteDespesa(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('despesas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar despesas com filtros
export async function searchDespesas(query: string, filtros: FiltrosDespesa = {}): Promise<DespesaWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('despesas')
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)

  // Filtro por texto na descrição
  if (query) {
    queryBuilder = queryBuilder.ilike('descricao', `%${query}%`)
  }

  // Filtro por categoria
  if (filtros.categoria) {
    queryBuilder = queryBuilder.eq('categoria', filtros.categoria)
  }

  // Filtro por lote
  if (filtros.lote_id === 'sem_lote') {
    queryBuilder = queryBuilder.is('lote_id', null)
  } else if (filtros.lote_id) {
    queryBuilder = queryBuilder.eq('lote_id', filtros.lote_id)
  }

  // Filtro por período
  if (filtros.data_inicio) {
    queryBuilder = queryBuilder.gte('data_despesa', filtros.data_inicio)
  }
  if (filtros.data_fim) {
    queryBuilder = queryBuilder.lte('data_despesa', filtros.data_fim)
  }

  const { data: despesas, error } = await queryBuilder.order('data_despesa', { ascending: false })

  if (error) throw error

  return despesas as DespesaWithLote[]
}

// Obter estatísticas financeiras
export async function getEstatisticasFinanceiras(): Promise<EstatisticasFinanceiras> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: despesas, error } = await supabase
    .from('despesas')
    .select('*')
    .eq('usuario_id', user.id)

  if (error) throw error

  const todasDespesas = despesas || []

  // Total gasto
  const total_gasto = todasDespesas.reduce((sum, d) => sum + d.valor, 0)

  // Despesas do mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const despesas_mes_atual = todasDespesas
    .filter(d => d.data_despesa >= inicioMes)
    .reduce((sum, d) => sum + d.valor, 0)

  // Total por categoria
  const total_por_categoria: Record<CategoriaDespesa, number> = {
    suplementacao: 0,
    sal_mineral: 0,
    medicamentos: 0,
    mao_de_obra: 0,
    eletricidade: 0,
    manutencao: 0,
    outros: 0
  }

  todasDespesas.forEach(d => {
    total_por_categoria[d.categoria as CategoriaDespesa] += d.valor
  })

  // Maior categoria
  let maior_categoria: { categoria: CategoriaDespesa; valor: number } | null = null
  for (const [cat, valor] of Object.entries(total_por_categoria)) {
    if (valor > 0 && (!maior_categoria || valor > maior_categoria.valor)) {
      maior_categoria = { categoria: cat as CategoriaDespesa, valor }
    }
  }

  // Custo médio por lote (apenas despesas vinculadas a lotes)
  const despesasComLote = todasDespesas.filter(d => d.lote_id)
  const lotesUnicos = new Set(despesasComLote.map(d => d.lote_id))
  const totalComLote = despesasComLote.reduce((sum, d) => sum + d.valor, 0)
  const custo_medio_por_lote = lotesUnicos.size > 0 ? totalComLote / lotesUnicos.size : 0

  return {
    total_gasto: Math.round(total_gasto * 100) / 100,
    despesas_mes_atual: Math.round(despesas_mes_atual * 100) / 100,
    custo_medio_por_lote: Math.round(custo_medio_por_lote * 100) / 100,
    maior_categoria,
    total_por_categoria
  }
}

// Obter despesas de um lote específico
export async function getDespesasPorLote(loteId: string): Promise<Despesa[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: despesas, error } = await supabase
    .from('despesas')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .order('data_despesa', { ascending: false })

  if (error) throw error

  return despesas as Despesa[]
}

// Obter despesas agrupadas por mês
export async function getDespesasPorMes(loteId?: string): Promise<{ mes: string; despesas: DespesaWithLote[]; total: number }[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let query = supabase
    .from('despesas')
    .select(`
      *,
      lote:lotes!despesas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('data_despesa', { ascending: false })

  if (loteId) {
    query = query.eq('lote_id', loteId)
  }

  const { data: despesas, error } = await query

  if (error) throw error

  // Agrupar por mês
  const porMes: Record<string, { despesas: DespesaWithLote[]; total: number }> = {}

  despesas?.forEach((d: any) => {
    const date = new Date(d.data_despesa + 'T00:00:00')
    const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!porMes[mesKey]) {
      porMes[mesKey] = { despesas: [], total: 0 }
    }
    porMes[mesKey].despesas.push(d as DespesaWithLote)
    porMes[mesKey].total += d.valor
  })

  return Object.entries(porMes)
    .map(([mes, data]) => ({ mes, ...data }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
}

// Interface para resumo financeiro completo
export interface ResumoFinanceiroGeral {
  investimento_inicial: number      // Custo total de compra dos lotes
  custeios: number                   // Total de despesas operacionais
  total_investido: number            // Investimento inicial + custeios
  valor_estoque_atual: number        // Valor atual baseado na cotação
  lucro_ou_prejuizo: number          // Valor estoque - total investido
  margem_percentual: number          // (Lucro / Total investido) * 100
  total_animais: number
  total_arrobas: number
  preco_arroba_usado: number
}

export interface ResumoFinanceiroLote {
  lote_id: string
  lote_nome: string
  investimento_inicial: number      // Custo total de compra do lote
  custeios: number                   // Despesas do lote
  total_investido: number
  valor_estoque_atual: number
  lucro_ou_prejuizo: number
  margem_percentual: number
  total_animais: number
  total_arrobas: number
  custo_por_cabeca: number
  custo_por_arroba: number
}

// Calcular resumo financeiro geral (todos os lotes ativos)
export async function getResumoFinanceiroGeral(precoArrobaAtual: number): Promise<ResumoFinanceiroGeral> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar lotes ativos com custo_total
  const { data: lotes } = await supabase
    .from('lotes')
    .select('id, custo_total, quantidade_total, peso_total_entrada')
    .eq('usuario_id', user.id)
    .eq('status', 'ativo')

  // Calcular investimento inicial (soma dos custos de compra)
  const investimento_inicial = lotes?.reduce((sum, l) => sum + (l.custo_total || 0), 0) || 0

  // Buscar IDs dos lotes ativos
  const lotesIds = lotes?.map(l => l.id) || []

  // Buscar todas as despesas (custeios)
  const { data: despesas } = await supabase
    .from('despesas')
    .select('valor, lote_id')
    .eq('usuario_id', user.id)

  // Total de custeios (despesas de lotes ativos + despesas sem lote)
  const custeios = despesas?.reduce((sum, d) => {
    // Incluir despesas vinculadas a lotes ativos ou sem lote vinculado
    if (!d.lote_id || lotesIds.includes(d.lote_id)) {
      return sum + d.valor
    }
    return sum
  }, 0) || 0

  const total_investido = investimento_inicial + custeios

  // Calcular valor do estoque atual
  const total_animais = lotes?.reduce((sum, l) => sum + (l.quantidade_total || 0), 0) || 0
  const total_kg = lotes?.reduce((sum, l) => sum + (l.peso_total_entrada || 0), 0) || 0
  const total_arrobas = total_kg / 30
  const valor_estoque_atual = total_arrobas * precoArrobaAtual

  // Calcular lucro/prejuízo e margem
  const lucro_ou_prejuizo = valor_estoque_atual - total_investido
  const margem_percentual = total_investido > 0
    ? (lucro_ou_prejuizo / total_investido) * 100
    : 0

  return {
    investimento_inicial: Math.round(investimento_inicial * 100) / 100,
    custeios: Math.round(custeios * 100) / 100,
    total_investido: Math.round(total_investido * 100) / 100,
    valor_estoque_atual: Math.round(valor_estoque_atual * 100) / 100,
    lucro_ou_prejuizo: Math.round(lucro_ou_prejuizo * 100) / 100,
    margem_percentual: Math.round(margem_percentual * 10) / 10,
    total_animais,
    total_arrobas: Math.round(total_arrobas * 100) / 100,
    preco_arroba_usado: precoArrobaAtual
  }
}

// Calcular resumo financeiro de um lote específico
export async function getResumoFinanceiroLote(loteId: string, precoArrobaAtual: number): Promise<ResumoFinanceiroLote | null> {
  const supabase = createClient()

  // Buscar dados do lote
  const { data: lote, error } = await supabase
    .from('lotes')
    .select('id, nome, custo_total, quantidade_total, peso_total_entrada')
    .eq('id', loteId)
    .single()

  if (error || !lote) return null

  const investimento_inicial = lote.custo_total || 0

  // Buscar despesas do lote
  const { data: despesas } = await supabase
    .from('despesas')
    .select('valor')
    .eq('lote_id', loteId)

  const custeios = despesas?.reduce((sum, d) => sum + d.valor, 0) || 0
  const total_investido = investimento_inicial + custeios

  // Calcular valor do estoque
  const total_animais = lote.quantidade_total || 0
  const total_kg = lote.peso_total_entrada || 0
  const total_arrobas = total_kg / 30
  const valor_estoque_atual = total_arrobas * precoArrobaAtual

  // Calcular lucro/prejuízo e margem
  const lucro_ou_prejuizo = valor_estoque_atual - total_investido
  const margem_percentual = total_investido > 0
    ? (lucro_ou_prejuizo / total_investido) * 100
    : 0

  // Custo por cabeça e por arroba
  const custo_por_cabeca = total_animais > 0 ? total_investido / total_animais : 0
  const custo_por_arroba = total_arrobas > 0 ? total_investido / total_arrobas : 0

  return {
    lote_id: lote.id,
    lote_nome: lote.nome,
    investimento_inicial: Math.round(investimento_inicial * 100) / 100,
    custeios: Math.round(custeios * 100) / 100,
    total_investido: Math.round(total_investido * 100) / 100,
    valor_estoque_atual: Math.round(valor_estoque_atual * 100) / 100,
    lucro_ou_prejuizo: Math.round(lucro_ou_prejuizo * 100) / 100,
    margem_percentual: Math.round(margem_percentual * 10) / 10,
    total_animais,
    total_arrobas: Math.round(total_arrobas * 100) / 100,
    custo_por_cabeca: Math.round(custo_por_cabeca * 100) / 100,
    custo_por_arroba: Math.round(custo_por_arroba * 100) / 100
  }
}

// Calcular custo/cabeça/mês consolidado (todos os lotes ativos)
export async function getCustoCabecaMesGeral(): Promise<{
  custoMesAtual: number
  custoCabecaMesAtual: number
  custoMesAnterior: number
  custoCabecaMesAnterior: number
  totalAnimaisAtivos: number
  variacao: number
}> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar total de animais dos lotes ativos
  const { data: lotes } = await supabase
    .from('lotes')
    .select('id, quantidade_total')
    .eq('usuario_id', user.id)
    .eq('status', 'ativo')

  const totalAnimaisAtivos = lotes?.reduce((sum, l) => sum + (l.quantidade_total || 0), 0) || 0

  // Buscar despesas do mês atual e anterior
  const hoje = new Date()
  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0]

  const { data: despesas } = await supabase
    .from('despesas')
    .select('valor, data_despesa')
    .eq('usuario_id', user.id)
    .gte('data_despesa', inicioMesAnterior)

  const despesasMesAtual = (despesas || []).filter(d => d.data_despesa >= inicioMesAtual)
  const despesasMesAnterior = (despesas || []).filter(d => d.data_despesa >= inicioMesAnterior && d.data_despesa <= fimMesAnterior)

  const custoMesAtual = despesasMesAtual.reduce((sum, d) => sum + d.valor, 0)
  const custoMesAnterior = despesasMesAnterior.reduce((sum, d) => sum + d.valor, 0)

  const custoCabecaMesAtual = totalAnimaisAtivos > 0 ? custoMesAtual / totalAnimaisAtivos : 0
  const custoCabecaMesAnterior = totalAnimaisAtivos > 0 ? custoMesAnterior / totalAnimaisAtivos : 0

  // Calcular variação percentual
  const variacao = custoCabecaMesAnterior > 0
    ? ((custoCabecaMesAtual - custoCabecaMesAnterior) / custoCabecaMesAnterior) * 100
    : 0

  return {
    custoMesAtual: Math.round(custoMesAtual * 100) / 100,
    custoCabecaMesAtual: Math.round(custoCabecaMesAtual * 100) / 100,
    custoMesAnterior: Math.round(custoMesAnterior * 100) / 100,
    custoCabecaMesAnterior: Math.round(custoCabecaMesAnterior * 100) / 100,
    totalAnimaisAtivos,
    variacao: Math.round(variacao * 10) / 10
  }
}

// Calcular custo por cabeça do mês para um lote
export async function getCustoCabecaMes(loteId: string, totalAnimais: number): Promise<{ mes: string; custoTotal: number; custoCabeca: number }[]> {
  const despesas = await getDespesasPorLote(loteId)

  // Agrupar por mês
  const porMes: Record<string, number> = {}

  despesas.forEach(d => {
    const date = new Date(d.data_despesa + 'T00:00:00')
    const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    porMes[mesKey] = (porMes[mesKey] || 0) + d.valor
  })

  return Object.entries(porMes)
    .map(([mes, custoTotal]) => ({
      mes,
      custoTotal,
      custoCabeca: totalAnimais > 0 ? custoTotal / totalAnimais : 0
    }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
}
