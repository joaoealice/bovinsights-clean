'use client'

import { useEffect, useState } from 'react'
import { getMarketPrices, MarketPrice, formatPrice } from '@/lib/services/mercado.service'

export default function CotacaoBoiCard() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [bahiaSul, setBahiaSul] = useState<MarketPrice | null>(null)
  const [bahiaOeste, setBahiaOeste] = useState<MarketPrice | null>(null)
  const [otherPrices, setOtherPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [tickerPosition, setTickerPosition] = useState(0)

  useEffect(() => {
    loadPrices()
  }, [])

  // Ticker automático - movimento contínuo
  useEffect(() => {
    if (otherPrices.length === 0) return

    const interval = setInterval(() => {
      setTickerPosition((prev) => prev + 1)
    }, 50) // Velocidade do ticker

    return () => clearInterval(interval)
  }, [otherPrices.length])

  const loadPrices = async () => {
    try {
      setLoading(true)
      const data = await getMarketPrices()
      setPrices(data)

      // Separar Bahia Sul e Bahia Oeste como praças fixas
      // Os dados vêm como state="BA" e region="BA Sul" ou "BA Oeste"
      const bahiaSulData = data.find(p => {
        const regionLower = p.region?.toLowerCase() || ''
        const stateLower = p.state?.toLowerCase() || ''
        return regionLower.includes('ba sul') ||
               regionLower.includes('bahia sul') ||
               (stateLower === 'ba' && regionLower.includes('sul'))
      })
      setBahiaSul(bahiaSulData || null)

      const bahiaOesteData = data.find(p => {
        const regionLower = p.region?.toLowerCase() || ''
        const stateLower = p.state?.toLowerCase() || ''
        return regionLower.includes('ba oeste') ||
               regionLower.includes('bahia oeste') ||
               (stateLower === 'ba' && regionLower.includes('oeste'))
      })
      setBahiaOeste(bahiaOesteData || null)

      // Outras praças (excluindo Bahia Sul e Bahia Oeste)
      const others = data.filter(p => {
        const regionLower = p.region?.toLowerCase() || ''
        const stateLower = p.state?.toLowerCase() || ''
        const isBahiaSul = regionLower.includes('ba sul') || regionLower.includes('bahia sul') || (stateLower === 'ba' && regionLower.includes('sul'))
        const isBahiaOeste = regionLower.includes('ba oeste') || regionLower.includes('bahia oeste') || (stateLower === 'ba' && regionLower.includes('oeste'))
        return !isBahiaSul && !isBahiaOeste
      })
      setOtherPrices(others)
    } catch (error) {
      console.error('Erro ao carregar cotações:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-muted/30 rounded mb-4"></div>
        <div className="h-8 bg-muted/30 rounded"></div>
      </div>
    )
  }

  if (prices.length === 0) {
    return (
      <div className="card-leather p-6">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span className="text-2xl">🐂</span>
          COTACAO @ BOI GORDO
        </h3>
        <p className="text-muted-foreground text-center py-8">
          Nenhuma cotacao disponivel
        </p>
      </div>
    )
  }

  // Criar items do ticker duplicados para loop infinito
  const tickerItems = otherPrices.length > 0 ? [...otherPrices, ...otherPrices] : []

  return (
    <div className="card-leather p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className="text-2xl">🐂</span>
          COTACAO @ BOI GORDO
        </h3>
        {(bahiaSul || bahiaOeste) && (
          <span className="text-xs text-muted-foreground">
            {formatDate(bahiaSul?.reference_date || bahiaOeste?.reference_date || '')}
          </span>
        )}
      </div>

      {/* Bahia Sul e Bahia Oeste em destaque - FIXOS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Bahia Sul */}
        <div className="bg-gradient-to-br from-primary/25 to-primary/10 rounded-xl p-4 border-2 border-primary/40 shadow-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <p className="text-sm font-bold text-primary">BAHIA SUL</p>
            </div>
            {bahiaSul ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Vista</p>
                  <p className="font-display text-2xl text-primary font-bold">
                    {formatPrice(bahiaSul.price_cash)}
                  </p>
                </div>
                <div className="border-t border-primary/20 pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Prazo</p>
                  <p className="font-display text-xl text-foreground">
                    {formatPrice(bahiaSul.price_term)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Sem dados</p>
            )}
          </div>
        </div>

        {/* Bahia Oeste */}
        <div className="bg-gradient-to-br from-accent/25 to-accent/10 rounded-xl p-4 border-2 border-accent/40 shadow-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <p className="text-sm font-bold text-accent">BAHIA OESTE</p>
            </div>
            {bahiaOeste ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Vista</p>
                  <p className="font-display text-2xl text-accent font-bold">
                    {formatPrice(bahiaOeste.price_cash)}
                  </p>
                </div>
                <div className="border-t border-accent/20 pt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Prazo</p>
                  <p className="font-display text-xl text-foreground">
                    {formatPrice(bahiaOeste.price_term)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">Sem dados</p>
            )}
          </div>
        </div>
      </div>

      {/* Ticker horizontal de outras praças */}
      {otherPrices.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Outras Pracas</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="overflow-hidden rounded-lg bg-muted/10 py-2">
            <div
              className="flex gap-4 whitespace-nowrap animate-ticker"
              style={{
                animation: `ticker ${otherPrices.length * 4}s linear infinite`
              }}
            >
              {tickerItems.map((price, index) => (
                <div
                  key={`${price.id || index}-${index}`}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border/50"
                >
                  <span className="font-semibold text-sm min-w-[80px]">
                    {price.region || price.state}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Vista:</span>
                    <span className="font-mono font-bold text-success">
                      {formatPrice(price.price_cash)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="font-mono font-bold text-accent">
                      {formatPrice(price.price_term)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS para o ticker */}
      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
