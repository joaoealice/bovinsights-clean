'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getManejoById, deleteManejo, ManejoWithLote, getTipoManejoInfo, getVacinaInfo, VACINAS } from '@/lib/services/manejo.service'
import toast from 'react-hot-toast'

const TIPO_ICONS: Record<string, string> = {
  vermifugo: '💊',
  vacinacao: '💉',
  suplementacao: '🌾',
  marcacao: '🏷️',
  castracao: '✂️',
  desmama: '🍼',
  outros: '📋',
}

export default function ManejoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [manejo, setManejo] = useState<ManejoWithLote | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadManejo()
  }, [resolvedParams.id])

  const loadManejo = async () => {
    try {
      const data = await getManejoById(resolvedParams.id)
      setManejo(data)
    } catch (error: any) {
      toast.error('Erro ao carregar manejo')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteManejo(resolvedParams.id)
      toast.success('Manejo excluido com sucesso!')
      router.push('/dashboard/manejo')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir manejo')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="animate-pulse bg-muted/30 h-10 w-48 rounded-lg"></div>
        <div className="animate-pulse bg-muted/30 h-64 rounded-lg"></div>
      </div>
    )
  }

  if (!manejo) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card-leather p-12 text-center">
          <span className="text-6xl block mb-4">🔍</span>
          <h2 className="font-display text-2xl mb-2">MANEJO NAO ENCONTRADO</h2>
          <p className="text-muted-foreground mb-6">O manejo que voce procura nao existe ou foi removido.</p>
          <Link
            href="/dashboard/manejo"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
          >
            <span>&larr;</span>
            <span>Voltar para Manejo</span>
          </Link>
        </div>
      </div>
    )
  }

  const tipoInfo = getTipoManejoInfo(manejo.tipo_manejo)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link
            href="/dashboard/manejo"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <span>&larr;</span>
            <span>Voltar para manejo</span>
          </Link>
          <h1 className="font-display text-4xl md:text-5xl">DETALHES DO MANEJO</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/manejo/${resolvedParams.id}/editar`}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-error hover:bg-error/90 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Card Principal */}
      <div className="card-leather p-6 space-y-6">
        {/* Header do Card */}
        <div className="flex items-start gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-4xl">
            {TIPO_ICONS[manejo.tipo_manejo] || '📋'}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl text-foreground">{manejo.descricao}</h2>
            <p className="text-muted-foreground">{tipoInfo.label}</p>
          </div>
        </div>

        {/* Informacoes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">DATA DO MANEJO</p>
            <p className="font-semibold text-lg">{formatDate(manejo.data_manejo)}</p>
          </div>

          {/* Tipo de Aplicacao */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">APLICACAO</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              manejo.tipo_aplicacao === 'lote_inteiro'
                ? 'bg-primary/20 text-primary'
                : 'bg-accent/20 text-accent'
            }`}>
              {manejo.tipo_aplicacao === 'lote_inteiro' ? 'Lote Inteiro' : 'Animais Individuais'}
            </span>
          </div>

          {/* Lote */}
          {manejo.lote && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">LOTE</p>
              <Link
                href={`/dashboard/lotes/${manejo.lote.id}`}
                className="text-primary hover:underline font-semibold"
              >
                📍 {manejo.lote.nome}
              </Link>
            </div>
          )}

          {/* Animais Individuais */}
          {manejo.tipo_aplicacao === 'animais_individuais' && manejo.animais_ids && manejo.animais_ids.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">ANIMAIS</p>
              <p className="font-semibold">{manejo.animais_ids.length} animal(is) selecionado(s)</p>
            </div>
          )}
        </div>

        {/* Vacinas */}
        {manejo.tipo_manejo === 'vacinacao' && manejo.vacinas && manejo.vacinas.length > 0 && (
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">VACINAS APLICADAS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {manejo.vacinas.map(v => {
                const vacinaInfo = getVacinaInfo(v)
                return (
                  <div
                    key={v}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      vacinaInfo?.obrigatoria
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-muted/30 border border-border'
                    }`}
                  >
                    <span className="text-xl">💉</span>
                    <div className="flex-1">
                      <p className="font-semibold">{vacinaInfo?.label || v}</p>
                      {vacinaInfo?.obrigatoria && (
                        <p className="text-xs text-warning">Vacinacao obrigatoria</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Observacoes */}
        {manejo.observacoes && (
          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">OBSERVACOES</p>
            <p className="text-foreground whitespace-pre-wrap">{manejo.observacoes}</p>
          </div>
        )}

        {/* Metadados */}
        <div className="pt-6 border-t border-border flex justify-between text-xs text-muted-foreground">
          <span>Criado em: {new Date(manejo.created_at).toLocaleString('pt-BR')}</span>
          <span>Atualizado em: {new Date(manejo.updated_at).toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Modal de Confirmacao de Exclusao */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-leather p-6 max-w-md w-full">
            <h3 className="font-display text-2xl mb-4">CONFIRMAR EXCLUSAO</h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir este manejo? Esta acao nao pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted/30 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-lg bg-error text-white hover:bg-error/90 transition-all disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
