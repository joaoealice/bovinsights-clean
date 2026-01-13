import { createClient } from '@/lib/supabase/client'

// Tipos
export type TipoManejo = 'vermifugo' | 'vacinacao' | 'suplementacao' | 'marcacao' | 'castracao' | 'desmama' | 'outros'
export type TipoAplicacao = 'lote_inteiro' | 'animais_individuais'

export interface Manejo {
  id: string
  usuario_id: string
  lote_id: string | null
  tipo_aplicacao: TipoAplicacao
  animais_ids: string[] | null
  tipo_manejo: TipoManejo
  descricao: string
  data_manejo: string
  vacinas: string[] | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface ManejoWithLote extends Manejo {
  lote?: {
    id: string
    nome: string
    total_animais?: number
  } | null
}

export interface FiltrosManejo {
  tipo_manejo?: TipoManejo
  lote_id?: string
  data_inicio?: string
  data_fim?: string
  vacina?: string
}

// Constantes
export const TIPOS_MANEJO = [
  { value: 'vermifugo' as const, label: 'Vermífugo' },
  { value: 'vacinacao' as const, label: 'Vacinação' },
  { value: 'suplementacao' as const, label: 'Suplementação' },
  { value: 'marcacao' as const, label: 'Marcação' },
  { value: 'castracao' as const, label: 'Castração' },
  { value: 'desmama' as const, label: 'Desmama' },
  { value: 'outros' as const, label: 'Outros' },
]

export const VACINAS = [
  { value: 'febre_aftosa', label: 'Febre Aftosa', obrigatoria: true },
  { value: 'brucelose', label: 'Brucelose (B19/RB51)', obrigatoria: true },
  { value: 'raiva', label: 'Raiva', obrigatoria: false },
  { value: 'carbunculo', label: 'Carbúnculo Sintomático', obrigatoria: false },
  { value: 'clostridioses', label: 'Clostridioses', obrigatoria: false },
  { value: 'ibr_bvd', label: 'IBR/BVD', obrigatoria: false },
  { value: 'leptospirose', label: 'Leptospirose', obrigatoria: false },
]

export function getTipoManejoInfo(tipo: TipoManejo) {
  return TIPOS_MANEJO.find(t => t.value === tipo) || TIPOS_MANEJO[6]
}

export function getVacinaInfo(vacina: string) {
  return VACINAS.find(v => v.value === vacina)
}

// Listar todos os manejos do usuário
export async function getManejos(): Promise<ManejoWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: manejos, error } = await supabase
    .from('manejos')
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .order('data_manejo', { ascending: false })

  if (error) throw error

  return manejos as ManejoWithLote[]
}

// Buscar manejo por ID
export async function getManejoById(id: string): Promise<ManejoWithLote | null> {
  const supabase = createClient()

  const { data: manejo, error } = await supabase
    .from('manejos')
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!manejo) return null

  return manejo as ManejoWithLote
}

// Criar novo manejo
export async function createManejo(manejoData: {
  lote_id?: string | null
  tipo_aplicacao: TipoAplicacao
  animais_ids?: string[] | null
  tipo_manejo: TipoManejo
  descricao: string
  data_manejo: string
  vacinas?: string[] | null
  observacoes?: string | null
}) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('manejos')
    .insert({
      ...manejoData,
      usuario_id: user.id,
      lote_id: manejoData.lote_id || null,
      vacinas: manejoData.tipo_manejo === 'vacinacao' ? manejoData.vacinas : null,
    })
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error
  return data as ManejoWithLote
}

// Atualizar manejo
export async function updateManejo(id: string, manejoData: Partial<Omit<Manejo, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manejos')
    .update(manejoData)
    .eq('id', id)
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .single()

  if (error) throw error
  return data as ManejoWithLote
}

// Deletar manejo
export async function deleteManejo(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('manejos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar manejos com filtros
export async function searchManejos(query: string, filtros: FiltrosManejo = {}): Promise<ManejoWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  let queryBuilder = supabase
    .from('manejos')
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)

  // Filtro por texto na descrição
  if (query) {
    queryBuilder = queryBuilder.ilike('descricao', `%${query}%`)
  }

  // Filtro por tipo de manejo
  if (filtros.tipo_manejo) {
    queryBuilder = queryBuilder.eq('tipo_manejo', filtros.tipo_manejo)
  }

  // Filtro por lote
  if (filtros.lote_id) {
    queryBuilder = queryBuilder.eq('lote_id', filtros.lote_id)
  }

  // Filtro por período
  if (filtros.data_inicio) {
    queryBuilder = queryBuilder.gte('data_manejo', filtros.data_inicio)
  }
  if (filtros.data_fim) {
    queryBuilder = queryBuilder.lte('data_manejo', filtros.data_fim)
  }

  // Filtro por vacina específica
  if (filtros.vacina) {
    queryBuilder = queryBuilder.contains('vacinas', [filtros.vacina])
  }

  const { data: manejos, error } = await queryBuilder.order('data_manejo', { ascending: false })

  if (error) throw error

  return manejos as ManejoWithLote[]
}

// Obter manejos de um lote específico
export async function getManejosPorLote(loteId: string): Promise<Manejo[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: manejos, error } = await supabase
    .from('manejos')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .order('data_manejo', { ascending: false })

  if (error) throw error

  return manejos as Manejo[]
}

// Buscar manejos por vacina (para relatórios e conformidade)
export async function getManejosPorVacina(vacina: string): Promise<ManejoWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: manejos, error } = await supabase
    .from('manejos')
    .select(`
      *,
      lote:lotes!manejos_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('tipo_manejo', 'vacinacao')
    .contains('vacinas', [vacina])
    .order('data_manejo', { ascending: false })

  if (error) throw error

  return manejos as ManejoWithLote[]
}

// Estatísticas de manejo
export async function getEstatisticasManejo() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: manejos, error } = await supabase
    .from('manejos')
    .select('*')
    .eq('usuario_id', user.id)

  if (error) throw error

  const todosManejos = manejos || []

  // Manejos do mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const manejosMesAtual = todosManejos.filter(m => m.data_manejo >= inicioMes)

  // Total por tipo
  const totalPorTipo: Record<TipoManejo, number> = {
    vermifugo: 0,
    vacinacao: 0,
    suplementacao: 0,
    marcacao: 0,
    castracao: 0,
    desmama: 0,
    outros: 0
  }

  todosManejos.forEach(m => {
    totalPorTipo[m.tipo_manejo as TipoManejo]++
  })

  // Contagem de vacinas aplicadas
  const vacinasAplicadas: Record<string, number> = {}
  todosManejos
    .filter(m => m.tipo_manejo === 'vacinacao' && m.vacinas)
    .forEach(m => {
      m.vacinas?.forEach((v: string) => {
        vacinasAplicadas[v] = (vacinasAplicadas[v] || 0) + 1
      })
    })

  return {
    total_manejos: todosManejos.length,
    manejos_mes_atual: manejosMesAtual.length,
    total_por_tipo: totalPorTipo,
    vacinas_aplicadas: vacinasAplicadas
  }
}
