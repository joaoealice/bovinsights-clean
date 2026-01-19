'use client'

import Link from 'next/link'
import { LoteWithStats } from '@/lib/services/lotes.service'

interface LoteCardProps {
  lote: LoteWithStats
}

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-success/10 text-success',
  inativo: 'bg-muted text-muted-foreground',
  manutencao: 'bg-warning/10 text-warning',
  vendido: 'bg-primary/10 text-primary'
}

const TIPO_STYLES: Record<string, { label: string; style: string }> = {
  confinamento: { label: 'Confinamento', style: 'bg-warning/10 text-warning' },
  semiconfinamento: { label: 'Semi Conf.', style: 'bg-accent/10 text-accent' },
  pasto: { label: 'Pasto', style: 'bg-success/10 text-success' },
  cria: { label: 'Cria', style: 'bg-primary/10 text-primary' },
  recria: { label: 'Recria', style: 'bg-secondary/10 text-secondary' },
  engorda: { label: 'Engorda', style: 'bg-error/10 text-error' },
  reproducao: { label: 'Reproducao', style: 'bg-accent/10 text-accent' },
  quarentena: { label: 'Quarentena', style: 'bg-muted text-muted-foreground' }
}

export default function LoteCard({ lote }: LoteCardProps) {
  const isVendido = lote.status === 'vendido'

  const calcularDiasNoLote = () => {
    const dataInicio = lote.data_entrada || lote.created_at
    const hoje = new Date()
    const inicio = new Date(dataInicio)
    return Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  }

  const diasNoLote = calcularDiasNoLote()
  const tipoInfo = lote.tipo_lote ? TIPO_STYLES[lote.tipo_lote] : null

  return (
    <Link href={`/dashboard/lotes/${lote.id}`}>
      <div className={`bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer ${isVendido ? 'opacity-75' : ''}`}>
        {/* Header: Nome + Status */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {lote.nome}
            </h3>
            {lote.localizacao && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {lote.localizacao}
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${STATUS_STYLES[lote.status] || STATUS_STYLES.inativo}`}>
            {lote.status.toUpperCase()}
          </span>
        </div>

        {/* Tipo do Lote */}
        {tipoInfo && (
          <div className={`inline-flex px-2 py-1 rounded text-xs font-medium mb-4 ${tipoInfo.style}`}>
            {tipoInfo.label}
          </div>
        )}

        {/* Métricas principais - Grid 3 colunas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center bg-muted/30 rounded-lg py-2 px-1">
            <p className="text-xs text-muted-foreground mb-0.5">Animais</p>
            <p className="text-xl font-bold tabular-nums">{lote.total_animais}</p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg py-2 px-1">
            <p className="text-xs text-muted-foreground mb-0.5">Peso Med.</p>
            <p className="text-xl font-bold tabular-nums">
              {lote.peso_medio > 0 ? lote.peso_medio : '-'}
            </p>
            {lote.peso_medio > 0 && (
              <p className="text-xs text-muted-foreground">kg</p>
            )}
          </div>
          <div className="text-center bg-primary/10 rounded-lg py-2 px-1">
            <p className="text-xs text-muted-foreground mb-0.5">Arrobas</p>
            <p className="text-xl font-bold tabular-nums text-primary">
              {lote.total_arrobas > 0 ? lote.total_arrobas : '-'}
            </p>
          </div>
        </div>

        {/* Info secundária */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Ultima Pesagem</p>
            <p className="text-sm font-medium tabular-nums">
              {lote.data_ultima_pesagem
                ? new Date(lote.data_ultima_pesagem).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                : '-'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Dias no Lote</p>
            <p className="text-sm font-medium tabular-nums">{diasNoLote}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
