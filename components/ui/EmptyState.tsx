'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/format'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ActionButton = () => (
    <button
      onClick={action?.onClick}
      className="btn-primary px-6 py-2"
    >
      {action?.label}
    </button>
  )

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <span className="text-6xl mb-4" role="img" aria-label="empty">
        {icon}
      </span>
      <h3 className="text-xl font-display text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        action.href ? (
          <Link href={action.href} className="btn-primary px-6 py-2">
            {action.label}
          </Link>
        ) : (
          <ActionButton />
        )
      )}
    </div>
  )
}
