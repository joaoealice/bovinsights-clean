import { createClient } from '@/lib/supabase/client'

// Tipos
export type TipoMovimentacao = 'entrada' | 'saida'
export type CategoriaMovimentacao =
  | 'venda'           // Entrada de venda
  | 'recebimento'     // Recebimento de conta a prazo
  | 'despesa'         // Saída de despesa
  | 'pagamento'       // Pagamento de conta
  | 'compra_lote'     // Compra de lote/animais
  | 'ajuste'          // Ajuste manual
  | 'estorno'         // Estorno/cancelamento

export interface Movimentacao {
  id: string
  usuario_id: string
  tipo: TipoMovimentacao
  categoria: CategoriaMovimentacao
  descricao: string
  valor: number
  data_movimentacao: string
  // Referências
  venda_id: string | null
  despesa_id: string | null
  conta_id: string | null
  lote_id: string | null
  // Detalhes extras
  quantidade_animais: number | null
  peso_arrobas: number | null
  comprador_fornecedor: string | null
  forma_pagamento: string | null
  observacoes: string | null
  // Auditoria
  created_at: string
  updated_at: string
}

export interface MovimentacaoWithRelations extends Movimentacao {
  lote?: {
    id: string
    nome: string
  } | null
  venda?: {
    id: string
    comprador: string | null
  } | null
}

export interface FiltroMovimentacao {
  tipo?: TipoMovimentacao
  categoria?: CategoriaMovimentacao
  lote_id?: string
  data_inicio?: string
  data_fim?: string
}

export interface ResumoMovimentacoes {
  total_entradas: number
  total_saidas: number
  saldo_periodo: number
  quantidade_movimentacoes: number
  entradas_por_categoria: Record<string, number>
  saidas_por_categoria: Record<string, number>
}

// Listar movimentações com filtros
export async function getMovimentacoes(filtros: FiltroMovimentacao = {}): Promise<MovimentacaoWithRelations[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let query = supabase
    .from('movimentacoes')
    .select(`
      *,
      lote:lotes!movimentacoes_lote_id_fkey(id, nome),
      venda:vendas!movimentacoes_venda_id_fkey(id, comprador)
    `)
    .eq('usuario_id', user.id)

  // Aplicar filtros
  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  if (filtros.lote_id) {
    query = query.eq('lote_id', filtros.lote_id)
  }
  if (filtros.data_inicio) {
    query = query.gte('data_movimentacao', filtros.data_inicio)
  }
  if (filtros.data_fim) {
    query = query.lte('data_movimentacao', filtros.data_fim)
  }

  const { data, error } = await query.order('data_movimentacao', { ascending: false })

  if (error) throw error

  return data as MovimentacaoWithRelations[]
}

