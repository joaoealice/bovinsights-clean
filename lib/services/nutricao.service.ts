import { createClient } from '@/lib/supabase/client'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export type TipoDieta = 'adaptacao' | 'crescimento' | 'terminacao_alto_grao' | 'terminacao_convencional'

export interface Dieta {
  id: string
  usuario_id: string
  nome: string
  tipo: TipoDieta
  descricao: string | null
  percentual_volumoso: number
  percentual_concentrado: number
  ms_volumoso: number
  ms_concentrado: number
  custo_volumoso_kg: number
  custo_concentrado_kg: number
  consumo_ms_percentual_pv: number
  consumo_ms_minimo: number | null
  consumo_ms_maximo: number | null
  gmd_esperado: number | null
  ca_referencia: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface ProjecaoLote {
  id: string
  usuario_id: string
  lote_id: string
  dieta_id: string | null
  nome_projecao: string | null
  data_inicio: string
  dias_confinamento: number
  gmd_alvo: number
  peso_inicial: number
  quantidade_animais: number
  consumo_ms_percentual_pv: number
  percentual_volumoso: number
  percentual_concentrado: number
  ms_volumoso: number
  ms_concentrado: number
  custo_volumoso_kg: number
  custo_concentrado_kg: number
  consumo_ms_diario_animal: number | null
  consumo_volumoso_mn_animal: number | null
  consumo_concentrado_mn_animal: number | null
  custo_alimentar_diario_animal: number | null
  consumo_ms_diario_lote: number | null
  custo_alimentar_diario_lote: number | null
  custo_alimentar_total: number | null
  peso_final_projetado: number | null
  arrobas_projetadas: number | null
  data_saida_projetada: string | null
  ca_projetado: number | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface LeituraCocho {
  id: string
  usuario_id: string
  lote_id: string
  data_leitura: string
  numero_trato: number
  volumoso_fornecido_kg: number
  concentrado_fornecido_kg: number
  sobra_percentual: number | null
  sobra_kg: number | null
  escore_cocho: number | null
  consumo_volumoso_kg: number | null
  consumo_concentrado_kg: number | null
  consumo_total_mn_kg: number | null
  consumo_total_ms_kg: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface ProjecaoInput {
  lote_id: string
  dieta_id?: string
  nome_projecao?: string
  data_inicio: string
  dias_confinamento: number
  gmd_alvo: number
  peso_inicial: number
  quantidade_animais: number
  consumo_ms_percentual_pv: number
  percentual_volumoso: number
  percentual_concentrado: number
  ms_volumoso: number
  ms_concentrado: number
  custo_volumoso_kg: number
  custo_concentrado_kg: number
}

export interface LeituraCochoInput {
  lote_id: string
  data_leitura: string
  numero_trato?: number
  volumoso_fornecido_kg: number
  concentrado_fornecido_kg: number
  sobra_percentual?: number
  sobra_kg?: number
  escore_cocho?: number
  observacoes?: string
}

export interface ResultadoProjecao {
  consumo_ms_diario_animal: number
  consumo_volumoso_mn_animal: number
  consumo_concentrado_mn_animal: number
  custo_alimentar_diario_animal: number
  consumo_ms_diario_lote: number
  custo_alimentar_diario_lote: number
  custo_alimentar_total: number
  peso_final_projetado: number
  arrobas_projetadas: number
  ca_projetado: number
  data_saida_projetada: string
}

export interface AlertaLote {
  tipo: 'gmd_baixo' | 'consumo_baixo' | 'consumo_alto' | 'escore_critico' | 'saida_proxima' | 'peso_alvo'
  severidade: 'info' | 'warning' | 'error'
  titulo: string
  mensagem: string
  valor_atual?: number
  valor_esperado?: number
}

export interface ConsumoDiario {
  data: string
  consumo_ms_total: number
  consumo_ms_por_animal: number
  escore_medio: number | null
  quantidade_tratos: number
}

// =====================================================
// CONSTANTES - SISTEMAS DE PRODUÇÃO
// =====================================================

export type TipoSistema = 'confinamento' | 'semiconfinamento' | 'pastagem'

/** Configurações de consumo e dieta por tipo de sistema */
export const SISTEMAS_PRODUCAO: Record<TipoSistema, {
  label: string
  consumo_ms_percentual_pv: number
  percentual_concentrado: number
  percentual_volumoso: number
  gmd_minimo: number
  gmd_maximo: number
  gmd_medio: number
  descricao: string
}> = {
  confinamento: {
    label: 'Confinamento',
    consumo_ms_percentual_pv: 2.3,
    percentual_concentrado: 70,
    percentual_volumoso: 30,
    gmd_minimo: 1.4,
    gmd_maximo: 1.7,
    gmd_medio: 1.55,
    descricao: 'Alta densidade energética, máxima eficiência'
  },
  semiconfinamento: {
    label: 'Semi-confinamento',
    consumo_ms_percentual_pv: 2.0,
    percentual_concentrado: 40,
    percentual_volumoso: 60,
    gmd_minimo: 0.9,
    gmd_maximo: 1.2,
    gmd_medio: 1.05,
    descricao: 'Suplementação moderada com pastejo'
  },
  pastagem: {
    label: 'Pastagem',
    consumo_ms_percentual_pv: 1.8,
    percentual_concentrado: 20,
    percentual_volumoso: 80,
    gmd_minimo: 0.5,
    gmd_maximo: 0.8,
    gmd_medio: 0.65,
    descricao: 'Produção extensiva com suplementação'
  }
}

/** Valores padrão de MS para ingredientes */
export const MS_PADRAO = {
  volumoso: 35,  // Silagem de milho típica
  concentrado: 88 // Ração seca típica
}

/** Custos padrão por kg (podem ser atualizados) */
export const CUSTOS_PADRAO = {
  volumoso_kg: 0.18,
  concentrado_kg: 1.70
}

// =====================================================
// CONSTANTES - TIPOS DE DIETA (LEGADO)
// =====================================================

export const TIPOS_DIETA: { value: TipoDieta; label: string; descricao: string }[] = [
  { value: 'adaptacao', label: 'Adaptação', descricao: 'Primeiros 21 dias, transição gradual' },
  { value: 'crescimento', label: 'Crescimento', descricao: 'Fase de ganho de estrutura' },
  { value: 'terminacao_alto_grao', label: 'Terminação Alto Grão', descricao: '85%+ concentrado, máxima eficiência' },
  { value: 'terminacao_convencional', label: 'Terminação Convencional', descricao: '60-70% concentrado' },
]

export const ESCORES_COCHO: { valor: number; label: string; descricao: string; acao: string }[] = [
  { valor: 0, label: 'Cocho Limpo', descricao: 'Lambia, sem sobra', acao: 'Aumentar 5-10%' },
  { valor: 1, label: 'Quase Vazio', descricao: 'Pouca sobra visível', acao: 'Manter ou aumentar 2%' },
  { valor: 2, label: 'Ideal', descricao: 'Fina camada de sobra', acao: 'Manter quantidade' },
  { valor: 3, label: 'Sobra Moderada', descricao: 'Sobra visível uniforme', acao: 'Reduzir 5%' },
  { valor: 4, label: 'Sobra Excessiva', descricao: 'Muita sobra', acao: 'Reduzir 10%' },
  { valor: 5, label: 'Não Consumiu', descricao: 'Cocho cheio', acao: 'Verificar saúde/palatabilidade' },
]

export const DIETAS_PADRAO: Partial<Dieta>[] = [
  {
    nome: 'Adaptação Padrão',
    tipo: 'adaptacao',
    descricao: 'Dieta de adaptação para os primeiros 21 dias',
    percentual_volumoso: 40,
    percentual_concentrado: 60,
    ms_volumoso: 35,
    ms_concentrado: 88,
    custo_volumoso_kg: 0.15,
    custo_concentrado_kg: 1.50,
    consumo_ms_percentual_pv: 1.9,
    gmd_esperado: 0.8,
    ca_referencia: 8.0,
  },
  {
    nome: 'Terminação Alto Grão',
    tipo: 'terminacao_alto_grao',
    descricao: 'Dieta de alta energia para terminação intensiva',
    percentual_volumoso: 15,
    percentual_concentrado: 85,
    ms_volumoso: 35,
    ms_concentrado: 88,
    custo_volumoso_kg: 0.18,
    custo_concentrado_kg: 1.85,
    consumo_ms_percentual_pv: 2.2,
    gmd_esperado: 1.5,
    ca_referencia: 6.0,
  },
  {
    nome: 'Terminação Convencional',
    tipo: 'terminacao_convencional',
    descricao: 'Dieta balanceada para terminação',
    percentual_volumoso: 30,
    percentual_concentrado: 70,
    ms_volumoso: 35,
    ms_concentrado: 88,
    custo_volumoso_kg: 0.18,
    custo_concentrado_kg: 1.70,
    consumo_ms_percentual_pv: 2.4,
    gmd_esperado: 1.2,
    ca_referencia: 7.0,
  },
]

// =====================================================
// FUNÇÕES DE CÁLCULO (Puras)
// =====================================================

/**
 * Calcula todos os outputs da projeção alimentar
 */
export function calcularProjecao(input: ProjecaoInput): ResultadoProjecao {
  const {
    peso_inicial,
    quantidade_animais,
    dias_confinamento,
    gmd_alvo,
    consumo_ms_percentual_pv,
    percentual_volumoso,
    percentual_concentrado,
    ms_volumoso,
    ms_concentrado,
    custo_volumoso_kg,
    custo_concentrado_kg,
    data_inicio,
  } = input

  // Consumo MS por animal (kg/dia)
  const consumo_ms_diario_animal = peso_inicial * (consumo_ms_percentual_pv / 100)

  // Consumo por componente em MS
  const consumo_vol_ms = consumo_ms_diario_animal * (percentual_volumoso / 100)
  const consumo_conc_ms = consumo_ms_diario_animal * (percentual_concentrado / 100)

  // Conversão para Matéria Natural
  const consumo_volumoso_mn_animal = consumo_vol_ms / (ms_volumoso / 100)
  const consumo_concentrado_mn_animal = consumo_conc_ms / (ms_concentrado / 100)

  // Custo diário por animal
  const custo_alimentar_diario_animal =
    (consumo_volumoso_mn_animal * custo_volumoso_kg) +
    (consumo_concentrado_mn_animal * custo_concentrado_kg)

  // Por lote
  const consumo_ms_diario_lote = consumo_ms_diario_animal * quantidade_animais
  const custo_alimentar_diario_lote = custo_alimentar_diario_animal * quantidade_animais
  const custo_alimentar_total = custo_alimentar_diario_lote * dias_confinamento

  // Projeções de saída
  const peso_final_projetado = peso_inicial + (gmd_alvo * dias_confinamento)
  const arrobas_projetadas = (peso_final_projetado * quantidade_animais) / 30
  const ca_projetado = consumo_ms_diario_animal / gmd_alvo

  // Data de saída
  const dataInicio = new Date(data_inicio)
  dataInicio.setDate(dataInicio.getDate() + dias_confinamento)
  const data_saida_projetada = dataInicio.toISOString().split('T')[0]

  return {
    consumo_ms_diario_animal: round(consumo_ms_diario_animal, 4),
    consumo_volumoso_mn_animal: round(consumo_volumoso_mn_animal, 4),
    consumo_concentrado_mn_animal: round(consumo_concentrado_mn_animal, 4),
    custo_alimentar_diario_animal: round(custo_alimentar_diario_animal, 4),
    consumo_ms_diario_lote: round(consumo_ms_diario_lote, 2),
    custo_alimentar_diario_lote: round(custo_alimentar_diario_lote, 2),
    custo_alimentar_total: round(custo_alimentar_total, 2),
    peso_final_projetado: round(peso_final_projetado, 2),
    arrobas_projetadas: round(arrobas_projetadas, 2),
    ca_projetado: round(ca_projetado, 2),
    data_saida_projetada,
  }
}

/**
 * Calcula o consumo real a partir da leitura de cocho
 */
export function calcularConsumoReal(
  leitura: LeituraCochoInput,
  ms_volumoso: number,
  ms_concentrado: number
): {
  consumo_volumoso_kg: number
  consumo_concentrado_kg: number
  consumo_total_mn_kg: number
  consumo_total_ms_kg: number
} {
  const sobra_fator = leitura.sobra_percentual ? (1 - leitura.sobra_percentual / 100) : 1

  const consumo_volumoso_kg = leitura.volumoso_fornecido_kg * sobra_fator
  const consumo_concentrado_kg = leitura.concentrado_fornecido_kg * sobra_fator
  const consumo_total_mn_kg = consumo_volumoso_kg + consumo_concentrado_kg

  // Converter para MS
  const consumo_vol_ms = consumo_volumoso_kg * (ms_volumoso / 100)
  const consumo_conc_ms = consumo_concentrado_kg * (ms_concentrado / 100)
  const consumo_total_ms_kg = consumo_vol_ms + consumo_conc_ms

  return {
    consumo_volumoso_kg: round(consumo_volumoso_kg, 2),
    consumo_concentrado_kg: round(consumo_concentrado_kg, 2),
    consumo_total_mn_kg: round(consumo_total_mn_kg, 2),
    consumo_total_ms_kg: round(consumo_total_ms_kg, 2),
  }
}

// =====================================================
// PROJEÇÃO AUTOMÁTICA POR SISTEMA
// =====================================================

export interface ProjecaoAutomatica {
  // Consumo MS
  consumo_ms_animal_dia: number
  consumo_ms_lote_dia: number
  consumo_ms_lote_mes: number
  // GMD
  gmd_esperado: number
  gmd_range: string
  // Dieta
  percentual_concentrado: number
  percentual_volumoso: number
  // Info
  sistema: TipoSistema
  sistema_label: string
}

/**
 * Calcula projeção automática baseada no tipo de sistema
 * Sistema decide primeiro - valores calculados automaticamente
 */
export function calcularProjecaoAutomatica(
  tipoSistema: TipoSistema | string,
  pesoMedio: number,
  quantidadeAnimais: number
): ProjecaoAutomatica {
  // Normalizar tipo de sistema
  const sistema = normalizarTipoSistema(tipoSistema)
  const config = SISTEMAS_PRODUCAO[sistema]

  // Consumo MS por animal/dia (peso × % do PV)
  const consumo_ms_animal_dia = pesoMedio * (config.consumo_ms_percentual_pv / 100)

  // Consumo por lote
  const consumo_ms_lote_dia = consumo_ms_animal_dia * quantidadeAnimais
  const consumo_ms_lote_mes = consumo_ms_lote_dia * 30

  return {
    consumo_ms_animal_dia: round(consumo_ms_animal_dia, 2),
    consumo_ms_lote_dia: round(consumo_ms_lote_dia, 1),
    consumo_ms_lote_mes: round(consumo_ms_lote_mes, 0),
    gmd_esperado: config.gmd_medio,
    gmd_range: `${config.gmd_minimo}–${config.gmd_maximo}`,
    percentual_concentrado: config.percentual_concentrado,
    percentual_volumoso: config.percentual_volumoso,
    sistema,
    sistema_label: config.label
  }
}

/**
 * Normaliza o tipo de sistema para valores válidos
 * Aceita: confinamento, semiconfinamento/semi/semi-confinamento, pasto/pastagem/extensivo
 */
export function normalizarTipoSistema(tipo: string | undefined): TipoSistema {
  if (!tipo) return 'confinamento'
  const normalizado = tipo.toLowerCase().trim()

  // Semi-confinamento
  if (normalizado === 'semiconfinamento' || normalizado === 'semi-confinamento' || normalizado === 'semi') {
    return 'semiconfinamento'
  }

  // Pastagem (aceita "pasto" que é o valor usado no formulário)
  if (normalizado === 'pastagem' || normalizado === 'pasto' || normalizado === 'extensivo') {
    return 'pastagem'
  }

  // Default: confinamento
  return 'confinamento'
}

// =====================================================
// ANÁLISE DE DESEMPENHO SIMPLIFICADA
// =====================================================

export type StatusDesempenho = 'otimo' | 'dentro' | 'atencao' | 'alerta'

export interface AnaliseDesempenho {
  status: StatusDesempenho
  mensagem: string
  icone: string
  cor: string
}

/**
 * Analisa consumo real vs projetado - mensagens simples
 */
export function analisarConsumo(
  consumoReal: number | null,
  consumoProjetado: number
): AnaliseDesempenho {
  if (consumoReal === null) {
    return {
      status: 'dentro',
      mensagem: 'Sem dados de consumo real',
      icone: '📊',
      cor: 'text-muted-foreground'
    }
  }

  const variacao = ((consumoReal - consumoProjetado) / consumoProjetado) * 100

  if (variacao >= -5 && variacao <= 5) {
    return {
      status: 'otimo',
      mensagem: 'Consumo dentro do esperado',
      icone: '✓',
      cor: 'text-success'
    }
  }
  if (variacao >= -15 && variacao <= 15) {
    return {
      status: 'dentro',
      mensagem: `Consumo ${variacao > 0 ? 'levemente acima' : 'levemente abaixo'}`,
      icone: '•',
      cor: 'text-primary'
    }
  }
  if (variacao < -15) {
    return {
      status: 'atencao',
      mensagem: 'Atenção: consumo abaixo do ideal',
      icone: '⚠',
      cor: 'text-warning'
    }
  }
  return {
    status: 'alerta',
    mensagem: 'Alerta: consumo muito acima',
    icone: '!',
    cor: 'text-error'
  }
}

/**
 * Analisa GMD real vs esperado - mensagens simples
 */
export function analisarGMD(
  gmdReal: number | null,
  gmdMinimo: number,
  gmdMaximo: number
): AnaliseDesempenho {
  if (gmdReal === null) {
    return {
      status: 'dentro',
      mensagem: 'Aguardando pesagem',
      icone: '⏳',
      cor: 'text-muted-foreground'
    }
  }

  if (gmdReal >= gmdMinimo && gmdReal <= gmdMaximo) {
    return {
      status: 'otimo',
      mensagem: 'GMD dentro do esperado',
      icone: '✓',
      cor: 'text-success'
    }
  }
  if (gmdReal > gmdMaximo) {
    return {
      status: 'otimo',
      mensagem: 'GMD acima do esperado!',
      icone: '↑',
      cor: 'text-success'
    }
  }
  if (gmdReal >= gmdMinimo * 0.8) {
    return {
      status: 'atencao',
      mensagem: 'Atenção: GMD abaixo do ideal',
      icone: '⚠',
      cor: 'text-warning'
    }
  }
  return {
    status: 'alerta',
    mensagem: 'Alerta: impacto no desempenho',
    icone: '!',
    cor: 'text-error'
  }
}

/**
 * Gera alertas para o lote baseado nos dados
 */
export function gerarAlertasLote(
  gmd_real: number | null,
  gmd_alvo: number | null,
  consumo_real_ms: number | null,
  consumo_projetado_ms: number | null,
  escore_cocho: number | null,
  dias_restantes: number | null,
  peso_atual: number | null,
  peso_alvo: number | null
): AlertaLote[] {
  const alertas: AlertaLote[] = []

  // Alerta GMD baixo
  if (gmd_real !== null && gmd_alvo !== null && gmd_alvo > 0) {
    const percentual_gmd = (gmd_real / gmd_alvo) * 100
    if (percentual_gmd < 80) {
      alertas.push({
        tipo: 'gmd_baixo',
        severidade: 'error',
        titulo: 'GMD Abaixo do Alvo',
        mensagem: `GMD real (${gmd_real.toFixed(3)} kg/dia) está ${(100 - percentual_gmd).toFixed(0)}% abaixo do alvo`,
        valor_atual: gmd_real,
        valor_esperado: gmd_alvo,
      })
    }
  }

  // Alerta consumo baixo
  if (consumo_real_ms !== null && consumo_projetado_ms !== null && consumo_projetado_ms > 0) {
    const percentual_consumo = (consumo_real_ms / consumo_projetado_ms) * 100
    if (percentual_consumo < 80) {
      alertas.push({
        tipo: 'consumo_baixo',
        severidade: 'warning',
        titulo: 'Consumo Abaixo do Esperado',
        mensagem: `Consumo MS está ${(100 - percentual_consumo).toFixed(0)}% abaixo do projetado`,
        valor_atual: consumo_real_ms,
        valor_esperado: consumo_projetado_ms,
      })
    } else if (percentual_consumo > 120) {
      alertas.push({
        tipo: 'consumo_alto',
        severidade: 'warning',
        titulo: 'Consumo Acima do Esperado',
        mensagem: `Consumo MS está ${(percentual_consumo - 100).toFixed(0)}% acima do projetado`,
        valor_atual: consumo_real_ms,
        valor_esperado: consumo_projetado_ms,
      })
    }
  }

  // Alerta escore de cocho crítico
  if (escore_cocho !== null && (escore_cocho === 0 || escore_cocho === 5)) {
    alertas.push({
      tipo: 'escore_critico',
      severidade: escore_cocho === 5 ? 'error' : 'warning',
      titulo: escore_cocho === 0 ? 'Cocho Limpo - Aumentar Quantidade' : 'Cocho Cheio - Verificar Saúde',
      mensagem: ESCORES_COCHO[escore_cocho].acao,
      valor_atual: escore_cocho,
    })
  }

  // Alerta saída próxima
  if (dias_restantes !== null && dias_restantes <= 14 && dias_restantes > 0) {
    alertas.push({
      tipo: 'saida_proxima',
      severidade: 'info',
      titulo: 'Lote Próximo da Saída',
      mensagem: `${dias_restantes} dias restantes para data prevista de saída`,
      valor_atual: dias_restantes,
    })
  }

  // Alerta peso alvo atingido
  if (peso_atual !== null && peso_alvo !== null && peso_atual >= peso_alvo) {
    alertas.push({
      tipo: 'peso_alvo',
      severidade: 'info',
      titulo: 'Peso Alvo Atingido',
      mensagem: `Peso médio (${peso_atual.toFixed(0)} kg) atingiu ou superou o alvo (${peso_alvo.toFixed(0)} kg)`,
      valor_atual: peso_atual,
      valor_esperado: peso_alvo,
    })
  }

  return alertas
}

// =====================================================
// FUNÇÕES DE BANCO DE DADOS - DIETAS
// =====================================================

export async function getDietas(): Promise<Dieta[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('dietas')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('ativo', true)
    .order('nome')

  if (error) throw error
  return data as Dieta[]
}

export async function getDietaById(id: string): Promise<Dieta | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('dietas')
    .select('*')
    .eq('id', id)
    .eq('usuario_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as Dieta | null
}

export async function createDieta(dieta: Omit<Dieta, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>): Promise<Dieta> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('dietas')
    .insert({ ...dieta, usuario_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Dieta
}

export async function createDietasPadrao(): Promise<Dieta[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const dietasComUsuario = DIETAS_PADRAO.map(d => ({
    ...d,
    usuario_id: user.id,
    ativo: true,
  }))

  const { data, error } = await supabase
    .from('dietas')
    .insert(dietasComUsuario)
    .select()

  if (error) throw error
  return data as Dieta[]
}

// =====================================================
// FUNÇÕES DE BANCO DE DADOS - PROJEÇÕES
// =====================================================

export async function getProjecaoAtiva(loteId: string): Promise<ProjecaoLote | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('projecoes_lote')
    .select('*')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as ProjecaoLote | null
}

export async function getProjecoesLote(loteId: string): Promise<ProjecaoLote[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('projecoes_lote')
    .select('*')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProjecaoLote[]
}

export async function createProjecao(input: ProjecaoInput): Promise<ProjecaoLote> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Calcular resultados
  const resultados = calcularProjecao(input)

  // Desativar projeções anteriores do lote
  await supabase
    .from('projecoes_lote')
    .update({ ativo: false })
    .eq('lote_id', input.lote_id)
    .eq('usuario_id', user.id)

  // Criar nova projeção
  const { data, error } = await supabase
    .from('projecoes_lote')
    .insert({
      usuario_id: user.id,
      ...input,
      ...resultados,
      ativo: true,
    })
    .select()
    .single()

  if (error) throw error

  // Atualizar lote com referência à projeção
  await supabase
    .from('lotes')
    .update({
      projecao_ativa_id: data.id,
      gmd_alvo: input.gmd_alvo,
      data_prevista_saida: resultados.data_saida_projetada,
    })
    .eq('id', input.lote_id)

  return data as ProjecaoLote
}

// =====================================================
// FUNÇÕES DE BANCO DE DADOS - LEITURAS DE COCHO
// =====================================================

export async function getLeiturasCocho(loteId: string, limite = 30): Promise<LeituraCocho[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('leituras_cocho')
    .select('*')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)
    .order('data_leitura', { ascending: false })
    .order('numero_trato', { ascending: false })
    .limit(limite)

  if (error) throw error
  return data as LeituraCocho[]
}

export async function createLeituraCocho(
  input: LeituraCochoInput,
  ms_volumoso = 35,
  ms_concentrado = 88
): Promise<LeituraCocho> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Calcular consumo real
  const consumo = calcularConsumoReal(input, ms_volumoso, ms_concentrado)

