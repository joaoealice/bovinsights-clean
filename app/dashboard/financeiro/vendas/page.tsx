'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getVendas,
  getEstatisticasVendas,
  VendaWithLote,
  EstatisticasVendas,
  OBJETIVO_MARGEM
} from '@/lib/services/vendas.service'
import VendaCard from '@/components/vendas/VendaCard'
import toast from 'react-hot-toast'

export default function VendasPage() {
  const [vendas, setVendas] = useState<VendaWithLote[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasVendas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [vendasData, estatisticasData] = await Promise.all([
        getVendas(),
        getEstatisticasVendas()
      ])
      setVendas(vendasData)
      setEstatisticas(estatisticasData)
    } catch (error: any) {
      toast.error('Erro ao carregar dados de vendas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Finalize o ciclo e acompanhe seus resultados</p>
        </div>
        <Link href="/dashboard/vendas/novo">
          <button className="btn-primary">+ Nova Venda</button>
        </Link>
      </div>

      {/* KPIs */}
      {estatisticas && estatisticas.total_vendas > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Vendido (R$)</p>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {formatNumber(estatisticas.valor_total_vendido)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Lucro Total (R$)</p>
            <p className={`text-2xl font-bold tabular-nums ${estatisticas.lucro_total >= 0 ? 'text-success' : 'text-error'}`}>
              {formatNumber(estatisticas.lucro_total)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Margem Media (%)</p>
            <p className={`text-2xl font-bold tabular-nums ${estatisticas.margem_media >= OBJETIVO_MARGEM ? 'text-success' : 'text-warning'}`}>
              {estatisticas.margem_media.toFixed(1)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Objetivo ({OBJETIVO_MARGEM}%+)</p>
            <p className="text-2xl font-bold tabular-nums">
              {estatisticas.vendas_atingiram_objetivo}/{estatisticas.total_vendas}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{estatisticas.percentual_objetivo}% atingiram</p>
          </div>
        </div>
      )}

      {/* Rendimento Carcaça */}
      {estatisticas?.rendimento_carcaca_medio && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Rend. Carcaca (%)</p>
              <p className="text-xl font-bold tabular-nums">{estatisticas.rendimento_carcaca_medio.toFixed(1)}</p>
            </div>
            <p className="text-sm text-muted-foreground">Media post mortem das vendas</p>
          </div>
        </div>
      )}

      {/* Lista de Vendas */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : vendas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhuma venda registrada</p>
          <Link href="/dashboard/vendas/novo">
            <button className="btn-primary">Registrar Primeira Venda</button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Historico de Vendas</h2>
            <span className="text-sm text-muted-foreground">{vendas.length} registro(s)</span>
          </div>

          <div className="space-y-2">
            {vendas.map((venda) => (
              <VendaCard key={venda.id} venda={venda} />
            ))}
          </div>
        </div>
      )}

      {/* Meta Card */}
      <div className="bg-muted/20 border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm font-medium">Objetivo: {OBJETIVO_MARGEM}% de Margem</p>
            <p className="text-xs text-muted-foreground">Vendas que atingem esse objetivo sao destacadas em verde</p>
          </div>
        </div>
      </div>
    </div>
  )
}
