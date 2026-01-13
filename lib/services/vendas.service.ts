import { createClient } from '@/lib/supabase/client'
import { criarContaReceberVenda, criarContaRecebidaVenda } from './contas.service'
import { registrarEntradaVenda } from './movimentacoes.service'

// Tipos
export type ModoPagamento = 'a_vista' | 'permuta' | 'prazo'
export type StatusPagamento = 'pendente' | 'pago' | 'parcial'

export interface Venda {
  id: string
  usuario_id: string
  lote_id: string | null
  data_venda: string
  quantidade_cabecas: number
  peso_total_kg: number
  peso_total_arrobas: number
  preco_arroba_venda: number
  valor_total_venda: number
  custo_total: number
  lucro_bruto: number
  margem_percentual: number
  atingiu_objetivo: boolean
  comprador?: string
  observacoes?: string
  // Pagamento
  modo_pagamento: ModoPagamento
  data_vencimento?: string
  valor_permuta?: number
  descricao_permuta?: string
  status_pagamento: StatusPagamento
  // Post Mortem
  post_mortem_data?: string
  post_mortem_frigorifico?: string
  post_mortem_rendimento_carcaca?: number
  created_at: string
  updated_at: string
}

export interface VendaWithLote extends Venda {
  lote?: {
    id: string
    nome: string
  } | null
}

export interface EstatisticasVendas {
  total_vendas: number
  valor_total_vendido: number
  lucro_total: number
  margem_media: number
  vendas_atingiram_objetivo: number
  percentual_objetivo: number
  maior_venda: VendaWithLote | null
  rendimento_carcaca_medio: number | null
}

// Constante objetivo padrão
export const OBJETIVO_MARGEM = 25 // 25%

// Converter kg para arrobas (peso vivo / 30 = arrobas de carcaça)
// Na pecuária de corte: rendimento de carcaça ~50%, então 30kg peso vivo = 1@
export function kgToArrobas(kg: number): number {
  return kg / 30
}

// Converter arrobas para kg
export function arrobasToKg(arrobas: number): number {
  return arrobas * 30
}

// Calcular valor total da venda
export function calcularValorVenda(pesoArrobas: number, precoArroba: number): number {
  return pesoArrobas * precoArroba
}

// Calcular lucro bruto
export function calcularLucroBruto(valorVenda: number, custoTotal: number): number {
  return valorVenda - custoTotal
}

// Calcular margem percentual
export function calcularMargem(lucroBruto: number, custoTotal: number): number {
  if (custoTotal <= 0) return 0
  return (lucroBruto / custoTotal) * 100
}

// Listar todas as vendas do usuário
export async function getVendas(): Promise<VendaWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('data_venda', { ascending: false })

  if (error) throw error

  return vendas as VendaWithLote[]
}

// Buscar venda por ID
export async function getVendaById(id: string): Promise<VendaWithLote | null> {
  const supabase = createClient()

  const { data: venda, error } = await supabase
    .from('vendas')
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!venda) return null

  return venda as VendaWithLote
}

