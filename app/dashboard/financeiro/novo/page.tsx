'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createDespesa } from '@/lib/services/financeiro.service'
import DespesaForm from '@/components/financeiro/DespesaForm'
import toast from 'react-hot-toast'

function NovaDespesaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pegar lote da URL se vier de dentro de um lote
  const loteId = searchParams.get('lote')
  const loteName = searchParams.get('loteName')

  const handleSubmit = async (data: any) => {
    try {
      await createDespesa(data)
      toast.success('Despesa registrada com sucesso!')

      // Se veio de um lote, voltar para o lote
      if (loteId) {
        router.push(`/dashboard/lotes/${loteId}`)
      } else {
        router.push('/dashboard/financeiro')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar despesa')
      throw error
    }
  }

  const backUrl = loteId ? `/dashboard/lotes/${loteId}` : '/dashboard/financeiro'
  const backLabel = loteId ? 'Voltar para o lote' : 'Voltar para financeiro'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">NOVA DESPESA</h1>
        <p className="text-muted-foreground">Registre um custo ou investimento</p>
      </div>

      {/* Formulário */}
      <div className="card-leather p-6">
        <DespesaForm
          onSubmit={handleSubmit}
          submitLabel="Registrar Despesa"
          loteId={loteId || undefined}
          loteName={loteName || undefined}
        />
      </div>
    </div>
  )
}

export default function NovaDespesaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <NovaDespesaContent />
    </Suspense>
  )
}
