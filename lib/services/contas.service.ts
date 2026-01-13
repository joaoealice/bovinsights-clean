import { createClient } from '@/lib/supabase/client'

// Tipos
export type TipoConta = 'pagar' | 'receber'
export type StatusConta = 'pendente' | 'pago' | 'parcial' | 'cancelado'
export type OrigemConta = 'venda' | 'despesa' | 'manual'

export interface Conta {
  id: string
  usuario_id: string
  tipo: TipoConta
  origem: OrigemConta
  referencia_id: string | null
  descricao: string
  valor: number
  data_emissao: string
  data_vencimento: string
  data_pagamento: string | null
  status: StatusConta
  valor_pago: number
  lote_id: string | null
  venda_id: string | null
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface ContaWithRelations extends Conta {
  lote?: {
    id: string
    nome: string
  } | null
  venda?: {
    id: string
    comprador: string | null
  } | null
}

export interface FiltroConta {
  tipo?: TipoConta
  status?: StatusConta
  origem?: OrigemConta
  lote_id?: string
  data_inicio?: string
  data_fim?: string
}

export interface ResumoConta {
  total_a_receber: number
  total_a_pagar: number
  recebido_mes: number
  pago_mes: number
  vencidas: number
  a_vencer_7_dias: number
}

// Listar todas as contas do usuário
export async function getContas(filtros: FiltroConta = {}): Promise<ContaWithRelations[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let query = supabase
    .from('contas')
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .eq('usuario_id', user.id)

  // Aplicar filtros
  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  if (filtros.status) {
    query = query.eq('status', filtros.status)
  }
  if (filtros.origem) {
    query = query.eq('origem', filtros.origem)
  }
  if (filtros.lote_id) {
    query = query.eq('lote_id', filtros.lote_id)
  }
  if (filtros.data_inicio) {
    query = query.gte('data_vencimento', filtros.data_inicio)
  }
  if (filtros.data_fim) {
    query = query.lte('data_vencimento', filtros.data_fim)
  }

  const { data: contas, error } = await query.order('data_vencimento', { ascending: true })

  if (error) throw error

  return contas as ContaWithRelations[]
}

// Buscar conta por ID
export async function getContaById(id: string): Promise<ContaWithRelations | null> {
  const supabase = createClient()

  const { data: conta, error } = await supabase
    .from('contas')
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!conta) return null

  return conta as ContaWithRelations
}

