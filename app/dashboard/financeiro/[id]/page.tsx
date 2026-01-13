'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getDespesaById, deleteDespesa, DespesaWithLote, getCategoriaInfo } from '@/lib/services/financeiro.service'
import toast from 'react-hot-toast'

export default function DespesaDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [despesa, setDespesa] = useState<DespesaWithLote | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)
      await deleteDespesa(id)
      toast.success('Despesa excluída com sucesso!')
      router.push('/dashboard/financeiro')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir despesa')
      setDeleting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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

  const categoriaInfo = getCategoriaInfo(despesa.categoria)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/financeiro"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para financeiro</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{categoriaInfo.icon}</span>
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{categoriaInfo.label}</p>
                <h1 className="font-display text-3xl md:text-4xl">{despesa.descricao}</h1>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/dashboard/financeiro/${id}/editar`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105">
                Editar
              </button>
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-error/10 hover:bg-error/20 text-error font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* Valor em Destaque */}
      <div className="card-leather p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">VALOR DA DESPESA</p>
          <p className="font-display text-5xl md:text-6xl text-error">
            {formatCurrency(despesa.valor)}
          </p>
          <p className="text-muted-foreground mt-2">
            Registrada em {formatDate(despesa.data_despesa)}
          </p>
        </div>
      </div>

      {/* Informações Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhes */}
        <div className="card-leather p-6 space-y-6">
          <h2 className="font-display text-2xl">DETALHES</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Categoria</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{categoriaInfo.icon}</span>
                <span className="font-semibold text-lg">{categoriaInfo.label}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Data da Despesa</p>
              <p className="font-semibold">{formatDate(despesa.data_despesa)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor</p>
              <p className="font-mono font-bold text-xl text-error">{formatCurrency(despesa.valor)}</p>
            </div>
          </div>
        </div>

        {/* Vínculo e Observações */}
        <div className="card-leather p-6 space-y-6">
          <h2 className="font-display text-2xl">VÍNCULO</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Lote Vinculado</p>
              {despesa.lote ? (
                <Link href={`/dashboard/lotes/${despesa.lote.id}`}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/30 hover:bg-primary/20 transition-all cursor-pointer">
                    <span>📍</span>
                    <span className="font-semibold text-primary">{despesa.lote.nome}</span>
                    <span className="text-xs text-muted-foreground">→ Ver lote</span>
                  </div>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-lg border border-border">
                  <span>🏠</span>
                  <span className="text-muted-foreground">Despesa Geral (sem lote)</span>
                </div>
              )}
            </div>

            {despesa.observacoes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm bg-muted/20 rounded-lg p-4 border border-border">
                  {despesa.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metadados */}
      <div className="card-leather p-6">
        <h2 className="font-display text-xl mb-4">REGISTRO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Criado em</p>
            <p className="font-mono">{formatDateTime(despesa.created_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Última atualização</p>
            <p className="font-mono">{formatDateTime(despesa.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
