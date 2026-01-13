'use client'

import Link from 'next/link'
import { ManejoWithLote, getTipoManejoInfo, getVacinaInfo } from '@/lib/services/manejo.service'

interface ManejoCardProps {
  manejo: ManejoWithLote
  showLote?: boolean
}

const TIPO_ICONS: Record<string, string> = {
  vermifugo: '💊',
  vacinacao: '💉',
  suplementacao: '🌾',
  marcacao: '🏷️',
  castracao: '✂️',
  desmama: '🍼',
  outros: '📋',
}

export default function ManejoCard({ manejo, showLote = true }: ManejoCardProps) {
  const tipoInfo = getTipoManejoInfo(manejo.tipo_manejo)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Link
      href={`/dashboard/manejo/${manejo.id}`}
      className="block card-leather p-4 hover:scale-[1.02] transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
          {TIPO_ICONS[manejo.tipo_manejo] || '📋'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {manejo.descricao}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tipoInfo.label}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(manejo.data_manejo)}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Tipo de aplicação */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              manejo.tipo_aplicacao === 'lote_inteiro'
                ? 'bg-primary/20 text-primary'
                : 'bg-accent/20 text-accent'
            }`}>
              {manejo.tipo_aplicacao === 'lote_inteiro' ? 'Lote Inteiro' : `${manejo.animais_ids?.length || 0} Animais`}
            </span>

            {/* Lote */}
            {showLote && manejo.lote && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-muted/30 text-muted-foreground">
                📍 {manejo.lote.nome}
              </span>
            )}

            {/* Vacinas */}
            {manejo.tipo_manejo === 'vacinacao' && manejo.vacinas && manejo.vacinas.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-success/20 text-success">
                {manejo.vacinas.length} vacina(s)
              </span>
            )}
          </div>

          {/* Vacinas list */}
          {manejo.tipo_manejo === 'vacinacao' && manejo.vacinas && manejo.vacinas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {manejo.vacinas.slice(0, 3).map(v => {
                const vacinaInfo = getVacinaInfo(v)
                return (
                  <span
                    key={v}
                    className={`px-2 py-0.5 rounded text-xs ${
                      vacinaInfo?.obrigatoria
                        ? 'bg-warning/20 text-warning'
                        : 'bg-muted/20 text-muted-foreground'
                    }`}
                  >
                    {vacinaInfo?.label || v}
                  </span>
                )
              })}
              {manejo.vacinas.length > 3 && (
                <span className="px-2 py-0.5 rounded text-xs bg-muted/20 text-muted-foreground">
                  +{manejo.vacinas.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