  const { data, error } = await supabase
    .from('leituras_cocho')
    .insert({
      usuario_id: user.id,
      ...input,
      ...consumo,
    })
    .select()
    .single()

  if (error) throw error
  return data as LeituraCocho
}

export async function getConsumoDiario(loteId: string, dias = 30): Promise<ConsumoDiario[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Buscar leituras e agrupar por data
  const { data: leituras, error } = await supabase
    .from('leituras_cocho')
    .select('*')
    .eq('lote_id', loteId)
    .eq('usuario_id', user.id)
    .order('data_leitura', { ascending: false })
    .limit(dias * 5) // Máximo 5 tratos por dia

  if (error) throw error

  // Agrupar por data
  const porData = new Map<string, LeituraCocho[]>()
  for (const leitura of leituras as LeituraCocho[]) {
    const datas = porData.get(leitura.data_leitura) || []
    datas.push(leitura)
    porData.set(leitura.data_leitura, datas)
  }

  // Calcular totais por dia
  const resultado: ConsumoDiario[] = []
  for (const [data, leiturasDia] of porData) {
    const consumo_ms_total = leiturasDia.reduce((sum, l) => sum + (l.consumo_total_ms_kg || 0), 0)
    const escores = leiturasDia.filter(l => l.escore_cocho !== null).map(l => l.escore_cocho!)
    const escore_medio = escores.length > 0 ? escores.reduce((a, b) => a + b, 0) / escores.length : null

    resultado.push({
      data,
      consumo_ms_total: round(consumo_ms_total, 2),
      consumo_ms_por_animal: 0, // Será calculado com quantidade de animais
      escore_medio: escore_medio !== null ? round(escore_medio, 1) : null,
      quantidade_tratos: leiturasDia.length,
    })
  }

  return resultado.slice(0, dias)
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Formata valor em R$
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Formata peso em kg
 */
export function formatarPeso(valor: number, decimals = 2): string {
  return `${valor.toFixed(decimals)} kg`
}

/**
 * Calcula dias restantes até a data de saída
 */
export function calcularDiasRestantes(dataSaida: string | null): number | null {
  if (!dataSaida) return null
  const hoje = new Date()
  const saida = new Date(dataSaida)
  const diffTime = saida.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Retorna cor do alerta baseado na severidade
 */
export function corAlerta(severidade: AlertaLote['severidade']): string {
  switch (severidade) {
    case 'error': return 'text-red-600 bg-red-100 border-red-300'
    case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
    case 'info': return 'text-blue-600 bg-blue-100 border-blue-300'
    default: return 'text-gray-600 bg-gray-100 border-gray-300'
  }
}

/**
 * Retorna ícone do alerta
 */
export function iconeAlerta(tipo: AlertaLote['tipo']): string {
  switch (tipo) {
    case 'gmd_baixo': return '📉'
    case 'consumo_baixo': return '🍽️'
    case 'consumo_alto': return '🍽️'
    case 'escore_critico': return '⚠️'
    case 'saida_proxima': return '📅'
    case 'peso_alvo': return '🎯'
    default: return '📋'
  }
}
