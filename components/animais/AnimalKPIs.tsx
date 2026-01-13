'use client'

interface KPI {
  label: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  subValue?: string
}

interface AnimalKPIsProps {
  kpis: KPI[]
}

export default function AnimalKPIs({ kpis }: AnimalKPIsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="card-leather p-6 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-3xl">{kpi.icon}</span>
            {kpi.trend && (
              <span className={`text-sm font-bold ${
                kpi.trend === 'up' ? 'text-success' :
                kpi.trend === 'down' ? 'text-error' :
                'text-muted-foreground'
              }`}>
                {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          <p className="font-display text-3xl md:text-4xl mb-1">{kpi.value}</p>
          <p className="text-muted-foreground text-sm">{kpi.label}</p>
          {kpi.subValue && (
            <p className="text-xs text-primary mt-1">{kpi.subValue}</p>
          )}
        </div>
      ))}
    </div>
  )
}
