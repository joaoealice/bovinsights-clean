'use client'

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
      case 'vendido':
        return 'bg-primary/20 text-primary border-primary/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30'
    }
  }

  const isVendido = lote.status === 'vendido'

  const getTipoLabel = (tipo: string | undefined) => {
    if (!tipo) return null
    const tipos: Record<string, string> = {
      confinamento: 'Confinamento',
      semiconfinamento: 'Semi Confinamento',
      pasto: 'Pasto',
      cria: 'Cria',
      recria: 'Recria',
      engorda: 'Engorda',
      reproducao: 'Reproducao',
      quarentena: 'Quarentena',
    }
    return tipos[tipo] || tipo
  }

  // Calcular dias no lote
  const calcularDiasNoLote = () => {
    const dataInicio = lote.data_entrada || lote.created_at
    const hoje = new Date()
    const inicio = new Date(dataInicio)
    const dias = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return dias
  }

  const diasNoLote = calcularDiasNoLote()

  // Determinar cor e fase do ciclo
  const getDiasCicloInfo = (dias: number) => {
    if (dias <= 45) return { cor: 'text-success', bg: 'bg-success/10 border-success/30', fase: 'Inicio' }
    if (dias <= 60) return { cor: 'text-primary', bg: 'bg-primary/10 border-primary/30', fase: '45-60d' }
    if (dias <= 90) return { cor: 'text-accent', bg: 'bg-accent/10 border-accent/30', fase: '60-90d' }
    if (dias <= 120) return { cor: 'text-warning', bg: 'bg-warning/10 border-warning/30', fase: '90-120d' }
    return { cor: 'text-error', bg: 'bg-error/10 border-error/30', fase: '+120d' }
  }

  const diasInfo = getDiasCicloInfo(diasNoLote)

  return (
    <Link href={`/dashboard/lotes/${lote.id}`}>
      <div className={`card-leather p-6 hover:scale-[1.02] transition-all cursor-pointer group relative ${isVendido ? 'border-2 border-primary/50 bg-primary/5' : ''}`}>
        {/* Badge de vendido */}
        {isVendido && (
          <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span>VENDIDO</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl truncate group-hover:text-primary transition-colors">
              {lote.nome}
            </h3>
            {lote.localizacao && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <span>📍</span>
                <span className="truncate">{lote.localizacao}</span>
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-mono font-bold border whitespace-nowrap ml-2 ${getStatusColor(lote.status)}`}>
            {lote.status.toUpperCase()}
          </span>
        </div>

        {/* Tipo de Lote e Dias */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {lote.tipo_lote && (
            <span className="text-xs bg-muted/30 px-2 py-1 rounded">
              {getTipoLabel(lote.tipo_lote)}
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded border ${diasInfo.bg}`}>
            <span className={`font-mono font-bold ${diasInfo.cor}`}>{diasNoLote}</span>
            <span className="text-muted-foreground ml-1">dias</span>
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Animais</p>
            <p className="font-mono font-bold text-lg">{lote.total_animais}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peso Med.</p>
            <p className="font-mono font-bold text-lg">
              {lote.peso_medio > 0 ? `${lote.peso_medio}` : '-'}
              {lote.peso_medio > 0 && <span className="text-xs text-muted-foreground"> kg</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ciclo</p>
            <p className={`font-mono font-bold text-lg ${diasInfo.cor}`}>
              {diasInfo.fase}
            </p>
          </div>
        </div>

        {/* Barra de Progresso do Ciclo */}
        <div className="mb-4">
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                diasNoLote <= 45 ? 'bg-success' :
                diasNoLote <= 60 ? 'bg-primary' :
                diasNoLote <= 90 ? 'bg-accent' :
                diasNoLote <= 120 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${Math.min((diasNoLote / 120) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Custos (se houver) */}
        {lote.custo_por_cabeca && lote.custo_por_cabeca > 0 && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Custo/Cabeca</span>
              <span className="font-mono font-bold text-accent">
                {lote.custo_por_cabeca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        )}

        {/* Hover indicator */}
        <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-primary font-semibold">
            Clique para ver detalhes
          </span>
        </div>
      </div>
    </Link>
  )
}
