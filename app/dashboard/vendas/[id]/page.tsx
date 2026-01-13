'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getVendaById, deleteVenda, VendaWithLote, OBJETIVO_MARGEM } from '@/lib/services/vendas.service'
import toast from 'react-hot-toast'

export default function VendaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [venda, setVenda] = useState<VendaWithLote | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return

    setDeleting(true)
    try {
      await deleteVenda(id)
      toast.success('Venda excluída com sucesso')
      router.push('/dashboard/vendas')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir venda')
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendas">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <span className="text-2xl">←</span>
            </button>
          </Link>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">DETALHES DA VENDA</h1>
            <p className="text-muted-foreground">{formatDate(venda.data_venda)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/vendas/${id}/editar`}>
            <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              Editar
            </button>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`p-6 rounded-lg text-center ${
        venda.atingiu_objetivo
          ? 'bg-success/10 border-2 border-success'
          : 'bg-warning/10 border-2 border-warning'
      }`}>
        <div className="text-4xl mb-2">{venda.atingiu_objetivo ? '🎯' : '📊'}</div>
        <p className={`font-display text-3xl ${venda.atingiu_objetivo ? 'text-success' : 'text-warning'}`}>
          {venda.atingiu_objetivo ? 'OBJETIVO ATINGIDO!' : `MARGEM ABAIXO DO OBJETIVO (${OBJETIVO_MARGEM}%)`}
        </p>
        <p className="text-muted-foreground mt-2">
          Margem de {venda.margem_percentual.toFixed(1)}%
        </p>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-leather p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Valor Total Venda</p>
          <p className="font-display text-2xl text-primary">{formatCurrency(venda.valor_total_venda)}</p>
        </div>
        <div className="card-leather p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
          <p className="font-display text-2xl text-error">{formatCurrency(venda.custo_total)}</p>
        </div>
        <div className="card-leather p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Lucro Bruto</p>
          <p className={`font-display text-2xl ${venda.lucro_bruto >= 0 ? 'text-success' : 'text-error'}`}>
            {formatCurrency(venda.lucro_bruto)}
          </p>
        </div>
        <div className="card-leather p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Margem</p>
          <p className={`font-display text-2xl ${venda.atingiu_objetivo ? 'text-success' : 'text-warning'}`}>
            {venda.margem_percentual.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Informações da Venda */}
      <div className="card-leather p-6 space-y-4">
        <h3 className="font-display text-xl border-b border-border pb-2">Informações da Venda</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-semibold">{formatDate(venda.data_venda)}</p>
          </div>

          {venda.lote && (
            <div>
              <p className="text-sm text-muted-foreground">Lote</p>
              <Link href={`/dashboard/lotes/${venda.lote.id}`} className="font-semibold text-primary hover:underline">
                {venda.lote.nome}
              </Link>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Quantidade</p>
            <p className="font-semibold">{venda.quantidade_cabecas} cabeças</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Peso Total</p>
            <p className="font-semibold">
              {venda.peso_total_kg.toLocaleString('pt-BR')} kg
              <span className="text-muted-foreground ml-1">({venda.peso_total_arrobas.toFixed(2)} @)</span>
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Preço por @</p>
            <p className="font-semibold">{formatCurrency(venda.preco_arroba_venda)}</p>
          </div>

          {venda.comprador && (
            <div>
              <p className="text-sm text-muted-foreground">Comprador</p>
              <p className="font-semibold">{venda.comprador}</p>
            </div>
          )}
        </div>

        {venda.observacoes && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Observações</p>
            <p>{venda.observacoes}</p>
          </div>
        )}
      </div>

      {/* Post Mortem */}
      {(venda.post_mortem_data || venda.post_mortem_frigorifico || venda.post_mortem_rendimento_carcaca) && (
        <div className="card-leather p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <span className="text-2xl">🩺</span>
            <h3 className="font-display text-xl">Post Mortem</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {venda.post_mortem_data && (
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-semibold">{formatDate(venda.post_mortem_data)}</p>
              </div>
            )}

            {venda.post_mortem_frigorifico && (
              <div>
                <p className="text-sm text-muted-foreground">Frigorífico</p>
                <p className="font-semibold">{venda.post_mortem_frigorifico}</p>
              </div>
            )}

            {venda.post_mortem_rendimento_carcaca && (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Rendimento de Carcaça</p>
                <p className="font-display text-3xl text-primary">
                  {venda.post_mortem_rendimento_carcaca.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este dado valida todo o processo de manejo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Análise */}
      <div className="card-leather p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <h3 className="font-display text-xl mb-4">Análise da Venda</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Receita por cabeça:</span>
            <span className="font-mono font-bold">
              {formatCurrency(venda.valor_total_venda / venda.quantidade_cabecas)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Custo por cabeça:</span>
            <span className="font-mono font-bold text-error">
              {formatCurrency(venda.custo_total / venda.quantidade_cabecas)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Lucro por cabeça:</span>
            <span className={`font-mono font-bold ${venda.lucro_bruto >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(venda.lucro_bruto / venda.quantidade_cabecas)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Peso médio por cabeça:</span>
            <span className="font-mono font-bold">
              {(venda.peso_total_kg / venda.quantidade_cabecas).toFixed(1)} kg
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>@ por cabeça:</span>
            <span className="font-mono font-bold">
              {(venda.peso_total_arrobas / venda.quantidade_cabecas).toFixed(2)} @
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
