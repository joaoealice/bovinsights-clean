'use client'

import { useEffect, useState } from 'react'
import {
  getMarketIndicators,
  getPriceHistory,
  MarketIndicator,
  formatPrice,
  formatDiff,
  getTrendColor,
  getTrendIcon
} from '@/lib/services/mercado.service'

export default function IndicadoresMercadoCard() {
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])
  const [bahiaSulIndicator, setBahiaSulIndicator] = useState<MarketIndicator | null>(null)
  const [bahiaOesteIndicator, setBahiaOesteIndicator] = useState<MarketIndicator | null>(null)
  const [otherIndicators, setOtherIndicators] = useState<MarketIndicator[]>([])
  const [history, setHistory] = useState<MarketIndicator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [indicatorsData, historyData] = await Promise.all([
        getMarketIndicators(),
        getPriceHistory(7)
      ])
      setIndicators(indicatorsData)
      setHistory(historyData)

      // Separar Bahia Sul e Bahia Oeste dos outros indicadores
      // Os dados vêm como state="BA" e region="BA Sul" ou "BA Oeste"
      const bahiaSul = indicatorsData.find(i => {
        const regionLower = i.region?.toLowerCase() || ''
        const stateLower = i.state?.toLowerCase() || ''
        return regionLower.includes('ba sul') ||
               regionLower.includes('bahia sul') ||
               (stateLower === 'ba' && regionLower.includes('sul'))
      })
      setBahiaSulIndicator(bahiaSul || null)

      const bahiaOeste = indicatorsData.find(i => {
        const regionLower = i.region?.toLowerCase() || ''
        const stateLower = i.state?.toLowerCase() || ''
        return regionLower.includes('ba oeste') ||
               regionLower.includes('bahia oeste') ||
               (stateLower === 'ba' && regionLower.includes('oeste'))
      })
      setBahiaOesteIndicator(bahiaOeste || null)

      // Outros indicadores
      const others = indicatorsData.filter(i => {
        const regionLower = i.region?.toLowerCase() || ''
        const stateLower = i.state?.toLowerCase() || ''
        const isBahiaSul = regionLower.includes('ba sul') || regionLower.includes('bahia sul') || (stateLower === 'ba' && regionLower.includes('sul'))
        const isBahiaOeste = regionLower.includes('ba oeste') || regionLower.includes('bahia oeste') || (stateLower === 'ba' && regionLower.includes('oeste'))
        return !isBahiaSul && !isBahiaOeste
      })
      setOtherIndicators(others)
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Calcular valores para o mini gráfico
  const getChartData = () => {
    if (history.length === 0) return []

    const prices = history.map(h => h.price_today)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    return history.map(h => ({
      ...h,
      normalized: ((h.price_today - min) / range) * 100
    }))
  }

  const chartData = getChartData()

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-muted/30 rounded mb-4"></div>
        <div className="h-16 bg-muted/30 rounded"></div>
      </div>
    )
  }

  if (indicators.length === 0) {
    return (
      <div className="card-leather p-6">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          INDICADORES DE MERCADO
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum indicador disponivel
        </p>
      </div>
    )
  }

  // Criar items do ticker duplicados para loop infinito
  const tickerItems = otherIndicators.length > 0 ? [...otherIndicators, ...otherIndicators] : []

  // Componente de card de indicador
  const IndicatorCard = ({ indicator, colorClass, borderClass }: {
    indicator: MarketIndicator | null,
    colorClass: string,
    borderClass: string
  }) => {
    if (!indicator) {
      return (
        <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-4 border-2 ${borderClass} shadow-lg`}>
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        </div>
      )
    }

    const trendColor = getTrendColor(indicator.trend)
    const trendIcon = getTrendIcon(indicator.trend)

    return (
      <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-4 border-2 ${borderClass} shadow-lg`}>
        <div className="text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${borderClass.replace('border-', 'bg-').replace('/40', '')} animate-pulse`}></span>
              <p className="text-xs font-bold uppercase">
                {indicator.region || indicator.state}
              </p>
            </div>
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
              indicator.trend === 'up' ? 'bg-success/20' :
              indicator.trend === 'down' ? 'bg-error/20' :
              'bg-muted/30'
            }`}>
              <span className={`text-sm font-bold ${trendColor}`}>{trendIcon}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoje</p>
              <p className="font-display text-2xl font-bold">
                {formatPrice(indicator.price_today)}
              </p>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-border/30 pt-1">
              <div>
                <span className="text-muted-foreground">Ontem: </span>
                <span className="font-mono">{formatPrice(indicator.price_yesterday)}</span>
              </div>
              <span className={`font-mono font-bold ${trendColor}`}>
                {formatDiff(indicator.diff)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-leather p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className="text-2xl">📊</span>
          INDICADORES DE MERCADO
        </h3>
        <span className="text-xs text-muted-foreground">
          {formatDate(bahiaSulIndicator?.reference_date || bahiaOesteIndicator?.reference_date || indicators[0]?.reference_date || '')}
        </span>
      </div>

      {/* Bahia Sul e Bahia Oeste em destaque - FIXOS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Bahia Sul */}
        <div className="relative">
          <div className="absolute -top-2 left-3 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded z-10">
            BAHIA SUL
          </div>
          <IndicatorCard
            indicator={bahiaSulIndicator}
            colorClass="from-primary/25 to-primary/10"
            borderClass="border-primary/40"
          />
        </div>

        {/* Bahia Oeste */}
        <div className="relative">
          <div className="absolute -top-2 left-3 px-2 py-0.5 bg-accent text-white text-[10px] font-bold rounded z-10">
            BAHIA OESTE
          </div>
          <IndicatorCard
            indicator={bahiaOesteIndicator}
            colorClass="from-accent/25 to-accent/10"
            borderClass="border-accent/40"
          />
        </div>
      </div>

      {/* Ticker horizontal de outros indicadores */}
      {otherIndicators.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Outras Pracas</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="overflow-hidden rounded-lg bg-muted/10 py-2">
            <div
              className="flex gap-4 whitespace-nowrap animate-ticker-indicators"
              style={{
                animation: `tickerIndicators ${otherIndicators.length * 5}s linear infinite`
              }}
            >
              {tickerItems.map((ind, index) => {
                const trendColor = getTrendColor(ind.trend)
                const trendIcon = getTrendIcon(ind.trend)
                return (
                  <div
                    key={`${ind.id || index}-${index}`}
                    className="inline-flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border/50"
                  >
                    <span className="font-semibold text-sm min-w-[80px]">
                      {ind.region || ind.state}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Hoje:</span>
                      <span className="font-mono font-bold">
                        {formatPrice(ind.price_today)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <span className="font-bold">{trendIcon}</span>
                      <span className="font-mono text-xs">
                        {formatDiff(ind.diff)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mini Gráfico de Tendência */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Historico 7 dias</p>
          <div className="relative h-12 flex items-end gap-1">
            {chartData.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    index === chartData.length - 1
                      ? 'bg-primary'
                      : 'bg-muted-foreground/30'
                  }`}
                  style={{
                    height: `${Math.max(point.normalized, 10)}%`,
                    minHeight: '4px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSS para o ticker */}
      <style jsx>{`
        @keyframes tickerIndicators {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker-indicators {
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
