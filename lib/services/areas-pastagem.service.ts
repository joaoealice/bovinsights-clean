import { createClient } from '@/lib/supabase/client'

// Tipos de Pasto disponíveis
export type TipoPasto = 'marandu' | 'mombaca' | 'decumbens'

// Status do piquete
export type StatusPiquete = 'disponivel' | 'lotado' | 'recuperacao'

export const STATUS_PIQUETE_INFO: Record<StatusPiquete, { label: string; cor: string; bgCor: string }> = {
  disponivel: { label: 'Disponível', cor: 'text-success', bgCor: 'bg-success/20' },
  lotado: { label: 'Lotado', cor: 'text-warning', bgCor: 'bg-warning/20' },
  recuperacao: { label: 'Em Recuperação', cor: 'text-error', bgCor: 'bg-error/20' }
}

// Dias mínimos de recuperação do pasto
export const DIAS_RECUPERACAO_PASTO = 21 // 21 dias de descanso mínimo

export interface DadosTipoPasto {
  nome: string
  nomeCompleto: string
  alturaEntradaMin: number
  alturaEntradaMax: number
  alturaSaidaMin: number
  alturaSaidaMax: number
}

export const TIPOS_PASTO: Record<TipoPasto, DadosTipoPasto> = {
  marandu: {
    nome: 'Marandu',
    nomeCompleto: 'Brachiaria brizantha (Marandu)',
    alturaEntradaMin: 30,
    alturaEntradaMax: 40,
    alturaSaidaMin: 15,
    alturaSaidaMax: 20
  },
  mombaca: {
    nome: 'Mombaça',
    nomeCompleto: 'Panicum maximum (Mombaça)',
    alturaEntradaMin: 80,
    alturaEntradaMax: 90,
    alturaSaidaMin: 35,
    alturaSaidaMax: 45
  },
  decumbens: {
    nome: 'Decumbens',
    nomeCompleto: 'Brachiaria decumbens',
    alturaEntradaMin: 25,
    alturaEntradaMax: 30,
    alturaSaidaMin: 10,
    alturaSaidaMax: 15
  }
}

// Tipos
export interface AreaPastagem {
  id: string
  usuario_id: string
  lote_id: string | null
  nome: string
  descricao: string | null
  area_hectares: number
  perimetro_km: number
  centroid_lat: number
  centroid_lng: number
  bbox_json: number[]
  geojson: any
  pontos: number
  // Campos para capacidade forrageira
  tipo_pasto: TipoPasto | null
  ms_total_kg: number | null
  altura_entrada_cm: number | null
  altura_saida_cm: number | null
  eficiencia: number | null
  capacidade_ua: number | null
  // Campos de status e histórico
  status: StatusPiquete
  data_ultima_saida: string | null
  lote_atual_id: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface AreaPastagemWithLote extends AreaPastagem {
  lote?: {
    id: string
    nome: string
  } | null
}

// Interface com status calculado
export interface AreaPastagemComStatus extends AreaPastagemWithLote {
  statusCalculado: StatusPiquete
  diasEmRecuperacao: number | null
  diasParaDisponivel: number | null
  loteVinculado?: {
    id: string
    nome: string
  } | null
}

export interface CreateAreaPastagemData {
  nome: string
  descricao?: string | null
  lote_id?: string | null
  area_hectares: number
  perimetro_km: number
  centroid_lat: number
  centroid_lng: number
  bbox_json: number[]
  geojson: any
  pontos: number
  // Novos campos para capacidade forrageira
  tipo_pasto?: TipoPasto | null
  ms_total_kg?: number | null
  altura_entrada_cm?: number | null
  altura_saida_cm?: number | null
  eficiencia?: number | null
  capacidade_ua?: number | null
}

// Listar todas as áreas do usuário
export async function getAreasPastagem(): Promise<AreaPastagemWithLote[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: areas, error } = await supabase
    .from('areas_pastagem')
    .select(`
      *,
      lote:lotes!areas_pastagem_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return areas as AreaPastagemWithLote[]
}

// Buscar área por ID
export async function getAreaPastagemById(id: string): Promise<AreaPastagemWithLote | null> {
  const supabase = createClient()

  const { data: area, error } = await supabase
    .from('areas_pastagem')
    .select(`
      *,
      lote:lotes!areas_pastagem_lote_id_fkey(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  if (!area) return null

  return area as AreaPastagemWithLote
}

// Buscar áreas por lote
export async function getAreasPastagemByLote(loteId: string): Promise<AreaPastagem[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: areas, error } = await supabase
    .from('areas_pastagem')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('lote_id', loteId)
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return areas as AreaPastagem[]
}

// Criar nova área de pastagem
export async function createAreaPastagem(areaData: CreateAreaPastagemData): Promise<AreaPastagem> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('areas_pastagem')
    .insert({
      ...areaData,
      usuario_id: user.id
    })
    .select()
    .single()

  if (error) throw error
  return data as AreaPastagem
}