// Criar nova venda
export async function createVenda(vendaData: {
  lote_id?: string | null
  data_venda: string
  quantidade_cabecas: number
  peso_total_kg: number
  preco_arroba_venda: number
  custo_total: number
  comprador?: string
  observacoes?: string
  // Pagamento
  modo_pagamento?: ModoPagamento
  data_vencimento?: string
  valor_permuta?: number
  descricao_permuta?: string
  // Post Mortem
  post_mortem_data?: string
  post_mortem_frigorifico?: string
  post_mortem_rendimento_carcaca?: number
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Calcular valores
  const peso_total_arrobas = kgToArrobas(vendaData.peso_total_kg)
  const valor_total_venda = calcularValorVenda(peso_total_arrobas, vendaData.preco_arroba_venda)
  const lucro_bruto = calcularLucroBruto(valor_total_venda, vendaData.custo_total)
  const margem_percentual = calcularMargem(lucro_bruto, vendaData.custo_total)
  const atingiu_objetivo = margem_percentual >= OBJETIVO_MARGEM

  // Determinar status de pagamento inicial
  const modo_pagamento = vendaData.modo_pagamento || 'a_vista'
  const status_pagamento: StatusPagamento = modo_pagamento === 'a_vista' ? 'pago' : 'pendente'

  const { data, error } = await supabase
    .from('vendas')
    .insert({
      ...vendaData,
      usuario_id: user.id,
      lote_id: vendaData.lote_id || null,
      peso_total_arrobas: Math.round(peso_total_arrobas * 100) / 100,
      valor_total_venda: Math.round(valor_total_venda * 100) / 100,
      lucro_bruto: Math.round(lucro_bruto * 100) / 100,
      margem_percentual: Math.round(margem_percentual * 100) / 100,
      atingiu_objetivo,
      modo_pagamento,
      status_pagamento,
      data_vencimento: vendaData.data_vencimento || null,
      valor_permuta: vendaData.valor_permuta || null,
      descricao_permuta: vendaData.descricao_permuta || null
    })
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error

  const venda = data as VendaWithLote

  // Se tiver lote vinculado, marcar o lote e os animais como vendidos
  if (venda.lote_id) {
    try {
      // Marcar lote como vendido
      await supabase
        .from('lotes')
        .update({ status: 'vendido' })
        .eq('id', venda.lote_id)
      console.log('[createVenda] Lote marcado como vendido:', venda.lote_id)

      // Marcar todos os animais do lote como vendidos
      const { error: animaisError } = await supabase
        .from('animais')
        .update({ status: 'Vendido' })
        .eq('lote_id', venda.lote_id)
        .eq('status', 'Ativo')

      if (animaisError) {
        console.error('Erro ao marcar animais como vendidos:', animaisError)
      } else {
        console.log('[createVenda] Animais do lote marcados como vendidos')
      }
    } catch (err) {
      console.error('Erro ao atualizar lote/animais:', err)
    }
  }

  // Registrar movimentação financeira
  try {
    const formaPagamento = modo_pagamento === 'a_vista' ? 'À Vista'
      : modo_pagamento === 'prazo' ? 'A Prazo'
      : 'Permuta'

    await registrarEntradaVenda({
      venda_id: venda.id,
      lote_id: venda.lote_id,
      valor: venda.valor_total_venda,
      data_venda: venda.data_venda,
      quantidade_animais: venda.quantidade_cabecas,
      peso_arrobas: venda.peso_total_arrobas,
      comprador: venda.comprador,
      forma_pagamento: formaPagamento,
      observacoes: venda.observacoes,
    })
    console.log('[createVenda] Movimentação financeira registrada')
  } catch (err) {
    console.error('Erro ao registrar movimentação:', err)
  }

  // Criar conta baseado no modo de pagamento
  if (modo_pagamento === 'prazo' && vendaData.data_vencimento) {
    // Venda a prazo: criar conta a receber (pendente)
    try {
      await criarContaReceberVenda({
        venda_id: venda.id,
        lote_id: venda.lote_id,
        comprador: venda.comprador,
        valor: venda.valor_total_venda,
        data_venda: venda.data_venda,
        data_vencimento: vendaData.data_vencimento
      })
      console.log('[createVenda] Conta a receber criada para venda a prazo')
    } catch (err) {
      console.error('Erro ao criar conta a receber:', err)
    }
  } else if (modo_pagamento === 'a_vista') {
    // Venda à vista: criar conta já recebida (paga)
    try {
      await criarContaRecebidaVenda({
        venda_id: venda.id,
        lote_id: venda.lote_id,
        comprador: venda.comprador,
        valor: venda.valor_total_venda,
        data_venda: venda.data_venda
      })
      console.log('[createVenda] Conta recebida criada para venda à vista')
    } catch (err) {
      console.error('Erro ao criar conta recebida:', err)
    }
  }

  return venda
}

// Atualizar venda
export async function updateVenda(id: string, vendaData: Partial<{
  lote_id?: string | null
  data_venda: string
  quantidade_cabecas: number
  peso_total_kg: number
  preco_arroba_venda: number
  custo_total: number
  comprador?: string
  observacoes?: string
  post_mortem_data?: string
  post_mortem_frigorifico?: string
  post_mortem_rendimento_carcaca?: number
}>) {
  const supabase = createClient()

  // Recalcular se os valores principais mudaram
  let updateData: any = { ...vendaData }

  if (vendaData.peso_total_kg !== undefined || vendaData.preco_arroba_venda !== undefined || vendaData.custo_total !== undefined) {
    // Buscar venda atual para pegar valores não alterados
    const { data: vendaAtual } = await supabase.from('vendas').select('*').eq('id', id).single()

    const pesoKg = vendaData.peso_total_kg ?? vendaAtual?.peso_total_kg ?? 0
    const precoArroba = vendaData.preco_arroba_venda ?? vendaAtual?.preco_arroba_venda ?? 0
    const custoTotal = vendaData.custo_total ?? vendaAtual?.custo_total ?? 0

    const peso_total_arrobas = kgToArrobas(pesoKg)
    const valor_total_venda = calcularValorVenda(peso_total_arrobas, precoArroba)
    const lucro_bruto = calcularLucroBruto(valor_total_venda, custoTotal)
    const margem_percentual = calcularMargem(lucro_bruto, custoTotal)
    const atingiu_objetivo = margem_percentual >= OBJETIVO_MARGEM

    updateData = {
      ...updateData,
      peso_total_arrobas: Math.round(peso_total_arrobas * 100) / 100,
      valor_total_venda: Math.round(valor_total_venda * 100) / 100,
      lucro_bruto: Math.round(lucro_bruto * 100) / 100,
      margem_percentual: Math.round(margem_percentual * 100) / 100,
      atingiu_objetivo
    }
  }

  const { data, error } = await supabase
    .from('vendas')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error
  return data as VendaWithLote
}

// Deletar venda
export async function deleteVenda(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('vendas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Obter estatísticas de vendas
export async function getEstatisticasVendas(): Promise<EstatisticasVendas> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)

  if (error) throw error

  const todasVendas = (vendas || []) as VendaWithLote[]
  const totalVendas = todasVendas.length

  if (totalVendas === 0) {
    return {
      total_vendas: 0,
      valor_total_vendido: 0,
      lucro_total: 0,
      margem_media: 0,
      vendas_atingiram_objetivo: 0,
      percentual_objetivo: 0,
      maior_venda: null,
      rendimento_carcaca_medio: null
    }
  }

  const valor_total_vendido = todasVendas.reduce((sum, v) => sum + v.valor_total_venda, 0)
  const lucro_total = todasVendas.reduce((sum, v) => sum + v.lucro_bruto, 0)
  const margem_media = todasVendas.reduce((sum, v) => sum + v.margem_percentual, 0) / totalVendas
  const vendas_atingiram_objetivo = todasVendas.filter(v => v.atingiu_objetivo).length
  const percentual_objetivo = (vendas_atingiram_objetivo / totalVendas) * 100

  // Maior venda
  const maior_venda = todasVendas.reduce((maior, v) =>
    v.valor_total_venda > (maior?.valor_total_venda || 0) ? v : maior
  , todasVendas[0])

  // Rendimento carcaça médio
  const vendasComRendimento = todasVendas.filter(v => v.post_mortem_rendimento_carcaca)
  const rendimento_carcaca_medio = vendasComRendimento.length > 0
    ? vendasComRendimento.reduce((sum, v) => sum + (v.post_mortem_rendimento_carcaca || 0), 0) / vendasComRendimento.length
    : null

  return {
    total_vendas: totalVendas,
    valor_total_vendido: Math.round(valor_total_vendido * 100) / 100,
    lucro_total: Math.round(lucro_total * 100) / 100,
    margem_media: Math.round(margem_media * 100) / 100,
    vendas_atingiram_objetivo,
    percentual_objetivo: Math.round(percentual_objetivo),
    maior_venda,
    rendimento_carcaca_medio: rendimento_carcaca_medio ? Math.round(rendimento_carcaca_medio * 10) / 10 : null
  }
}

// Buscar custo total de um lote (despesas)
export async function getCustoTotalLote(loteId: string): Promise<number> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar despesas do lote
  const { data: despesas, error: errDespesas } = await supabase
    .from('despesas')
    .select('valor')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)

  if (errDespesas) throw errDespesas

  // Buscar custo de aquisição do lote
  const { data: lote, error: errLote } = await supabase
    .from('lotes')
    .select('custo_total')
    .eq('id', loteId)
    .single()

  if (errLote) throw errLote

  const custoDespesas = (despesas || []).reduce((sum, d) => sum + d.valor, 0)
  const custoAquisicao = lote?.custo_total || 0

  return Math.round((custoDespesas + custoAquisicao) * 100) / 100
}

