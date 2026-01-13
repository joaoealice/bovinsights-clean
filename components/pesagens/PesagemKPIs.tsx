'use client'

import { KPICard } from '@/components/ui/DataCard'
import { EstatisticasPesagem } from '@/lib/services/pesagens.service'
import { formatDate } from '@/lib/utils/format'

interface PesagemKPIsProps {
  estatisticas: EstatisticasPesagem
  gmdMedio?: number
}

export function PesagemKPIs({ estatisticas, gmdMedio }: PesagemKPIsProps) {
  const kpis = [
    {
      label: 'Total de Pesagens',
      value: estatisticas.total_pesagens,
      icon: '⚖️'
    },
    {
      label: 'Peso Médio',
      value: `${estatisticas.peso_medio} kg`,
      icon: '📊'
    },
    {
      label: 'GMD Médio',
      value: gmdMedio ? `${(gmdMedio * 1000).toFixed(0)} g/dia` : '-',
      icon: '📈',
      trend: gmdMedio && gmdMedio >= 0.8
        ? { value: 'Bom', positive: true }
        : gmdMedio && gmdMedio > 0
        ? { value: 'Regular', positive: false }
        : undefined
    },
    {
      label: 'Última Pesagem',
      value: estatisticas.ultima_pesagem ? formatDate(estatisticas.ultima_pesagem) : '-',
      icon: '📅'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <KPICard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          trend={kpi.trend}
          className="animate-fadeIn"
          style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Componente para exibir KPIs de um animal específico
interface AnimalPesagemKPIsProps {
  totalPesagens: number
  gmd: number
  ganhoTotal: number
  periodoDias: number
  pesoAtual?: number
}

export function AnimalPesagemKPIs({
  totalPesagens,
  gmd,
  ganhoTotal,
  periodoDias,
  pesoAtual
}: AnimalPesagemKPIsProps) {
  const gmdBom = gmd >= 0.8

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard
        label="Pesagens"
        value={totalPesagens}
        icon="⚖️"
      />
      <KPICard
        label="Peso Atual"
        value={pesoAtual ? `${pesoAtual} kg` : '-'}
        icon="🐮"
      />
      <KPICard
        label="GMD"
        value={`${(gmd * 1000).toFixed(0)} g/dia`}
        icon="📈"
        trend={gmd > 0 ? { value: gmdBom ? 'Bom' : 'Regular', positive: gmdBom } : undefined}
      />
      <KPICard
        label="Ganho Total"
        value={`${ganhoTotal > 0 ? '+' : ''}${ganhoTotal} kg`}
        icon="💪"
        trend={ganhoTotal > 0 ? { value: 'Positivo', positive: true } : ganhoTotal < 0 ? { value: 'Negativo', positive: false } : undefined}
      />
      <KPICard
        label="Período"
        value={`${periodoDias} dias`}
        icon="📅"
      />
    </div>
  )
}
