import { createClient } from '@/lib/supabase/server'

// Tipos de retorno dos relatórios
export type RebanhoAtualData = {
  fazenda_nome: string | null
  quantidade_total_animais: number
  peso_medio_atual: number | null
  peso_total_rebanho: number | null
  data_ultima_pesagem: string | null
}

export type PesagensDesempenhoData = {
  animal_id: string
  brinco: string
  lote_nome: string | null
  data_pesagem: string
  peso_atual: number
  peso_anterior: number | null
  ganho_no_periodo: number | null
  dias_entre_pesagens: number
  gmd: number | null
}

export type DesempenhoLoteData = {
  lote_id: string
  lote_nome: string
  quantidade_animais: number
  peso_medio_inicial: number | null
  peso_medio_atual: number | null
  ganho_medio_total: number | null
  gmd_medio: number | null
  dias_no_sistema: number | null
}

// 1. Serviço para o Relatório de Rebanho Atual
export async function getRelatorioRebanhoAtual(): Promise<RebanhoAtualData[] | null> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data, error } = await supabase.rpc('get_relatorio_rebanho_atual', {
    user_id_param: userData.user.id,
  })

  if (error) {
    console.error('Erro ao buscar relatório de rebanho atual:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(`Não foi possível carregar os dados do rebanho: ${error.message}`)
  }

  return data as RebanhoAtualData[] | null
}


// 2. Serviço para o Relatório de Pesagens e Desempenho
export async function getRelatorioPesagensDesempenho(filters: { data_inicio: string, data_fim: string }): Promise<PesagensDesempenhoData[] | null> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data, error } = await supabase.rpc('get_relatorio_pesagens_desempenho', {
    user_id_param: userData.user.id,
    data_inicio_param: filters.data_inicio,
    data_fim_param: filters.data_fim,
  })

  if (error) {
    console.error('Erro ao buscar relatório de pesagens:', error)
    throw new Error('Não foi possível carregar os dados de pesagem.')
  }

  return data as PesagensDesempenhoData[] | null
}

// 3. Serviço para o Relatório de Desempenho por Lote
export async function getRelatorioDesempenhoLote(): Promise<DesempenhoLoteData[] | null> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData?.user) {
    throw new Error('Usuário não autenticado.')
  }

  const { data, error } = await supabase.rpc('get_relatorio_desempenho_lote', {
    user_id_param: userData.user.id,
  })

  if (error) {
    console.error('Erro ao buscar relatório de desempenho por lote:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    throw new Error(`Não foi possível carregar o desempenho dos lotes: ${error.message}`)
  }

  return data as DesempenhoLoteData[] | null
}