// Buscar vendas de um lote específico
export async function getVendasPorLote(loteId: string): Promise<VendaWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: vendas, error } = await supabase
    .from('vendas')
    .select(`
      *,
      lote:lotes!vendas_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .order('data_venda', { ascending: false })

  if (error) throw error

  return vendas as VendaWithLote[]
}

// Interface para dados completos do lote para venda
export interface DadosLoteParaVenda {
  lote_id: string
  lote_nome: string
  quantidade_animais: number
  peso_total_kg: number
  peso_total_arrobas: number
  peso_medio_animal: number
  custo_aquisicao: number
  custo_despesas: number
  custo_total: number
  custo_por_cabeca: number
  custo_por_arroba: number
  data_entrada: string | null
}

// Buscar dados completos do lote para preencher formulário de venda
export async function getDadosLoteParaVenda(loteId: string): Promise<DadosLoteParaVenda | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar dados do lote
  const { data: lote, error: errLote } = await supabase
    .from('lotes')
    .select('*')
    .eq('id', loteId)
    .single()

  if (errLote || !lote) return null

  // Buscar despesas do lote
  const { data: despesas, error: errDespesas } = await supabase
    .from('despesas')
    .select('valor, categoria')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)

  if (errDespesas) throw errDespesas

  // Calcular valores
  const quantidade_animais = lote.quantidade_total || 0

  // Buscar última pesagem do lote (do histórico do lote ou da tabela pesagens)
  let peso_total_kg = 0
  let peso_medio_animal = 0

  // Primeiro verificar histórico de pesagens do lote (pesagens agregadas)
  const historicoLote = (lote.historico_pesagens as any[]) || []
  if (historicoLote.length > 0) {
    // Pegar a pesagem mais recente do histórico
    const ultimaPesagemHistorico = historicoLote.sort((a, b) =>
      new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0]
    peso_total_kg = ultimaPesagemHistorico.peso_total || 0
    peso_medio_animal = ultimaPesagemHistorico.peso_medio || 0
  } else {
    // Se não tem histórico, usar peso_medio_animal do lote
    peso_medio_animal = lote.peso_medio_animal || 0
    peso_total_kg = peso_medio_animal > 0 && quantidade_animais > 0
      ? peso_medio_animal * quantidade_animais
      : 0
  }

  const peso_total_arrobas = kgToArrobas(peso_total_kg)

  const custo_aquisicao = lote.custo_total || 0
  const custo_despesas = (despesas || []).reduce((sum, d) => sum + d.valor, 0)
  const custo_total = custo_aquisicao + custo_despesas

  const custo_por_cabeca = quantidade_animais > 0 ? custo_total / quantidade_animais : 0
  const custo_por_arroba = peso_total_arrobas > 0 ? custo_total / peso_total_arrobas : 0

  return {
    lote_id: lote.id,
    lote_nome: lote.nome,
    quantidade_animais,
    peso_total_kg: peso_total_kg > 0 ? Math.round(peso_total_kg * 100) / 100 : 0,
    peso_total_arrobas: Math.round(peso_total_arrobas * 100) / 100,
    peso_medio_animal: Math.round(peso_medio_animal * 10) / 10,
    custo_aquisicao: Math.round(custo_aquisicao * 100) / 100,
    custo_despesas: Math.round(custo_despesas * 100) / 100,
    custo_total: Math.round(custo_total * 100) / 100,
    custo_por_cabeca: Math.round(custo_por_cabeca * 100) / 100,
    custo_por_arroba: Math.round(custo_por_arroba * 100) / 100,
    data_entrada: lote.data_entrada || null
  }
}
