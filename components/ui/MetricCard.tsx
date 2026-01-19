'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subinfo?: string
  trend?: {
    value: string
    positive: boolean
  }
  highlight?: boolean
  className?: string
}

export default function MetricCard({
  label,
  value,
  subinfo,
  trend,
  highlight = false,
  className = ''
}: MetricCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 min-h-[100px] ${className}`}>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <p className={`font-bold tabular-nums ${highlight ? 'text-3xl text-primary' : 'text-2xl text-foreground'}`}>
        {value}
      </p>
      {(subinfo || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {subinfo && (
            <span className="text-xs text-muted-foreground">{subinfo}</span>
          )}
          {trend && (
            <span className={`text-xs font-medium ${trend.positive ? 'text-success' : 'text-error'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface MetricCardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
}

export function MetricCardGrid({ children, columns = 4 }: MetricCardGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  className?: string
}

export function StatCard({ label, value, unit, className = '' }: StatCardProps) {
  return (
    <div className={`bg-muted/30 rounded-lg p-3 text-center ${className}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  )
}

interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, subtitle, action, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 md:p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
