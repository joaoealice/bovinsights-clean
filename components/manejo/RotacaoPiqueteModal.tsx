'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AreaPastagemComStatus, STATUS_PIQUETE_INFO, realizarRotacaoPiquete } from '@/lib/services/areas-pastagem.service'
import toast from 'react-hot-toast'

interface RotacaoPiqueteModalProps {
  isOpen: boolean
  onClose: () => void
  loteId: string
  loteNome: string
  piqueteAtual: AreaPastagemComStatus | null
  piquetesDisponiveis: AreaPastagemComStatus[]
  onSuccess: () => void
}

export default function RotacaoPiqueteModal({
  isOpen,
  onClose,
  loteId,
  loteNome,
  piqueteAtual,
  piquetesDisponiveis,
  onSuccess
}: RotacaoPiqueteModalProps) {
  const [selectedPiquete, setSelectedPiquete] = useState<string | null>(null)
  const [opcaoAvulso, setOpcaoAvulso] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleRotacao = async () => {
    try {
      setLoading(true)

      const piqueteNovoId = opcaoAvulso ? null : selectedPiquete

      await realizarRotacaoPiquete(
        loteId,
        piqueteAtual?.id || null,
        piqueteNovoId
      )

      toast.success(
        opcaoAvulso
          ? 'Lote movido para pasto avulso!'
          : 'Rotacao de piquete realizada com sucesso!'
      )

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar rotacao')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPiquete = (piqueteId: string) => {
    setSelectedPiquete(piqueteId)
    setOpcaoAvulso(false)
  }

  const handleSelectAvulso = () => {
    setSelectedPiquete(null)
    setOpcaoAvulso(true)
  }

  const canSubmit = opcaoAvulso || selectedPiquete

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">ROTACAO DE PIQUETE</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Lote: <span className="font-semibold text-foreground">{loteNome}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/30 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Piquete atual */}
          {piqueteAtual && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">PIQUETE ATUAL</h3>
              <div className="p-4 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{piqueteAtual.nome}</p>
                    <p className="text-sm text-muted-foreground">{piqueteAtual.area_hectares.toFixed(2)} ha</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Sera liberado para recuperacao
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Opcoes */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">SELECIONE O DESTINO</h3>

            {/* Opcao Avulso */}
            <div
              onClick={handleSelectAvulso}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all mb-3 ${
                opcaoAvulso
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-muted/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  opcaoAvulso ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {opcaoAvulso && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Pasto Avulso</p>
                  <p className="text-sm text-muted-foreground">
                    Lote fica sem piquete vinculado (para areas sem mapeamento)
                  </p>
                </div>
              </div>
            </div>

            {/* Piquetes disponiveis */}
            {piquetesDisponiveis.length > 0 ? (
              <div className="space-y-2">
                {piquetesDisponiveis.map((piquete) => {
                  const statusInfo = STATUS_PIQUETE_INFO[piquete.statusCalculado]
                  return (
                    <div
                      key={piquete.id}
                      onClick={() => handleSelectPiquete(piquete.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPiquete === piquete.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 bg-muted/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPiquete === piquete.id ? 'border-primary' : 'border-muted-foreground'
                        }`}>
                          {selectedPiquete === piquete.id && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">{piquete.nome}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusInfo.bgCor} ${statusInfo.cor}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {piquete.area_hectares.toFixed(2)} ha
                            </span>
                            {piquete.tipo_pasto && (
                              <span className="text-sm text-muted-foreground">
                                {piquete.tipo_pasto === 'marandu' && 'Marandu'}
                                {piquete.tipo_pasto === 'mombaca' && 'Mombaca'}
                                {piquete.tipo_pasto === 'decumbens' && 'Decumbens'}
                              </span>
                            )}
                            {piquete.capacidade_ua && (
                              <span className="text-sm text-muted-foreground">
                                {piquete.capacidade_ua.toFixed(1)} UA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-muted/10 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground mb-3">Nenhum piquete disponivel no momento</p>
                <Link
                  href="/dashboard/mapa"
                  className="text-primary hover:underline font-medium"
                >
                  Cadastrar novo piquete no mapa
                </Link>
              </div>
            )}
          </div>

          {/* Link para cadastrar novo */}
          <div className="border-t border-border pt-4">
            <Link
              href="/dashboard/mapa"
              className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Cadastrar novo piquete</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleRotacao}
              disabled={!canSubmit || loading}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                canSubmit && !loading
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
              }`}
            >
              {loading ? 'Processando...' : 'Confirmar Rotacao'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
