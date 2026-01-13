'use client'

import { AreaPastagemComStatus, STATUS_PIQUETE_INFO, DIAS_RECUPERACAO_PASTO } from '@/lib/services/areas-pastagem.service'

interface PiqueteCardProps {
  piquete: AreaPastagemComStatus
  onRotacaoClick?: (piquete: AreaPastagemComStatus) => void
  diasNoLote?: number | null
  diasIdeal?: number | null
}

export default function PiqueteCard({ piquete, onRotacaoClick, diasNoLote, diasIdeal }: PiqueteCardProps) {
  const statusInfo = STATUS_PIQUETE_INFO[piquete.statusCalculado]

  // Verificar se data de permanência venceu
  const dataVencida = diasNoLote != null && diasIdeal != null && diasNoLote > diasIdeal

  // Definir cor do card baseado no status
  const getCardBorderColor = () => {
    if (piquete.statusCalculado === 'recuperacao') {
      return 'border-l-4 border-l-error bg-error/5'
    }
    if (dataVencida) {
      return 'border-l-4 border-l-warning bg-warning/5'
    }
    if (piquete.statusCalculado === 'lotado') {
      return 'border-l-4 border-l-primary bg-primary/5'
    }
    return 'border-l-4 border-l-success bg-success/5'
  }

  return (
    <div className={`card-leather p-4 ${getCardBorderColor()} transition-all hover:scale-[1.01]`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{piquete.nome}</h3>
          <p className="text-xs text-muted-foreground">{piquete.area_hectares.toFixed(2)} ha</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgCor} ${statusInfo.cor}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Info do lote vinculado */}
      {piquete.loteVinculado && (
        <div className="mb-3 p-2 rounded bg-muted/20">
          <p className="text-sm font-medium text-foreground">
            Lote: {piquete.loteVinculado.nome}
          </p>
          {diasNoLote !== null && diasIdeal !== null && (
            <div className="mt-1 flex items-center gap-2">
              <span className={`text-xs ${dataVencida ? 'text-warning font-bold' : 'text-muted-foreground'}`}>
                {diasNoLote} de {diasIdeal} dias
              </span>
              {dataVencida && (
                <span className="text-xs text-warning font-bold animate-pulse">
                  VENCIDO!
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info de recuperação */}
      {piquete.statusCalculado === 'recuperacao' && (
        <div className="mb-3 p-2 rounded bg-error/10 border border-error/20">
          <p className="text-xs text-error font-medium">Em recuperação</p>
          {piquete.diasEmRecuperacao !== null && piquete.diasParaDisponivel !== null && (
            <div className="mt-1">
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div
                  className="bg-error h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((piquete.diasEmRecuperacao / DIAS_RECUPERACAO_PASTO) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {piquete.diasParaDisponivel} dias restantes
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tipo de pasto */}
      {piquete.tipo_pasto && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="px-2 py-0.5 rounded bg-muted/20">
            {piquete.tipo_pasto === 'marandu' && 'Marandu'}
            {piquete.tipo_pasto === 'mombaca' && 'Mombaça'}
            {piquete.tipo_pasto === 'decumbens' && 'Decumbens'}
          </span>
          {piquete.capacidade_ua && (
            <span className="px-2 py-0.5 rounded bg-muted/20">
              {piquete.capacidade_ua.toFixed(1)} UA
            </span>
          )}
        </div>
      )}

      {/* Botão de ação */}
      {onRotacaoClick && piquete.statusCalculado === 'lotado' && (
        <button
          onClick={() => onRotacaoClick(piquete)}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            dataVencida
              ? 'bg-warning text-white hover:bg-warning/90'
              : 'bg-muted/30 text-foreground hover:bg-muted/50'
          }`}
        >
          {dataVencida ? 'Trocar de Piquete (Vencido!)' : 'Trocar de Piquete'}
        </button>
      )}

      {/* Status disponível */}
      {piquete.statusCalculado === 'disponivel' && (
        <div className="text-center py-2">
          <span className="text-xs text-success font-medium">Pronto para uso</span>
        </div>
      )}
    </div>
  )
}
