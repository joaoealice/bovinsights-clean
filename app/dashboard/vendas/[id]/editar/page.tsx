'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import VendaForm from '@/components/vendas/VendaForm'
import { getVendaById, updateVenda, VendaWithLote } from '@/lib/services/vendas.service'
import toast from 'react-hot-toast'

export default function EditarVendaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [venda, setVenda] = useState<VendaWithLote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenda()
  }, [id])

  const loadVenda = async () => {
    try {
      const data = await getVendaById(id)
      setVenda(data)
    } catch (error: any) {
      toast.error('Erro ao carregar venda')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      const vendaAtualizada = await updateVenda(id, data)
      toast.success('Venda atualizada com sucesso!')

      if (vendaAtualizada.atingiu_objetivo) {
        toast.success('Objetivo de margem atingido!', { icon: '🎯' })
      }

      router.push(`/dashboard/vendas/${id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar venda')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!venda) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">❌</p>
        <h2 className="font-display text-2xl mb-2">Venda não encontrada</h2>
        <Link href="/dashboard/vendas">
          <button className="text-primary hover:underline">Voltar para vendas</button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/vendas/${id}`}>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <span className="text-2xl">←</span>
          </button>
        </Link>
        <div>
          <h1 className="font-display text-3xl md:text-4xl">EDITAR VENDA</h1>
          <p className="text-muted-foreground">Atualize as informações da venda</p>
        </div>
      </div>

      {/* Formulário */}
      <VendaForm
        onSubmit={handleSubmit}
        submitLabel="Salvar Alterações"
        initialData={{
          data_venda: venda.data_venda,
          lote_id: venda.lote_id,
          quantidade_cabecas: venda.quantidade_cabecas,
          peso_total_kg: venda.peso_total_kg,
          preco_arroba_venda: venda.preco_arroba_venda,
          custo_total: venda.custo_total,
          comprador: venda.comprador,
          observacoes: venda.observacoes,
          post_mortem_data: venda.post_mortem_data,
          post_mortem_frigorifico: venda.post_mortem_frigorifico,
          post_mortem_rendimento_carcaca: venda.post_mortem_rendimento_carcaca,
        }}
        loteId={venda.lote_id || undefined}
        loteName={venda.lote?.nome}
      />
    </div>
  )
}
