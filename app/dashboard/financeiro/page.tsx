'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getDespesasPorMes,
  getEstatisticasFinanceiras,
  DespesaWithLote,
  EstatisticasFinanceiras,
} from '@/lib/services/financeiro.service'
import DespesaCard from '@/components/financeiro/DespesaCard'
import toast from 'react-hot-toast'

interface MesDespesas {
  mes: string
  despesas: DespesaWithLote[]
  total: number
}

export default function FinanceiroPage() {
  const [meses, setMeses] = useState<MesDespesas[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasFinanceiras | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [mesesData, estatisticasData] = await Promise.all([
        getDespesasPorMes(),
        getEstatisticasFinanceiras()
      ])
      setMeses(mesesData)
      setEstatisticas(estatisticasData)
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatMesLabel = (mesKey: string) => {
    const [ano, mes] = mesKey.split('-')
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${meses[parseInt(mes) - 1]} ${ano}`
  }

  const formatMesLabelFull = (mesKey: string) => {
    const [ano, mes] = mesKey.split('-')
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${meses[parseInt(mes) - 1]} de ${ano}`
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">FINANCEIRO</h1>
          <p className="text-muted-foreground">Controle de custos e despesas da produção</p>
        </div>
        <Link href="/dashboard/financeiro/novo">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            <span className="text-xl">+</span>
            NOVA DESPESA
          </button>
        </Link>
      </div>

      {/* KPIs Resumo */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
            <p className="font-display text-2xl md:text-3xl text-error">
              {formatCurrency(estatisticas.total_gasto)}
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Este Mês</p>
            <p className="font-display text-2xl md:text-3xl">
              {formatCurrency(estatisticas.despesas_mes_atual)}
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Custo Médio/Lote</p>
            <p className="font-display text-2xl md:text-3xl">
              {estatisticas.custo_medio_por_lote > 0
                ? formatCurrency(estatisticas.custo_medio_por_lote)
                : '-'}
            </p>
          </div>
          <div className="card-leather p-6">
            <p className="text-sm text-muted-foreground mb-1">Meses Registrados</p>
            <p className="font-display text-2xl md:text-3xl">{meses.length}</p>
          </div>
        </div>
      )}

      {/* Lista por Mês */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : meses.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <p className="text-6xl mb-4">💰</p>
          <h3 className="font-display text-2xl mb-2">Nenhuma despesa registrada</h3>
          <p className="text-muted-foreground mb-6">
            Comece registrando sua primeira despesa para controlar os custos da produção
          </p>
          <Link href="/dashboard/financeiro/novo">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
              REGISTRAR PRIMEIRA DESPESA
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {meses.map((mesData) => (
            <div key={mesData.mes} className="card-leather p-6">
              {/* Header do Mês */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <h2 className="font-display text-2xl">{formatMesLabelFull(mesData.mes)}</h2>
                  <p className="text-sm text-muted-foreground">
                    {mesData.despesas.length} despesa{mesData.despesas.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total do mês</p>
                  <p className="font-mono font-bold text-xl text-error">
                    {formatCurrency(mesData.total)}
                  </p>
                </div>
              </div>

              {/* Lista de Despesas do Mês */}
              <div className="space-y-2">
                {mesData.despesas.map((despesa) => (
                  <DespesaCard key={despesa.id} despesa={despesa} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
