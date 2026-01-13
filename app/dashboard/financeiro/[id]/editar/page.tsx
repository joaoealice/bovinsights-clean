'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getDespesaById, updateDespesa, DespesaWithLote } from '@/lib/services/financeiro.service'
import DespesaForm from '@/components/financeiro/DespesaForm'
import toast from 'react-hot-toast'

export default function EditarDespesaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [despesa, setDespesa] = useState<DespesaWithLote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadDespesa()
    }
  }, [id])

  const loadDespesa = async () => {
    try {
      setLoading(true)
      const data = await getDespesaById(id)
      setDespesa(data)
    } catch (error: any) {
      toast.error('Erro ao carregar despesa')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateDespesa(id, data)
      toast.success('Despesa atualizada com sucesso!')
      router.push(`/dashboard/financeiro/${id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar despesa')
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

  if (!despesa) {
    return (
      <div className="card-leather p-12 text-center">
        <p className="text-6xl mb-4">❌</p>
        <h3 className="font-display text-2xl mb-2">Despesa não encontrada</h3>
        <Link href="/dashboard/financeiro">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 mt-4">
            VOLTAR PARA FINANCEIRO
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/financeiro/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para detalhes</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">EDITAR DESPESA</h1>
        <p className="text-muted-foreground">Atualize as informações da despesa</p>
      </div>

      {/* Formulário */}
      <div className="card-leather p-8">
        <DespesaForm
          initialData={despesa}
          onSubmit={handleSubmit}
          submitLabel="Salvar Alterações"
        />
      </div>
    </div>
  )
}