// Atualizar área de pastagem
export async function updateAreaPastagem(id: string, areaData: Partial<CreateAreaPastagemData>): Promise<AreaPastagem> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas_pastagem')
    .update(areaData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as AreaPastagem
}

// Vincular área a um lote
export async function vincularAreaAoLote(areaId: string, loteId: string | null): Promise<AreaPastagem> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('areas_pastagem')
    .update({ lote_id: loteId })
    .eq('id', areaId)
    .select()
    .single()

  if (error) throw error
  return data as AreaPastagem
}

// Deletar área (soft delete)
export async function deleteAreaPastagem(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('areas_pastagem')
    .update({ ativo: false })
    .eq('id', id)

  if (error) throw error
}

// Deletar área permanentemente
export async function deleteAreaPastagemPermanente(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('areas_pastagem')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Calcular status do piquete baseado nos dados
export function calcularStatusPiquete(piquete: AreaPastagemWithLote): {
  status: StatusPiquete
  diasEmRecuperacao: number | null
  diasParaDisponivel: number | null
} {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  // Se tem lote vinculado via relação ou lote_atual_id, está lotado
  if (piquete.lote || piquete.lote_atual_id) {
    return { status: 'lotado', diasEmRecuperacao: null, diasParaDisponivel: null }
  }

  // Se tem data de última saída, verificar se está em recuperação
  if (piquete.data_ultima_saida) {
    const dataUltimaSaida = new Date(piquete.data_ultima_saida)
    const diasDesdeUltimaSaida = Math.floor((hoje.getTime() - dataUltimaSaida.getTime()) / (1000 * 60 * 60 * 24))

    if (diasDesdeUltimaSaida < DIAS_RECUPERACAO_PASTO) {
      const diasRestantes = DIAS_RECUPERACAO_PASTO - diasDesdeUltimaSaida
      return {
        status: 'recuperacao',
        diasEmRecuperacao: diasDesdeUltimaSaida,
        diasParaDisponivel: diasRestantes
      }
    }
  }

  // Caso contrário, está disponível
  return { status: 'disponivel', diasEmRecuperacao: null, diasParaDisponivel: null }
}

// Buscar piquetes com status calculado
export async function getAreasPastagemComStatus(): Promise<AreaPastagemComStatus[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar áreas com lotes vinculados via piquete_id na tabela lotes
  const { data: areas, error } = await supabase
    .from('areas_pastagem')
    .select(`
      *,
      lote:lotes!areas_pastagem_lote_id_fkey(id, nome)
    `)
    .eq('usuario_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Buscar lotes que têm piquete_id vinculado a estas áreas
  const { data: lotesComPiquete } = await supabase
    .from('lotes')
    .select('id, nome, piquete_id')
    .eq('usuario_id', user.id)
    .not('piquete_id', 'is', null)

  const lotesMap = new Map(lotesComPiquete?.map(l => [l.piquete_id, { id: l.id, nome: l.nome }]) || [])

  return (areas as AreaPastagemWithLote[]).map(area => {
    const { status, diasEmRecuperacao, diasParaDisponivel } = calcularStatusPiquete(area)
    const loteVinculado = lotesMap.get(area.id) || null

    // Se tem lote vinculado via piquete_id, está lotado
    const statusFinal = loteVinculado ? 'lotado' : status

    return {
      ...area,
      statusCalculado: statusFinal,
      diasEmRecuperacao,
      diasParaDisponivel,
      loteVinculado
    }
  })
}

// Realizar rotação de piquete (trocar lote de piquete)
export async function realizarRotacaoPiquete(
  loteId: string,
  piqueteAntigoId: string | null,
  piqueteNovoId: string | null // null = pasto avulso
): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const hoje = new Date().toISOString().split('T')[0]

  // 1. Atualizar piquete antigo (se existir) - marcar data de saída
  if (piqueteAntigoId) {
    const { error: errorAntigo } = await supabase
      .from('areas_pastagem')
      .update({
        data_ultima_saida: hoje,
        lote_atual_id: null
      })
      .eq('id', piqueteAntigoId)

    if (errorAntigo) throw errorAntigo
  }

  // 2. Atualizar piquete novo (se não for avulso) - marcar como ocupado
  if (piqueteNovoId) {
    const { error: errorNovo } = await supabase
      .from('areas_pastagem')
      .update({
        lote_atual_id: loteId,
        data_ultima_saida: null
      })
      .eq('id', piqueteNovoId)

    if (errorNovo) throw errorNovo
  }

  // 3. Atualizar o lote com novo piquete e data de entrada
  const { error: errorLote } = await supabase
    .from('lotes')
    .update({
      piquete_id: piqueteNovoId,
      data_entrada_piquete: hoje
    })
    .eq('id', loteId)

  if (errorLote) throw errorLote
}

// Liberar piquete (marcar como em recuperação)
export async function liberarPiquete(piqueteId: string): Promise<void> {
  const supabase = createClient()

  const hoje = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('areas_pastagem')
    .update({
      data_ultima_saida: hoje,
      lote_atual_id: null
    })
    .eq('id', piqueteId)

  if (error) throw error
}
