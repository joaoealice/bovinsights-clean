'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import VendaForm from '@/components/vendas/VendaForm'
import { createVenda } from '@/lib/services/vendas.service'
import { getLoteById } from '@/lib/services/lotes.service'
import toast from 'react-hot-toast'

export default function NovaVendaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loteIdParam = searchParams.get('lote')

  const [loteId, setLoteId] = useState<string | undefined>(undefined)
  const [loteName, setLoteName] = useState<string | undefined>(undefined)
  const [loadingLote, setLoadingLote] = useState(!!loteIdParam)

  useEffect(() => {
    async function loadLote() {
      if (loteIdParam) {
        try {
          const lote = await getLoteById(loteIdParam)
          if (lote) {
            setLoteId(lote.id)
            setLoteName(lote.nome)
          }
        } catch (error) {
          console.error('Erro ao carregar lote:', error)
        } finally {
          setLoadingLote(false)
        }
      }
    }
    loadLote()
  }, [loteIdParam])

  const handleSubmit = async (data: any) => {
    try {
      const venda = await createVenda(data)
      toast.success('Venda registrada com sucesso!')

      if (venda.atingiu_objetivo) {
        toast.success('Parabéns! Objetivo de margem atingido!', { icon: '🎯' })
      }

      router.push('/dashboard/vendas')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao registrar venda')
      throw error
    }
  }

  if (loadingLote) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/vendas">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <span className="text-2xl">←</span>
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl md:text-4xl">NOVA VENDA</h1>
          <p className="text-muted-foreground">Registre a venda e finalize o ciclo</p>
        </div>
      </div>

      {/* Formulário */}
      <VendaForm
        onSubmit={handleSubmit}
        submitLabel="Registrar Venda"
        loteId={loteId}
        loteName={loteName}
      />
    </div>
  )
}
