import { EstatisticasFinanceiras, getCategoriaInfo } from '@/lib/services/financeiro.service'

interface FinanceiroKPIsProps {
  estatisticas: EstatisticasFinanceiras
}

export default function FinanceiroKPIs({ estatisticas }: FinanceiroKPIsProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const kpis = [
    {
      label: 'Total Gasto',
      value: formatCurrency(estatisticas.total_gasto),
      icon: '💰',
    },
    {
      label: 'Despesas no Mês',
      value: formatCurrency(estatisticas.despesas_mes_atual),
      icon: '📅',
    },
    {
      label: 'Custo Médio/Lote',
      value: estatisticas.custo_medio_por_lote > 0
        ? formatCurrency(estatisticas.custo_medio_por_lote)
        : 'N/A',
      icon: '📊',
    },
    {
      label: 'Maior Categoria',
      value: estatisticas.maior_categoria
        ? getCategoriaInfo(estatisticas.maior_categoria.categoria).label
        : 'N/A',
      icon: estatisticas.maior_categoria
        ? getCategoriaInfo(estatisticas.maior_categoria.categoria).icon
        : '📦',
      subValue: estatisticas.maior_categoria
        ? formatCurrency(estatisticas.maior_categoria.valor)
        : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="card-leather p-6 animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{kpi.icon}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
          <p className="font-display text-2xl md:text-3xl">{kpi.value}</p>
          {kpi.subValue && (
            <p className="text-xs text-muted-foreground mt-1">{kpi.subValue}</p>
          )}
        </div>
      ))}
    </div>
  )
}
