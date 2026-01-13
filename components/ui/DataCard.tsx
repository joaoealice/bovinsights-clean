'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/format'
import { StatusBadge, StatusVariant } from './StatusBadge'

interface DataCardProps {
  title: string
  subtitle?: string
  href?: string
  status?: {
    label: string
    variant?: StatusVariant
  }
  stats?: {
    label: string
    value: string | number
    icon?: string
  }[]
  footer?: React.ReactNode
  onClick?: () => void
  className?: string
  children?: React.ReactNode
}

export function DataCard({
  title,
  subtitle,
  href,
  status,
  stats,
  footer,
  onClick,
  className,
  children,
}: DataCardProps) {
  const CardContent = () => (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-foreground truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
        {status && (
          <StatusBadge
            status={status.label}
            variant={status.variant}
            size="sm"
          />
        )}
      </div>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className={cn(
          'grid gap-3 mb-3',
          stats.length === 2 ? 'grid-cols-2' :
          stats.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        )}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-2 bg-background/30 rounded-lg">
              {stat.icon && (
                <span className="text-lg mb-1 block">{stat.icon}</span>
              )}
              <p className="text-lg font-mono font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Custom Content */}
      {children}

      {/* Footer */}
      {footer && (
        <div className="mt-3 pt-3 border-t border-border/50">
          {footer}
        </div>
      )}
    </>
  )

  const cardClasses = cn(
    'card-leather p-4 transition-all duration-200',
    (href || onClick) && 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        <CardContent />
      </Link>
    )
  }

  if (onClick) {
    return (
      <div onClick={onClick} className={cardClasses}>
        <CardContent />
      </div>
    )
  }

  return (
    <div className={cardClasses}>
      <CardContent />
    </div>
  )
}

// Componente de KPI individual
interface KPICardProps {
  label: string
  value: string | number
  icon?: string
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
  style?: React.CSSProperties
}

export function KPICard({
  label,
  value,
  icon,
  trend,
  className,
  style,
}: KPICardProps) {
  return (
    <div className={cn('card-leather p-4', className)} style={style}>
      <div className="flex items-center justify-between mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        {trend && (
          <span className={cn(
            'text-sm font-medium',
            trend.positive ? 'text-green-400' : 'text-red-400'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-mono font-bold text-foreground">
        {value}
      </p>
      <p className="text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
