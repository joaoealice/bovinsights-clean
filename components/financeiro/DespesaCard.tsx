'use client'

import Link from 'next/link'
import { DespesaWithLote, getCategoriaInfo } from '@/lib/services/financeiro.service'

interface DespesaCardProps {
  despesa: DespesaWithLote
  showLote?: boolean
}

export default function DespesaCard({ despesa, showLote = true }: DespesaCardProps) {
  const categoriaInfo = getCategoriaInfo(despesa.categoria)

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <Link href={`/dashboard/financeiro/${despesa.id}`}>
      <div className="bg-muted/20 hover:bg-muted/30 border border-border rounded-lg p-4 transition-all cursor-pointer group">
        <div className="flex items-center justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                {categoriaInfo.label}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(despesa.data_despesa)}</span>
            </div>
            <p className="font-medium truncate group-hover:text-primary transition-colors">
              {despesa.descricao}
            </p>
            {showLote && despesa.lote && (
              <p className="text-xs text-muted-foreground mt-1">
                📍 {despesa.lote.nome}
              </p>
            )}
          </div>

          {/* Valor */}
          <div className="text-right">
            <p className="font-mono font-bold text-error">
              {formatCurrency(despesa.valor)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
