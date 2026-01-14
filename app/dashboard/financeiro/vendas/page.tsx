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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">VENDAS</h1>
          <p className="text-muted-foreground">Finalize o ciclo e acompanhe seus resultados</p>
        </div>
        <Link href="/dashboard/vendas/novo">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            <span className="text-xl">+</span>
            NOVA VENDA
          </button>
        </Link>
      </div>

      {/* KPIs Resumo */}
      {estatisticas && estatisticas.total_vendas > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Vendido</p>
            <p className="font-display text-2xl md:text-3xl text-primary">
              {formatCurrency(estatisticas.valor_total_vendido)}
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Lucro Total</p>
            <p className={`font-display text-2xl md:text-3xl ${estatisticas.lucro_total >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(estatisticas.lucro_total)}
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Margem Média</p>
            <p className={`font-display text-2xl md:text-3xl ${estatisticas.margem_media >= OBJETIVO_MARGEM ? 'text-success' : 'text-warning'}`}>
              {estatisticas.margem_media.toFixed(1)}%
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Objetivo ({OBJETIVO_MARGEM}%+)</p>
            <p className="font-display text-2xl md:text-3xl">
              {estatisticas.vendas_atingiram_objetivo}/{estatisticas.total_vendas}
              <span className="text-lg text-muted-foreground ml-2">({estatisticas.percentual_objetivo}%)</span>
            </p>
          </div>
        </div>
      )}

      {/* Rendimento Carcaça Médio */}
      {estatisticas?.rendimento_carcaca_medio && (
        <div className="card-leather p-6">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🩺</span>
            <div>
              <p className="text-sm text-muted-foreground">Rendimento de Carcaça Médio (Post Mortem)</p>
              <p className="font-display text-2xl">{estatisticas.rendimento_carcaca_medio.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Vendas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : vendas.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <p className="text-6xl mb-4">💰</p>
          <h3 className="font-display text-2xl mb-2">Nenhuma venda registrada</h3>
          <p className="text-muted-foreground mb-6">
            Registre sua primeira venda para acompanhar o resultado da sua produção
          </p>
          <Link href="/dashboard/vendas/novo">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
              REGISTRAR PRIMEIRA VENDA
            </button>
          </Link>
        </div>
      ) : (
        <div className="card-leather p-6 space-y-4">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <div>
              <h2 className="font-display text-2xl">Histórico de Vendas</h2>
              <p className="text-sm text-muted-foreground">
                {vendas.length} venda{vendas.length !== 1 ? 's' : ''} registrada{vendas.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {vendas.map((venda) => (
              <VendaCard key={venda.id} venda={venda} />
            ))}
          </div>
        </div>
      )}

      {/* Meta Card */}
      <div className="card-leather p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🎯</div>
          <div>
            <h3 className="font-display text-xl">Objetivo: {OBJETIVO_MARGEM}% de Margem</h3>
            <p className="text-muted-foreground">
              Seu objetivo é atingir no mínimo {OBJETIVO_MARGEM}% de margem em cada venda.
              Vendas que atingem esse objetivo são destacadas em verde.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
