'use client'

import { cn } from '@/lib/utils/format'

export type StatusVariant = 'success' | 'warning' | 'error' | 'muted' | 'info'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  muted: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

// Mapeamento automático de status comum para variantes
const statusToVariant: Record<string, StatusVariant> = {
  // Status gerais
  ativo: 'success',
  active: 'success',
  inativo: 'muted',
  inactive: 'muted',
  manutencao: 'warning',
  maintenance: 'warning',

  // Status de animais
  vendido: 'info',
  sold: 'info',
  morto: 'error',
  dead: 'error',
  transferido: 'warning',
  transferred: 'warning',

  // Status gerais
  pendente: 'warning',
  pending: 'warning',
  concluido: 'success',
  completed: 'success',
  cancelado: 'error',
  cancelled: 'error',
}

export function StatusBadge({
  status,
  variant,
  size = 'md',
  className,
}: StatusBadgeProps) {
  // Determinar variante automaticamente se não fornecida
  const resolvedVariant = variant || statusToVariant[status.toLowerCase()] || 'muted'

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border capitalize',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
    >
      {status}
    </span>
  )
}

// Helper para obter cor de status
export function getStatusColor(status: string): StatusVariant {
  return statusToVariant[status.toLowerCase()] || 'muted'
}
