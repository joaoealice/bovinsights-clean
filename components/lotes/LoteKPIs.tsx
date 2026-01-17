interface KPI {
  label: string
  value: string | number
  icon: string
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
          className="card-leather p-6 animate-slide-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">{kpi.icon}</span>
            {kpi.trend && (
              <span
                className={`text-sm font-mono font-bold ${
                  kpi.trend.positive ? 'text-success' : 'text-error'
                }`}
              >
                {kpi.trend.value}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
          <p className="font-display text-3xl">{kpi.value}</p>
          {kpi.subValue && (
            <p className="text-sm text-muted-foreground mt-1">{kpi.subValue}</p>
          )}
        </div>
      ))}
    </div>
  )
}
