'use client'

import Link from 'next/link'
import { AnimalWithDetails } from '@/lib/services/animais.service'

interface AnimalCardProps {
  animal: AnimalWithDetails
}

export default function AnimalCard({ animal }: AnimalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-success/20 text-success border-success/30'
      case 'Vendido':
        return 'bg-accent/20 text-accent border-accent/30'
      case 'Morto':
        return 'bg-error/20 text-error border-error/30'
      case 'Transferido':
        return 'bg-warning/20 text-warning border-warning/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  const getSexoIcon = (sexo: string) => {
    return sexo === 'Macho' ? '♂' : '♀'
  }

  const getSexoColor = (sexo: string) => {
    return sexo === 'Macho' ? 'text-blue-500' : 'text-pink-500'
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <Link href={`/dashboard/animais/${animal.id}`}>
      <div className="card-leather p-6 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${getSexoColor(animal.sexo)}`}>
              {getSexoIcon(animal.sexo)}
            </div>
            <div>
              <h3 className="font-display text-2xl group-hover:text-primary transition-colors">
                {animal.brinco}
              </h3>
              {animal.nome && (
                <p className="text-muted-foreground text-sm">{animal.nome}</p>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(animal.status)}`}>
            {animal.status}
          </span>
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Peso Atual</p>
            <p className="font-mono font-bold text-lg">
              {animal.peso_atual ? `${animal.peso_atual} kg` : '-'}
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">GMD</p>
            <p className={`font-mono font-bold text-lg ${animal.gmd && animal.gmd > 0 ? 'text-success' : animal.gmd && animal.gmd < 0 ? 'text-error' : ''}`}>
              {animal.gmd ? `${animal.gmd.toFixed(3)} kg/dia` : '-'}
            </p>
          </div>
        </div>

        {/* Tags de informação */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
            {animal.raca}
          </span>
          <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
            {animal.tipo}
          </span>
          {animal.lote && (
            <span className="px-2 py-1 bg-muted/30 text-muted-foreground rounded text-xs font-medium">
              {animal.lote.nome}
            </span>
          )}
        </div>

        {/* Rodapé com mais detalhes */}
        <div className="border-t border-border pt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {animal.arroba_atual && (
              <span className="text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">{animal.arroba_atual.toFixed(1)}</span> @
              </span>
            )}
            {animal.ganho_total !== undefined && animal.ganho_total !== 0 && (
              <span className={`${animal.ganho_total > 0 ? 'text-success' : 'text-error'}`}>
                {animal.ganho_total > 0 ? '+' : ''}{animal.ganho_total.toFixed(1)} kg
              </span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            Entrada: {formatDate(animal.data_entrada)}
          </span>
        </div>

        {/* Valor de compra se existir */}
        {animal.valor_total_compra && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Valor de compra:</span>
              <span className="font-mono font-semibold text-accent">
                {formatCurrency(animal.valor_total_compra)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
