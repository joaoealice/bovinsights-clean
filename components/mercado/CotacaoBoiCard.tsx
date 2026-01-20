'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMarketPrices, getMarketPriceByRegion, MarketPrice, formatPrice } from '@/lib/services/mercado.service'
import { getPerfilFazenda } from '@/lib/services/perfil.service'

export default function CotacaoBoiCard() {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [userPrice, setUserPrice] = useState<MarketPrice | null>(null)
  const [userPraca, setUserPraca] = useState<string | null>(null)
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

      // Buscar praça preferida do usuário
      const perfil = await getPerfilFazenda()
      const pracaPreferida = perfil?.praca_preferida || null
      setUserPraca(pracaPreferida)

      // Buscar todos os preços
      const data = await getMarketPrices()
      setPrices(data)

      // Se o usuário tem praça configurada, buscar preço específico
      if (pracaPreferida) {
        const userPriceData = await getMarketPriceByRegion(pracaPreferida)
        setUserPrice(userPriceData)

        // Outras praças (excluindo a praça do usuário)
        const others = data.filter(p => {
          const regionLower = p.region?.toLowerCase() || ''
          return !regionLower.includes(pracaPreferida.toLowerCase())
        })
        setOtherPrices(others)
      } else {
        // Comportamento padrão: mostrar todas as praças no ticker
        setUserPrice(null)
        setOtherPrices(data)
      }
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
          <span className="text-sm font-normal text-muted-foreground">(Preco do dia)</span>
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
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">🐂</span>
            COTACAO @ BOI GORDO
            <span className="text-sm font-normal text-muted-foreground">(Preco do dia)</span>
          </h3>
          <div className="relative group">
            <span className="cursor-help text-muted-foreground hover:text-foreground transition-colors">ℹ️</span>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs text-popover-foreground w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Preco praticado hoje no mercado fisico. Usado para decisoes imediatas de venda e calculo do valor do estoque.
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
            </div>
          </div>
        </div>
        {(userPrice || prices.length > 0) && (
          <span className="text-xs text-muted-foreground">
            {formatDate(userPrice?.reference_date || prices[0]?.reference_date || '')}
          </span>
        )}
      </div>

      {/* Praça do usuário em destaque */}
      {userPraca ? (
        <div className="mb-4">
          {userPrice ? (
            <div className="bg-gradient-to-br from-primary/25 to-primary/10 rounded-xl p-4 border-2 border-primary/40 shadow-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-sm font-bold text-primary uppercase">{userPraca}</p>
                  <span className="ml-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">SUA PRACA</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Vista</p>
                    <p className="font-display text-3xl text-primary font-bold">
                      {formatPrice(userPrice.price_cash)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A Prazo</p>
                    <p className="font-display text-3xl text-foreground">
                      {formatPrice(userPrice.price_term)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-center">
              <p className="text-sm text-warning-foreground">
                <span className="font-semibold">Sem dados para {userPraca}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cotacao do dia ainda nao disponivel para sua praca.
                <br />
                <Link href="/dashboard/configuracoes" className="text-primary hover:underline">
                  Contate o suporte
                </Link> para mais informacoes.
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
            selecionar sua praca e ver cotacoes personalizadas.
          </p>
        </div>
      )}

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
