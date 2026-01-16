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
    const tipos: Record<string, { label: string; icon: string; bg: string }> = {
      confinamento: { label: 'Confinamento', icon: '🏠', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      semiconfinamento: { label: 'Semi Confinamento', icon: '🌾', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      pasto: { label: 'Pasto', icon: '🌿', bg: 'bg-green-500/20 text-green-400 border-green-500/30' },
      cria: { label: 'Cria', icon: '🐄', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      recria: { label: 'Recria', icon: '🐂', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      engorda: { label: 'Engorda', icon: '🥩', bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
      reproducao: { label: 'Reproducao', icon: '💕', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
      quarentena: { label: 'Quarentena', icon: '🏥', bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    }
    return tipos[tipo] || { label: tipo, icon: '📍', bg: 'bg-muted/30 text-muted-foreground border-muted/30' }
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

  // Formatar data da última pesagem
  const formatarDataPesagem = (data: string | null) => {
    if (!data) return null
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const tipoInfo = getTipoLabel(lote.tipo_lote)

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

        {/* Tipo de Lote - Destaque */}
        {tipoInfo && (
          <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${tipoInfo.bg}`}>
            <span className="text-xl">{tipoInfo.icon}</span>
            <span className="font-display text-lg tracking-wide">{tipoInfo.label}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-muted/20 rounded-lg p-2">
            <p className="text-xs text-muted-foreground mb-1">Animais</p>
            <p className="font-display text-xl">{lote.total_animais}</p>
          </div>
          <div className="text-center bg-muted/20 rounded-lg p-2">
            <p className="text-xs text-muted-foreground mb-1">Peso Med.</p>
            <p className="font-display text-xl">
              {lote.peso_medio > 0 ? lote.peso_medio : '-'}
              {lote.peso_medio > 0 && <span className="text-xs text-muted-foreground"> kg</span>}
            </p>
          </div>
          <div className="text-center bg-primary/15 rounded-lg p-2">
            <p className="text-xs text-muted-foreground mb-1">Total @</p>
            <p className="font-display text-xl text-primary">
              {lote.total_arrobas > 0 ? lote.total_arrobas : '-'}
            </p>
          </div>
        </div>

        {/* Última Pesagem e Dias no Lote */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/10 rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Última Pesagem</p>
            {lote.data_ultima_pesagem ? (
              <p className="font-mono font-bold text-sm text-success">
                {formatarDataPesagem(lote.data_ultima_pesagem)}
              </p>
            ) : (
              <p className="font-mono text-xs text-warning">Sem pesagem</p>
            )}
          </div>
          <div className="bg-muted/10 rounded-lg p-3 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Dias no Lote</p>
            <p className="font-mono font-bold text-sm">
              {diasNoLote} <span className="text-muted-foreground font-normal">dias</span>
            </p>
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
