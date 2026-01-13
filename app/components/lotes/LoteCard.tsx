import Link from 'next/link'
import { LoteWithStats } from '@/lib/services/lotes.service'

interface LoteCardProps {
  lote: LoteWithStats
}

export default function LoteCard({ lote }: LoteCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-success/20 text-success border-success/30'
      case 'inativo':
        return 'bg-muted/20 text-muted-foreground border-muted/30'
      case 'manutencao':
        return 'bg-warning/20 text-warning border-warning/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30'
    }
  }

  const getOcupacaoColor = (ocupacao: number) => {
    if (ocupacao >= 90) return 'text-error'
    if (ocupacao >= 70) return 'text-warning'
    return 'text-success'
  }

  const formatCurrency = (value?: number) => {
    if (!value) return '-'
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <Link href={`/dashboard/lotes/${lote.id}`}>
      <div className="card-leather p-6 hover:shadow-xl transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-display text-2xl mb-1 group-hover:text-primary transition-colors">
              {lote.nome}
            </h3>
            {lote.localizacao && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>📍</span> {lote.localizacao}
              </p>
            )}
            {lote.fornecedor && (
              <p className="text-xs text-muted-foreground mt-1">
                Fornecedor: {lote.fornecedor}
              </p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${getStatusColor(lote.status)}`}>
            {lote.status.toUpperCase()}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Animais</p>
            <p className="font-display text-xl">
              {lote.total_animais || lote.quantidade_total || 0}
              <span className="text-sm text-muted-foreground">/{lote.capacidade_maxima}</span>
            </p>
          </div>

          <div className="bg-muted/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {lote.custo_por_cabeca ? 'Custo/Cabeça' : 'Peso Médio'}
            </p>
            <p className="font-display text-xl">
              {lote.custo_por_cabeca 
                ? formatCurrency(lote.custo_por_cabeca)
                : `${lote.peso_medio} kg`
              }
            </p>
          </div>
        </div>

        {/* Custo Total (se houver) */}
        {lote.custo_total && (
          <div className="bg-primary/10 rounded-lg p-3 mb-4">
            <p className="text-xs text-primary mb-1">Custo Total da Operação</p>
            <p className="font-display text-2xl text-primary">
              {formatCurrency(lote.custo_total)}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground">Ocupação</p>
            <p className={`text-sm font-mono font-bold ${getOcupacaoColor(lote.ocupacao_percentual)}`}>
              {lote.ocupacao_percentual}%
            </p>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                lote.ocupacao_percentual >= 90
                  ? 'bg-error'
                  : lote.ocupacao_percentual >= 70
                  ? 'bg-warning'
                  : 'bg-success'
              }`}
              style={{ width: `${Math.min(lote.ocupacao_percentual, 100)}%` }}
            />
          </div>
        </div>

        {/* Tipo e Data */}
        {(lote.tipo_lote || lote.data_entrada) && (
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
            {lote.tipo_lote && (
              <p>Tipo: <span className="text-foreground font-semibold">{lote.tipo_lote}</span></p>
            )}
            {lote.data_entrada && (
              <p>Entrada: <span className="text-foreground font-semibold">
                {new Date(lote.data_entrada).toLocaleDateString('pt-BR')}
              </span></p>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
