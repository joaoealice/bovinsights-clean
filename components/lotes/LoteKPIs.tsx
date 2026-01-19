'use client'

interface KPI {
  label: string
  value: string | number
  subValue?: string
  trend?: {
    value: string
    positive: boolean
  }
}

interface LoteKPIsProps {
  kpis: KPI[]
}

export default function LoteKPIs({ kpis }: LoteKPIsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-xl p-4 min-h-[100px]"
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {kpi.label}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {kpi.value}
          </p>
          {(kpi.subValue || kpi.trend) && (
            <div className="flex items-center gap-2 mt-1">
              {kpi.subValue && (
                <span className="text-xs text-muted-foreground">{kpi.subValue}</span>
              )}
              {kpi.trend && (
                <span className={`text-xs font-medium ${kpi.trend.positive ? 'text-success' : 'text-error'}`}>
                  {kpi.trend.positive ? '↑' : '↓'} {kpi.trend.value}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
