import { createClient } from '@/lib/supabase/client'

// Tipos
export interface MarketPrice {
  id: string
  state: string
  region: string
  price_cash: number
  price_term: number
  reference_date: string
  created_at?: string
}

export interface MarketIndicator {
  id: string
  indicator_type: string
  reference_date: string
  state: string
  region: string
  price_today: number
  price_yesterday: number
  diff: number
  trend: 'up' | 'down' | 'stable'
  created_at?: string
}

// Buscar cotações do dia (market_prices)
export async function getMarketPrices(date?: string): Promise<MarketPrice[]> {
  const supabase = createClient()

  let query = supabase
    .from('market_prices')
    .select('*')
    .order('reference_date', { ascending: false })

  if (date) {
    query = query.eq('reference_date', date)
  } else {
    // Buscar a data mais recente
    const { data: latest } = await supabase
      .from('market_prices')
      .select('reference_date')
      .order('reference_date', { ascending: false })
      .limit(1)
      .single()

    if (latest) {
      query = query.eq('reference_date', latest.reference_date)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar cotações:', error)
    return []
  }

  return data as MarketPrice[]
}

// Buscar indicadores do mercado (market_indicators)
export async function getMarketIndicators(date?: string): Promise<MarketIndicator[]> {
  const supabase = createClient()

  let query = supabase
    .from('market_indicators')
    .select('*')
    .order('reference_date', { ascending: false })

  if (date) {
    query = query.eq('reference_date', date)
  } else {
    // Buscar a data mais recente
    const { data: latest } = await supabase
      .from('market_indicators')
      .select('reference_date')
      .order('reference_date', { ascending: false })
      .limit(1)
      .single()

    if (latest) {
      query = query.eq('reference_date', latest.reference_date)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar indicadores:', error)
    return []
  }

  return data as MarketIndicator[]
}

// Buscar cotação específica da Bahia
export async function getBahiaPrice(): Promise<MarketPrice | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('market_prices')
    .select('*')
    .ilike('state', '%bahia%')
    .order('reference_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Erro ao buscar cotação Bahia:', error)
    return null
  }

  return data as MarketPrice
}

// Buscar histórico de preços para gráfico
export async function getPriceHistory(days: number = 7): Promise<MarketIndicator[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('market_indicators')
    .select('*')
    .order('reference_date', { ascending: true })
    .limit(days)

  if (error) {
    console.error('Erro ao buscar histórico:', error)
    return []
  }

  return data as MarketIndicator[]
}

// Formatar preço em reais
export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Formatar diferença com sinal
export function formatDiff(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPrice(value)}`
}

// Obter cor baseada na tendência
export function getTrendColor(trend: string): string {
  switch (trend?.toLowerCase()) {
    case 'up':
    case 'subindo':
      return 'text-success'
    case 'down':
    case 'descendo':
      return 'text-error'
    default:
      return 'text-muted-foreground'
  }
}

// Obter ícone baseado na tendência
export function getTrendIcon(trend: string): string {
  switch (trend?.toLowerCase()) {
    case 'up':
    case 'subindo':
      return '↑'
    case 'down':
    case 'descendo':
      return '↓'
    default:
      return '→'
  }
}

// Obter texto da tendência
export function getTrendText(trend: string): string {
  switch (trend?.toLowerCase()) {
    case 'up':
      return 'Subindo'
    case 'down':
      return 'Descendo'
    case 'stable':
      return 'Estável'
    default:
      return trend || 'Estável'
  }
}
