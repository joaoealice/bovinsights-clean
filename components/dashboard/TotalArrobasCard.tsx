'use client'

import { useEffect, useState } from 'react'
import { getTotalArrobasEstoque, TotalArrobasEstoque } from '@/lib/services/animais.service'
import { getMarketPrices } from '@/lib/services/mercado.service'
import { getResumoFinanceiroGeral, ResumoFinanceiroGeral } from '@/lib/services/financeiro.service'

export default function TotalArrobasCard() {
  const [dados, setDados] = useState<TotalArrobasEstoque | null>(null)
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiroGeral | null>(null)
  const [precoArroba, setPrecoArroba] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar preço atual da arroba (BA Sul como referência)
      const prices = await getMarketPrices()
      const bahiaSul = prices.find(p =>
        p.region?.toLowerCase().includes('ba sul') ||
        p.region?.toLowerCase().includes('bahia sul')
      )
      const preco = bahiaSul?.price_cash || prices[0]?.price_cash || 300
      setPrecoArroba(preco)

      // Buscar total de arrobas e resumo financeiro em paralelo
      const [totalData, resumo] = await Promise.all([
        getTotalArrobasEstoque(preco),
        getResumoFinanceiroGeral(preco)
      ])
      setDados(totalData)
      setResumoFinanceiro(resumo)
    } catch (error) {
      console.error('Erro ao carregar total de arrobas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/2 mb-4"></div>
        <div className="h-12 bg-muted/30 rounded mb-2"></div>
        <div className="h-4 bg-muted/30 rounded w-2/3"></div>
      </div>
    )
  }

  // Calcular cor da margem
  const getMargemColor = (margem: number) => {
    if (margem >= 25) return 'text-success'
    if (margem >= 10) return 'text-primary'
    if (margem >= 0) return 'text-warning'
    return 'text-error'
  }

  const getMargemBgColor = (margem: number) => {
    if (margem >= 25) return 'bg-success/10 border-success/30'
    if (margem >= 10) return 'bg-primary/10 border-primary/30'
    if (margem >= 0) return 'bg-warning/10 border-warning/30'
    return 'bg-error/10 border-error/30'
  }

  return (
    <div className="card-leather p-6 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className="text-2xl">💰</span>
          ESTOQUE R$
        </h3>
        <div className="flex items-center gap-2 bg-success/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="font-display text-lg text-success">{dados?.total_animais || 0}</span>
          <span className="text-sm text-success/80">cab</span>
        </div>
      </div>

      {/* Total de Arrobas em Destaque */}
      <div className="text-center mb-4">
        <p className="font-display text-5xl md:text-6xl text-success font-bold tracking-tight">
          {formatNumber(dados?.total_arrobas || 0)}
        </p>
        <p className="text-base text-muted-foreground font-semibold">arrobas em estoque</p>
      </div>

      {/* Resumo Financeiro */}
      {resumoFinanceiro && (
        <div className="space-y-2 mb-3">
          {/* Investimento Inicial */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Investimento Inicial</span>
            <span className="font-mono font-semibold">
              {formatCurrency(resumoFinanceiro.investimento_inicial)}
            </span>
          </div>

          {/* Custeios/Despesas */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Custeios (Despesas)</span>
            <span className="font-mono font-semibold">
              {formatCurrency(resumoFinanceiro.custeios)}
            </span>
          </div>

          {/* Total Investido */}
          <div className="flex items-center justify-between text-sm border-t border-border/50 pt-2">
            <span className="text-muted-foreground font-semibold">Total Investido</span>
            <span className="font-mono font-bold text-foreground">
              {formatCurrency(resumoFinanceiro.total_investido)}
            </span>
          </div>
        </div>
      )}

      {/* Card de Margem de Lucro */}
      {resumoFinanceiro && (
        <div className={`rounded-xl p-3 border ${getMargemBgColor(resumoFinanceiro.margem_percentual)}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Valor Estoque Atual</span>
            <span className="font-mono font-bold text-sm">
              {formatCurrency(resumoFinanceiro.valor_estoque_atual)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Margem Atual</span>
            <div className="text-right">
              <span className={`font-mono font-bold text-xl ${getMargemColor(resumoFinanceiro.margem_percentual)}`}>
                {resumoFinanceiro.margem_percentual > 0 ? '+' : ''}{resumoFinanceiro.margem_percentual.toFixed(1)}%
              </span>
              <p className={`text-xs ${getMargemColor(resumoFinanceiro.margem_percentual)}`}>
                {formatCurrency(resumoFinanceiro.lucro_ou_prejuizo)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé com cotação */}
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Base: {formatCurrency(precoArroba)}/@ (BA Sul)
      </p>
    </div>
  )
}
