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
  const [userPracaHasIndicator, setUserPracaHasIndicator] = useState(false)
  const [otherIndicators, setOtherIndicators] = useState<MarketIndicator[]>([])
  const [history, setHistory] = useState<MarketIndicator[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('BA Sul')

  useEffect(() => {
    loadData()
  }, [selectedRegion])

  const loadData = async () => {
    try {
      setLoading(true)

      const perfil = await getPerfilFazenda()
      const pracaPreferida = perfil?.praca_preferida || null
      setUserPraca(pracaPreferida)

      const hasIndicator = pracaPreferida
        ? PRACAS_INDICADOR.includes(pracaPreferida)
        : false
      setUserPracaHasIndicator(hasIndicator)

      const [indicatorsData, historyData] = await Promise.all([
        getMarketIndicators(),
        getPriceHistory(7, pracaPreferida && hasIndicator ? pracaPreferida : selectedRegion)
      ])

      setIndicators(indicatorsData)
      setHistory(historyData)

      if (pracaPreferida && hasIndicator) {
        const userData = await getMarketIndicatorByRegion(pracaPreferida)
        setUserIndicator(userData)

        const others = indicatorsData.filter(
          i => !i.region?.toLowerCase().includes(pracaPreferida.toLowerCase())
        )
        setOtherIndicators(others)

        if (!selectedRegion) {
          setSelectedRegion(pracaPreferida)
        }
      } else {
        setUserIndicator(null)
        setOtherIndicators(indicatorsData)
      }
    } catch (err) {
      console.error('Erro ao carregar indicadores:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
        <div className="h-24 bg-muted/30 rounded mb-4" />
        <div className="h-16 bg-muted/30 rounded" />
      </div>
    )
  }

  return (
    <div className="card-leather p-6 overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">📊</span>
            INDICADORES
          </h3>
          <span className="block text-xs text-muted-foreground ml-8">
            Tendência de mercado
          </span>
        </div>

        <div className="flex items-center gap-2">
          {userPracaHasIndicator && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-xs font-semibold"
            >
              📈 7 dias
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(userIndicator?.reference_date || indicators[0]?.reference_date || '')}
          </span>
        </div>
      </div>

      {/* INDICADOR DA PRAÇA */}
      {userPraca && userIndicator && (
        <div className="bg-gradient-to-br from-primary/25 to-primary/10 rounded-xl p-4 border-2 border-primary/40 shadow-lg mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-bold text-primary uppercase">{userPraca}</p>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                SUA PRAÇA
              </span>
              <span className={`font-bold ${getTrendColor(userIndicator.trend)}`}>
                {getTrendIcon(userIndicator.trend)}
              </span>
            </div>

            {/* AQUI É O BLOCO CERTO */}
            <div className="grid grid-cols-3 gap-4 mt-3 items-end">
              {/* ONTEM */}
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground uppercase">Ontem</p>
                <p className="font-display text-base flex items-baseline gap-1">
                  <span className="text-[10px]">R$</span>
                  <span>{userIndicator.price_yesterday.toFixed(2)}</span>
                </p>
              </div>

              {/* HOJE */}
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Hoje</p>
                <p className="font-display text-2xl text-primary font-bold flex items-baseline justify-center gap-1">
                  <span className="text-xs">R$</span>
                  <span>{userIndicator.price_today.toFixed(2)}</span>
                </p>
              </div>

              {/* VARIAÇÃO */}
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase">Variação</p>
                <p className={`font-display text-base font-semibold ${getTrendColor(userIndicator.trend)}`}>
                  {formatDiff(userIndicator.diff)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TICKER */}
      {otherIndicators.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-muted/10 py-2">
          <div className="flex gap-4 whitespace-nowrap animate-ticker-indicators">
            {[...otherIndicators, ...otherIndicators].map((ind, i) => (
              <div
                key={`${ind.id}-${i}`}
                className="inline-flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border"
              >
                <span className="font-semibold text-sm min-w-[80px]">
                  {ind.region || ind.state}
                </span>
                <span className="font-mono text-xs flex items-baseline gap-1">
                  <span>R$</span>
                  <span>{ind.price_today.toFixed(2)}</span>
                </span>
                <span className={getTrendColor(ind.trend)}>
                  {getTrendIcon(ind.trend)} {formatDiff(ind.diff)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes tickerIndicators {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-indicators {
          animation: tickerIndicators 40s linear infinite;
        }
      `}</style>
    </div>
  )
}