// Criar movimentação
export async function createMovimentacao(movimentacaoData: {
  tipo: TipoMovimentacao
  categoria: CategoriaMovimentacao
  descricao: string
  valor: number
  data_movimentacao: string
  venda_id?: string | null
  despesa_id?: string | null
  conta_id?: string | null
  lote_id?: string | null
  quantidade_animais?: number | null
  peso_arrobas?: number | null
  comprador_fornecedor?: string | null
  forma_pagamento?: string | null
  observacoes?: string | null
}): Promise<Movimentacao> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('movimentacoes')
    .insert({
      ...movimentacaoData,
      usuario_id: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return data as Movimentacao
}

// Registrar entrada de venda
export async function registrarEntradaVenda(vendaData: {
  venda_id: string
  lote_id?: string | null
  valor: number
  data_venda: string
  quantidade_animais: number
  peso_arrobas: number
  comprador?: string | null
  forma_pagamento: string
  observacoes?: string | null
}): Promise<Movimentacao> {
  const descricao = vendaData.comprador
    ? `Venda para ${vendaData.comprador}`
    : 'Venda de animais'

  return createMovimentacao({
    tipo: 'entrada',
    categoria: 'venda',
    descricao,
    valor: vendaData.valor,
    data_movimentacao: vendaData.data_venda,
    venda_id: vendaData.venda_id,
    lote_id: vendaData.lote_id,
    quantidade_animais: vendaData.quantidade_animais,
    peso_arrobas: vendaData.peso_arrobas,
    comprador_fornecedor: vendaData.comprador,
    forma_pagamento: vendaData.forma_pagamento,
    observacoes: vendaData.observacoes,
  })
}

// Registrar recebimento de conta a prazo
export async function registrarRecebimento(recebimentoData: {
  conta_id: string
  venda_id?: string | null
  lote_id?: string | null
  valor: number
  data_recebimento: string
  comprador?: string | null
  forma_pagamento?: string | null
  observacoes?: string | null
}): Promise<Movimentacao> {
  const descricao = recebimentoData.comprador
    ? `Recebimento de ${recebimentoData.comprador}`
    : 'Recebimento de venda a prazo'

  return createMovimentacao({
    tipo: 'entrada',
    categoria: 'recebimento',
    descricao,
    valor: recebimentoData.valor,
    data_movimentacao: recebimentoData.data_recebimento,
    conta_id: recebimentoData.conta_id,
    venda_id: recebimentoData.venda_id,
    lote_id: recebimentoData.lote_id,
    comprador_fornecedor: recebimentoData.comprador,
    forma_pagamento: recebimentoData.forma_pagamento,
    observacoes: recebimentoData.observacoes,
  })
}

// Registrar saída de despesa
export async function registrarSaidaDespesa(despesaData: {
  despesa_id: string
  lote_id?: string | null
  valor: number
  data_despesa: string
  categoria_despesa: string
  descricao: string
  observacoes?: string | null
}): Promise<Movimentacao> {
  return createMovimentacao({
    tipo: 'saida',
    categoria: 'despesa',
    descricao: `${despesaData.categoria_despesa}: ${despesaData.descricao}`,
    valor: despesaData.valor,
    data_movimentacao: despesaData.data_despesa,
    despesa_id: despesaData.despesa_id,
    lote_id: despesaData.lote_id,
    observacoes: despesaData.observacoes,
  })
}

// Registrar saída de compra de lote
export async function registrarCompraLote(compraData: {
  lote_id: string
  valor: number
  data_compra: string
  quantidade_animais: number
  peso_arrobas?: number | null
  fornecedor?: string | null
  observacoes?: string | null
}): Promise<Movimentacao> {
  const descricao = compraData.fornecedor
    ? `Compra de lote - ${compraData.fornecedor}`
    : 'Compra de lote'

  return createMovimentacao({
    tipo: 'saida',
    categoria: 'compra_lote',
    descricao,
    valor: compraData.valor,
    data_movimentacao: compraData.data_compra,
    lote_id: compraData.lote_id,
    quantidade_animais: compraData.quantidade_animais,
    peso_arrobas: compraData.peso_arrobas,
    comprador_fornecedor: compraData.fornecedor,
    observacoes: compraData.observacoes,
  })
}

// Registrar estorno
export async function registrarEstorno(estornoData: {
  tipo_original: TipoMovimentacao
  valor: number
  data_estorno: string
  descricao: string
  venda_id?: string | null
  despesa_id?: string | null
  conta_id?: string | null
  lote_id?: string | null
  observacoes?: string | null
}): Promise<Movimentacao> {
  // Estorno inverte o tipo (entrada vira saída e vice-versa)
  const tipo: TipoMovimentacao = estornoData.tipo_original === 'entrada' ? 'saida' : 'entrada'

  return createMovimentacao({
    tipo,
    categoria: 'estorno',
    descricao: `ESTORNO: ${estornoData.descricao}`,
    valor: estornoData.valor,
    data_movimentacao: estornoData.data_estorno,
    venda_id: estornoData.venda_id,
    despesa_id: estornoData.despesa_id,
    conta_id: estornoData.conta_id,
    lote_id: estornoData.lote_id,
    observacoes: estornoData.observacoes,
  })
}

// Obter resumo de movimentações
export async function getResumoMovimentacoes(filtros: FiltroMovimentacao = {}): Promise<ResumoMovimentacoes> {
  const movimentacoes = await getMovimentacoes(filtros)

  const entradas = movimentacoes.filter(m => m.tipo === 'entrada')
  const saidas = movimentacoes.filter(m => m.tipo === 'saida')

  const total_entradas = entradas.reduce((sum, m) => sum + m.valor, 0)
  const total_saidas = saidas.reduce((sum, m) => sum + m.valor, 0)

  // Agrupar por categoria
  const entradas_por_categoria: Record<string, number> = {}
  const saidas_por_categoria: Record<string, number> = {}

  entradas.forEach(m => {
    entradas_por_categoria[m.categoria] = (entradas_por_categoria[m.categoria] || 0) + m.valor
  })

  saidas.forEach(m => {
    saidas_por_categoria[m.categoria] = (saidas_por_categoria[m.categoria] || 0) + m.valor
  })

  return {
    total_entradas: Math.round(total_entradas * 100) / 100,
    total_saidas: Math.round(total_saidas * 100) / 100,
    saldo_periodo: Math.round((total_entradas - total_saidas) * 100) / 100,
    quantidade_movimentacoes: movimentacoes.length,
    entradas_por_categoria,
    saidas_por_categoria,
  }
}

// Obter extrato (movimentações ordenadas por data com saldo acumulado)
export async function getExtrato(filtros: FiltroMovimentacao = {}): Promise<Array<MovimentacaoWithRelations & { saldo_acumulado: number }>> {
  const movimentacoes = await getMovimentacoes(filtros)

  // Ordenar por data crescente para calcular saldo
  const ordenadas = [...movimentacoes].sort((a, b) =>
    new Date(a.data_movimentacao).getTime() - new Date(b.data_movimentacao).getTime()
  )

  let saldo = 0
  return ordenadas.map(m => {
    if (m.tipo === 'entrada') {
      saldo += m.valor
    } else {
      saldo -= m.valor
    }
    return {
      ...m,
      saldo_acumulado: Math.round(saldo * 100) / 100
    }
  })
}

// Deletar movimentação (apenas para ajustes manuais)
export async function deleteMovimentacao(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('movimentacoes')
    .delete()
    .eq('id', id)

  if (error) throw error
}
