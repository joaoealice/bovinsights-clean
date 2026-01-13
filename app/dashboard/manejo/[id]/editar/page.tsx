'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getManejoById, updateManejo, ManejoWithLote } from '@/lib/services/manejo.service'
import ManejoForm from '@/components/manejo/ManejoForm'
import toast from 'react-hot-toast'

export default function EditarManejoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [manejo, setManejo] = useState<ManejoWithLote | null>(null)
  const [loading, setLoading] = useState(true)

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

  const handleSubmit = async (data: any) => {
    try {
      await updateManejo(resolvedParams.id, data)
      toast.success('Manejo atualizado com sucesso!')
      router.push(`/dashboard/manejo/${resolvedParams.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar manejo')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse bg-muted/30 h-10 w-48 rounded-lg"></div>
        <div className="animate-pulse bg-muted/30 h-96 rounded-lg"></div>
      </div>
    )
  }

  if (!manejo) {
    return (
      <div className="max-w-2xl mx-auto">
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/manejo/${resolvedParams.id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>&larr;</span>
          <span>Voltar para detalhes</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">EDITAR MANEJO</h1>
        <p className="text-muted-foreground">Atualize as informacoes do manejo</p>
      </div>

      {/* Formulario */}
      <div className="card-leather p-6">
        <ManejoForm
          onSubmit={handleSubmit}
          submitLabel="Salvar Alteracoes"
          initialData={manejo}
          loteId={manejo.lote_id || undefined}
          loteName={manejo.lote?.nome}
        />
      </div>
    </div>
  )
}
