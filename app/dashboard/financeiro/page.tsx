'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getDespesasPorMes,
  getEstatisticasFinanceiras,
  DespesaWithLote,
  EstatisticasFinanceiras,
  getCategoriaInfo
} from '@/lib/services/financeiro.service'
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

  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatMesShort = (mesKey: string) => {
    const [ano, mes] = mesKey.split('-')
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${meses[parseInt(mes) - 1]}-${ano.slice(2)}`
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de custos e despesas</p>
        </div>
        <Link href="/dashboard/financeiro/novo">
          <button className="btn-primary">+ Nova Despesa</button>
        </Link>
      </div>

      {/* KPIs */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Gasto (R$)</p>
            <p className="text-2xl font-bold tabular-nums text-error">
              {formatNumber(estatisticas.total_gasto)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Este Mes (R$)</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatNumber(estatisticas.despesas_mes_atual)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Custo Med/Lote (R$)</p>
            <p className="text-2xl font-bold tabular-nums">
              {estatisticas.custo_medio_por_lote > 0
                ? formatNumber(estatisticas.custo_medio_por_lote)
                : '-'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 min-h-[100px]">
            <p className="text-sm font-medium text-muted-foreground mb-2">Meses Registrados</p>
            <p className="text-2xl font-bold tabular-nums">{meses.length}</p>
          </div>
        </div>
      )}

      {/* Historico */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : meses.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhuma despesa registrada</p>
          <Link href="/dashboard/financeiro/novo">
            <button className="btn-primary">Registrar Primeira Despesa</button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Historico de Despesas</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Categoria</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Descricao</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Lote</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {meses.flatMap((mesData) =>
                  mesData.despesas.map((despesa) => {
                    const categoriaInfo = getCategoriaInfo(despesa.categoria)
                    return (
                      <tr key={despesa.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 text-sm tabular-nums">
                          {new Date(despesa.data_despesa + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-muted">
                            {categoriaInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Link href={`/dashboard/financeiro/${despesa.id}`} className="hover:text-primary">
                            {despesa.descricao}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {despesa.lote?.nome || '-'}
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-medium tabular-nums text-error">
                          {formatNumber(despesa.valor)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/20">
                  <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-right">Total:</td>
                  <td className="text-right py-3 px-4 text-sm font-bold tabular-nums text-error">
                    {formatNumber(meses.reduce((sum, m) => sum + m.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo por Mes */}
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Resumo por Mes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {meses.map((mesData) => (
                <div key={mesData.mes} className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{formatMesShort(mesData.mes)}</p>
                  <p className="text-lg font-bold tabular-nums">{formatNumber(mesData.total)}</p>
                  <p className="text-xs text-muted-foreground">{mesData.despesas.length} reg.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
