'use client'

import Link from 'next/link'
import { PesagemWithDetails } from '@/lib/services/pesagens.service'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils/format'

interface PesagemCardProps {
  pesagem: PesagemWithDetails
}

export function PesagemCard({ pesagem }: PesagemCardProps) {
  const ganhoPositivo = pesagem.ganho > 0
  const gmdBom = pesagem.gmd >= 0.8 // GMD bom = acima de 800g/dia

  return (
    <Link href={`/dashboard/pesagens/${pesagem.id}`}>
      <div className="card-leather p-4 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐮</span>
              <h3 className="font-display text-lg text-foreground truncate">
                {pesagem.animal?.brinco || 'N/A'}
              </h3>
            </div>
            {pesagem.animal?.nome && (
              <p className="text-sm text-muted-foreground truncate">
                {pesagem.animal.nome}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {formatDate(pesagem.data_pesagem)}
            </p>
            {pesagem.lote && (
              <p className="text-xs text-primary truncate max-w-[100px]">
                📍 {pesagem.lote.nome}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Peso Atual */}
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className="text-xl font-mono font-bold text-foreground">
              {pesagem.peso}
            </p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>

          {/* Ganho */}
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className={`text-xl font-mono font-bold ${ganhoPositivo ? 'text-green-400' : pesagem.ganho < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {pesagem.ganho > 0 ? '+' : ''}{pesagem.ganho}
            </p>
            <p className="text-xs text-muted-foreground">kg ganho</p>
          </div>

          {/* GMD */}
          <div className="text-center p-2 bg-background/30 rounded-lg">
            <p className={`text-xl font-mono font-bold ${gmdBom ? 'text-green-400' : 'text-yellow-400'}`}>
              {(pesagem.gmd * 1000).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">g/dia</p>
          </div>
        </div>

        {/* Footer Info */}
        {pesagem.dias_desde_ultima > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Peso anterior: {pesagem.peso_anterior ? `${pesagem.peso_anterior} kg` : '-'}
            </span>
            <span>
              {pesagem.dias_desde_ultima} dias
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
