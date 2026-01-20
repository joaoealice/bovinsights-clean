'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getMarketIndicators,
  getMarketIndicatorByRegion,
  getPriceHistory,
  MarketIndicator,
  formatPrice,
  formatDiff,
  getTrendColor,
  getTrendIcon
} from '@/lib/services/mercado.service'
import { getPerfilFazenda, PRACAS_INDICADOR } from '@/lib/services/perfil.service'

export default function IndicadoresMercadoCard() {
  const [indicators, setIndicators] = useState<MarketIndicator[]>([])
  const [userIndicator, setUserIndicator] = useState<MarketIndicator | null>(null)
  const [userPraca, setUserPraca] = useState<string | null>(null)
  const [userPracaHasIndicator, setUserPracaHasIndicator] = useState<boolean>(false)
  const [otherIndicators, setOtherIndicators] = useState<MarketIndicator[]>([])
  const [history, setHistory] = useState<MarketIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>('BA Sul')

  useEffect(() => {
    loadData()
  }, [selectedRegion])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar praça preferida do usuário
      const perfil = await getPerfilFazenda()
      const pracaPreferida = perfil?.praca_preferida || null
      setUserPraca(pracaPreferida)

      // Verificar se a praça do usuário tem indicador disponível
      const hasIndicator = pracaPreferida ? PRACAS_INDICADOR.includes(pracaPreferida) : false
      setUserPracaHasIndicator(hasIndicator)

      // Buscar todos os indicadores e histórico
      const [indicatorsData, historyData] = await Promise.all([
        getMarketIndicators(),
        getPriceHistory(7, pracaPreferida && hasIndicator ? pracaPreferida : selectedRegion)
      ])
      setIndicators(indicatorsData)
      setHistory(historyData)

      // Se o usuário tem praça configurada E ela tem indicador disponível
      if (pracaPreferida && hasIndicator) {
        const userIndicatorData = await getMarketIndicatorByRegion(pracaPreferida)
        setUserIndicator(userIndicatorData)

        // Outras praças (excluindo a praça do usuário)
        const others = indicatorsData.filter(i => {
          const regionLower = i.region?.toLowerCase() || ''
          return !regionLower.includes(pracaPreferida.toLowerCase())
        })
        setOtherIndicators(others)

        // Atualizar região selecionada para o modal
        if (!selectedRegion || selectedRegion === 'BA Sul') {
          setSelectedRegion(pracaPreferida)
        }
      } else {
        // Comportamento padrão: mostrar todos os indicadores no ticker
        setUserIndicator(null)
        setOtherIndicators(indicatorsData)
      }
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
          INDICADORES
          <span className="text-sm font-normal text-muted-foreground">(Tendencia de mercado)</span>
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhum indicador disponivel
        </p>
      </div>
    )
  }

  // Criar items do ticker duplicados para loop infinito
  const tickerItems = otherIndicators.length > 0 ? [...otherIndicators, ...otherIndicators] : []

  // Formatar data para o gráfico
  const formatDateShort = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Calcular variação percentual
  // history está ordenado do mais antigo [0] para o mais recente [length-1]
  const calcVariacao = () => {
    if (history.length < 2) return 0
    const primeiro = history[0]?.price_today || 0
    const ultimo = history[history.length - 1]?.price_today || 0
    if (primeiro === 0) return 0
    return ((ultimo - primeiro) / primeiro) * 100
  }

  return (
    <div className="card-leather p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">📊</span>
            INDICADORES
            <span className="text-sm font-normal text-muted-foreground">(Tendencia de mercado)</span>
          </h3>
          <div className="relative group">
            <span className="cursor-help text-muted-foreground hover:text-foreground transition-colors">ℹ️</span>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Indicador de mercado calculado com base na media dos ultimos dias. Usado para analise de tendencia e apoio a decisao.
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userPracaHasIndicator && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-xs font-semibold transition-colors"
            >
              <span>📈</span>
              <span>7 dias</span>
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(userIndicator?.reference_date || indicators[0]?.reference_date || '')}
          </span>
        </div>
      </div>

      {/* Indicador do usuário em destaque */}
      {userPraca ? (
        <div className="mb-4">
          {userPracaHasIndicator ? (
            userIndicator ? (
              <div className="bg-gradient-to-br from-primary/25 to-primary/10 rounded-xl p-4 border-2 border-primary/40 shadow-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <p className="text-sm font-bold text-primary uppercase">{userPraca}</p>
                    <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">SUA PRACA</span>
                    <div className={`ml-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                      userIndicator.trend === 'up' ? 'bg-success/20' :
                      userIndicator.trend === 'down' ? 'bg-error/20' :
                      'bg-muted/30'
                    }`}>
                      <span className={`text-sm font-bold ${getTrendColor(userIndicator.trend)}`}>
                        {getTrendIcon(userIndicator.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hoje</p>
                      <p className="font-display text-2xl text-primary font-bold">
                        {formatPrice(userIndicator.price_today)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ontem</p>
                      <p className="font-display text-xl text-foreground">
                        {formatPrice(userIndicator.price_yesterday)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Variacao</p>
                      <p className={`font-display text-xl font-bold ${getTrendColor(userIndicator.trend)}`}>
                        {formatDiff(userIndicator.diff)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
                <p className="text-sm text-warning-foreground">
                  <span className="font-semibold">Sem indicador para {userPraca}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Indicador do dia ainda nao disponivel para sua praca.
                </p>
              </div>
            )
          ) : (
            <div className="bg-muted/20 border border-border rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Indicadores nao disponiveis para {userPraca}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sua praca ainda nao possui dados de indicadores de mercado.
                <br />
                <Link href="/dashboard/configuracoes" className="text-primary hover:underline">
                  Contate o suporte
                </Link> para solicitar a adicao.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 bg-muted/20 border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Configure sua praca preferida</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Acesse as <Link href="/dashboard/configuracoes" className="text-primary hover:underline">configuracoes</Link> para
            selecionar sua praca e ver indicadores personalizados.
          </p>
        </div>
      )}

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
                <p className="text-sm text-muted-foreground">Movimentacao da arroba - {selectedRegion}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Seletor de Praça */}
            <div className="px-4 pt-4">
              <div className="flex flex-wrap gap-2">
                {PRACAS_INDICADOR.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      selectedRegion === region
                        ? 'bg-primary text-white'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Mensagem quando não há dados */}
              {history.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl mb-2 block">📉</span>
                  <p className="text-muted-foreground">
                    Nenhum historico disponivel para {selectedRegion}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os dados serao exibidos conforme forem atualizados
                  </p>
                </div>
              )}

              {/* Resumo */}
              {history.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Inicio (7d)</p>
                  <p className="font-display text-xl">
                    {formatPrice(history[0]?.price_today || 0)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Hoje</p>
                  <p className="font-display text-xl text-primary">
                    {formatPrice(history[history.length - 1]?.price_today || 0)}
                  </p>
                </div>
                <div className={`rounded-xl p-3 text-center ${calcVariacao() >= 0 ? 'bg-success/20' : 'bg-error/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Variacao</p>
                  <p className={`font-display text-xl ${calcVariacao() >= 0 ? 'text-success' : 'text-error'}`}>
                    {calcVariacao() >= 0 ? '+' : ''}{calcVariacao().toFixed(2)}%
                  </p>
                </div>
              </div>
              )}

              {/* Gráfico de Linhas SVG */}
              {history.length > 0 && chartData.length > 1 && (
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
              {history.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Detalhamento diario</p>
                {[...history].reverse().map((item, index) => {
                  const isToday = index === 0 // Primeiro item é o mais recente (hoje)
                  const trendColor = getTrendColor(item.trend)
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-primary/20 border border-primary/30' : 'bg-muted/20'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-12">
                          {formatDateShort(item.reference_date)}
                        </span>
                        <span className={`font-display text-lg ${isToday ? 'text-primary' : ''}`}>
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
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