// Criar nova conta
export async function createConta(contaData: {
  tipo: TipoConta
  origem: OrigemConta
  referencia_id?: string | null
  descricao: string
  valor: number
  data_emissao: string
  data_vencimento: string
  lote_id?: string | null
  venda_id?: string | null
  forma_pagamento?: string | null
  observacoes?: string | null
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('contas')
    .insert({
      ...contaData,
      usuario_id: user.id,
      status: 'pendente',
      valor_pago: 0
    })
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .single()

  if (error) throw error
  return data as ContaWithRelations
}

// Criar conta a receber a partir de uma venda a prazo
export async function criarContaReceberVenda(vendaData: {
  venda_id: string
  lote_id?: string | null
  comprador?: string | null
  valor: number
  data_venda: string
  data_vencimento: string
}) {
  const descricao = vendaData.comprador
    ? `Venda a prazo - ${vendaData.comprador}`
    : 'Venda a prazo'

  return createConta({
    tipo: 'receber',
    origem: 'venda',
    referencia_id: vendaData.venda_id,
    descricao,
    valor: vendaData.valor,
    data_emissao: vendaData.data_venda,
    data_vencimento: vendaData.data_vencimento,
    lote_id: vendaData.lote_id,
    venda_id: vendaData.venda_id
  })
}

// Criar conta recebida (já paga) a partir de uma venda à vista
export async function criarContaRecebidaVenda(vendaData: {
  venda_id: string
  lote_id?: string | null
  comprador?: string | null
  valor: number
  data_venda: string
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const descricao = vendaData.comprador
    ? `Venda à vista - ${vendaData.comprador}`
    : 'Venda à vista'

  const { data, error } = await supabase
    .from('contas')
    .insert({
      usuario_id: user.id,
      tipo: 'receber',
      origem: 'venda',
      referencia_id: vendaData.venda_id,
      descricao,
      valor: vendaData.valor,
      data_emissao: vendaData.data_venda,
      data_vencimento: vendaData.data_venda,
      data_pagamento: vendaData.data_venda,
      status: 'pago',
      valor_pago: vendaData.valor,
      lote_id: vendaData.lote_id || null,
      venda_id: vendaData.venda_id
    })
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .single()

  if (error) throw error
  return data as ContaWithRelations
}

// Atualizar conta
export async function updateConta(id: string, contaData: Partial<{
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: StatusConta
  valor_pago: number
  forma_pagamento: string | null
  observacoes: string | null
}>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contas')
    .update(contaData)
    .eq('id', id)
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .single()

  if (error) throw error
  return data as ContaWithRelations
}

// Registrar pagamento (parcial ou total)
export async function registrarPagamento(id: string, valorPago: number, dataPagamento?: string) {
  const supabase = createClient()

  // Buscar conta atual
  const { data: contaAtual } = await supabase
    .from('contas')
    .select('valor, valor_pago')
    .eq('id', id)
    .single()

  if (!contaAtual) throw new Error('Conta não encontrada')

  const novoValorPago = (contaAtual.valor_pago || 0) + valorPago
  const status: StatusConta = novoValorPago >= contaAtual.valor ? 'pago' : 'parcial'

  const { data, error } = await supabase
    .from('contas')
    .update({
      valor_pago: novoValorPago,
      status,
      data_pagamento: status === 'pago' ? (dataPagamento || new Date().toISOString().split('T')[0]) : null
    })
    .eq('id', id)
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .single()

  if (error) throw error
  return data as ContaWithRelations
}

// Cancelar conta
export async function cancelarConta(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contas')
    .update({ status: 'cancelado' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Deletar conta
export async function deleteConta(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('contas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Obter resumo das contas
export async function getResumoConta(): Promise<ResumoConta> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: contas, error } = await supabase
    .from('contas')
    .select('*')
    .eq('usuario_id', user.id)
    .neq('status', 'cancelado')

  if (error) throw error

  const hoje = new Date()
  const em7Dias = new Date()
  em7Dias.setDate(em7Dias.getDate() + 7)
  const hojeStr = hoje.toISOString().split('T')[0]
  const em7DiasStr = em7Dias.toISOString().split('T')[0]

  // Início do mês atual
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]

  const todasContas = contas || []

  // Total a receber (pendentes + parciais)
  const total_a_receber = todasContas
    .filter(c => c.tipo === 'receber' && ['pendente', 'parcial'].includes(c.status))
    .reduce((sum, c) => sum + (c.valor - (c.valor_pago || 0)), 0)

  // Total a pagar (pendentes + parciais)
  const total_a_pagar = todasContas
    .filter(c => c.tipo === 'pagar' && ['pendente', 'parcial'].includes(c.status))
    .reduce((sum, c) => sum + (c.valor - (c.valor_pago || 0)), 0)

  // Recebido no mês
  const recebido_mes = todasContas
    .filter(c => c.tipo === 'receber' && c.data_pagamento && c.data_pagamento >= inicioMes)
    .reduce((sum, c) => sum + (c.valor_pago || 0), 0)

  // Pago no mês
  const pago_mes = todasContas
    .filter(c => c.tipo === 'pagar' && c.data_pagamento && c.data_pagamento >= inicioMes)
    .reduce((sum, c) => sum + (c.valor_pago || 0), 0)

  // Vencidas (não pagas e data_vencimento < hoje)
  const vencidas = todasContas
    .filter(c => ['pendente', 'parcial'].includes(c.status) && c.data_vencimento < hojeStr)
    .length

  // A vencer nos próximos 7 dias
  const a_vencer_7_dias = todasContas
    .filter(c =>
      ['pendente', 'parcial'].includes(c.status) &&
      c.data_vencimento >= hojeStr &&
      c.data_vencimento <= em7DiasStr
    )
    .length

  return {
    total_a_receber: Math.round(total_a_receber * 100) / 100,
    total_a_pagar: Math.round(total_a_pagar * 100) / 100,
    recebido_mes: Math.round(recebido_mes * 100) / 100,
    pago_mes: Math.round(pago_mes * 100) / 100,
    vencidas,
    a_vencer_7_dias
  }
}

// Obter contas por venda
export async function getContasPorVenda(vendaId: string): Promise<ContaWithRelations[]> {
  const supabase = createClient()

  const { data: contas, error } = await supabase
    .from('contas')
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .eq('venda_id', vendaId)
    .order('data_vencimento', { ascending: true })

  if (error) throw error

  return contas as ContaWithRelations[]
}

// Obter contas vencidas
export async function getContasVencidas(): Promise<ContaWithRelations[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hoje = new Date().toISOString().split('T')[0]

  const { data: contas, error } = await supabase
    .from('contas')
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .eq('usuario_id', user.id)
    .in('status', ['pendente', 'parcial'])
    .lt('data_vencimento', hoje)
    .order('data_vencimento', { ascending: true })

  if (error) throw error

  return contas as ContaWithRelations[]
}

// Obter contas a vencer
export async function getContasAVencer(dias: number = 7): Promise<ContaWithRelations[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hoje = new Date()
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + dias)

  const hojeStr = hoje.toISOString().split('T')[0]
  const dataLimiteStr = dataLimite.toISOString().split('T')[0]

  const { data: contas, error } = await supabase
    .from('contas')
    .select(`
      *,
      lote:lotes!contas_lote_id_fkey(id, nome),
      venda:vendas!contas_venda_id_fkey(id, comprador)
    `)
    .eq('usuario_id', user.id)
    .in('status', ['pendente', 'parcial'])
    .gte('data_vencimento', hojeStr)
    .lte('data_vencimento', dataLimiteStr)
    .order('data_vencimento', { ascending: true })

  if (error) throw error

  return contas as ContaWithRelations[]
}
