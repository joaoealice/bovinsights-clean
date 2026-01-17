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
  const [showModal, setShowModal] = useState(false)

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

  // Formatar data para o gráfico
  const formatDateShort = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Calcular variação percentual
  const calcVariacao = () => {
    if (history.length < 2) return 0
    const primeiro = history[history.length - 1]?.price_today || 0
    const ultimo = history[0]?.price_today || 0
    if (primeiro === 0) return 0
    return ((ultimo - primeiro) / primeiro) * 100
  }

  return (
    <div className="card-leather p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className="text-2xl">📊</span>
          INDICADORES
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-xs font-semibold transition-colors"
          >
            <span>📈</span>
            <span>7 dias</span>
          </button>
          <span className="text-xs text-muted-foreground">
            {formatDate(bahiaSulIndicator?.reference_date || bahiaOesteIndicator?.reference_date || indicators[0]?.reference_date || '')}
          </span>
        </div>
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

      {/* Modal de Histórico 7 dias */}
      {showModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
            onClick={() => setShowModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-card border border-border rounded-2xl z-50 shadow-2xl animate-slide-in max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-display text-2xl">HISTORICO 7 DIAS</h3>
                <p className="text-sm text-muted-foreground">Movimentacao da arroba - BA Sul</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Inicio (7d)</p>
                  <p className="font-display text-xl">
                    {formatPrice(history[history.length - 1]?.price_today || 0)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Hoje</p>
                  <p className="font-display text-xl text-primary">
                    {formatPrice(history[0]?.price_today || 0)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 text-center ${calcVariacao() >= 0 ? 'bg-success/20' : 'bg-error/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Variacao</p>
                  <p className={`font-display text-xl ${calcVariacao() >= 0 ? 'text-success' : 'text-error'}`}>
                    {calcVariacao() >= 0 ? '+' : ''}{calcVariacao().toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Gráfico de Linhas SVG */}
              {chartData.length > 1 && (
                <div className="bg-muted/20 rounded-xl p-4">
                  <svg viewBox="0 0 300 120" className="w-full h-32">
                    {/* Grid lines */}
                    <line x1="30" y1="10" x2="30" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="30" y1="100" x2="290" y2="100" stroke="currentColor" strokeOpacity="0.1" />
                    <line x1="30" y1="55" x2="290" y2="55" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4" />

                    {/* Linha do gráfico */}
                    <polyline
                      fill="none"
                      stroke="rgb(142, 106, 54)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={chartData.map((point, index) => {
                        const x = 30 + (index * (260 / (chartData.length - 1 || 1)))
                        const y = 100 - (point.normalized * 0.9)
                        return `${x},${y}`
                      }).join(' ')}
                    />

                    {/* Pontos */}
                    {chartData.map((point, index) => {
                      const x = 30 + (index * (260 / (chartData.length - 1 || 1)))
                      const y = 100 - (point.normalized * 0.9)
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r={index === chartData.length - 1 ? 6 : 4}
                          fill={index === chartData.length - 1 ? 'rgb(142, 106, 54)' : 'rgb(100, 95, 88)'}
                          stroke="rgb(28, 24, 20)"
                          strokeWidth="2"
                        />
                      )
                    })}

                    {/* Labels de data */}
                    {chartData.map((point, index) => {
                      const x = 30 + (index * (260 / (chartData.length - 1 || 1)))
                      return (
                        <text
                          key={`label-${index}`}
                          x={x}
                          y="115"
                          textAnchor="middle"
                          className="fill-muted-foreground text-[8px]"
                        >
                          {formatDateShort(point.reference_date)}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              )}

              {/* Lista detalhada */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Detalhamento diario</p>
                {[...history].reverse().map((item, index) => {
                  const isLast = index === history.length - 1
                  const trendColor = getTrendColor(item.trend)
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${isLast ? 'bg-primary/20 border border-primary/30' : 'bg-muted/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-12">
                          {formatDateShort(item.reference_date)}
                        </span>
                        <span className={`font-display text-lg ${isLast ? 'text-primary' : ''}`}>
                          {formatPrice(item.price_today)}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 ${trendColor}`}>
                        <span>{getTrendIcon(item.trend)}</span>
                        <span className="font-mono text-sm">{formatDiff(item.diff)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
