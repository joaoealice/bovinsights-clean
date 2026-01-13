'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getLoteById, updateLote, LoteWithStats } from '@/lib/services/lotes.service'
import LoteForm from '@/components/lotes/LoteForm'
import toast from 'react-hot-toast'

export default function EditarLotePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [lote, setLote] = useState<LoteWithStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadLote()
    }
  }, [id])

  const loadLote = async () => {
    try {
      setLoading(true)
      const data = await getLoteById(id)
      setLote(data)
    } catch (error: any) {
      toast.error('Erro ao carregar lote')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateLote(id, data)
      toast.success('Lote atualizado com sucesso!')
      router.push(`/dashboard/lotes/${id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar lote')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lote) {
    return (
      <div className="card-leather p-12 text-center">
        <p className="text-6xl mb-4">❌</p>
        <h3 className="font-display text-2xl mb-2">Lote não encontrado</h3>
        <Link href="/dashboard/lotes">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 mt-4">
            VOLTAR PARA LOTES
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/lotes/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para detalhes</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">EDITAR LOTE</h1>
        <p className="text-muted-foreground">Atualize as informações do lote "{lote.nome}"</p>
      </div>

      {/* Formulário */}
      <div className="card-leather p-8">
        <LoteForm
          initialData={lote}
          onSubmit={handleSubmit}
          submitLabel="Salvar Alterações"
        />
      </div>

      {/* Aviso */}
      {lote.total_animais > 0 && (
        <div className="card-leather p-6 bg-warning/5 border border-warning/20">
          <h3 className="font-display text-xl mb-3 flex items-center gap-2 text-warning">
            <span>⚠️</span>
            <span>Atenção</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Este lote possui <strong>{lote.total_animais} animais</strong>. Tenha cuidado ao alterar
            a capacidade máxima para não ultrapassar o limite permitido.
          </p>
        </div>
      )}
    </div>
  )
}
