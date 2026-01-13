'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  getPesagemById,
  deletePesagem,
  getPesagensByAnimal,
  calcularGMDAnimal,
  PesagemWithDetails
} from '@/lib/services/pesagens.service'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AnimalPesagemKPIs } from '@/components/pesagens/PesagemKPIs'
import { formatDate, formatDateTime } from '@/lib/utils/format'

export default function DetalhesPesagemPage() {
  const params = useParams()
  const router = useRouter()
  const [pesagem, setPesagem] = useState<PesagemWithDetails | null>(null)
  const [historico, setHistorico] = useState<PesagemWithDetails[]>([])
  const [gmdData, setGmdData] = useState({ gmd: 0, total_pesagens: 0, ganho_total: 0, periodo_dias: 0 })
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadPesagem()
  }, [params.id])

  async function loadPesagem() {
    try {
      setLoading(true)
      const data = await getPesagemById(params.id as string)

      if (!data) {
        toast.error('Pesagem não encontrada')
        router.push('/dashboard/pesagens')
        return
      }

      setPesagem(data)

      // Carregar histórico e GMD do animal
      if (data.animal_id) {
        const [historicoData, gmd] = await Promise.all([
          getPesagensByAnimal(data.animal_id),
          calcularGMDAnimal(data.animal_id)
        ])
        setHistorico(historicoData)
        setGmdData(gmd)
      }
    } catch (error) {
      console.error('Erro ao carregar pesagem:', error)
      toast.error('Erro ao carregar pesagem')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta pesagem?')) return

    try {
      setDeleting(true)
      await deletePesagem(params.id as string)
      toast.success('Pesagem excluída com sucesso!')
      router.push('/dashboard/pesagens')
    } catch (error: any) {
      console.error('Erro ao excluir:', error)
      toast.error(error.message || 'Erro ao excluir pesagem')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <PageLoading message="Carregando pesagem..." />
  }

  if (!pesagem) {
    return null
  }

  const ganhoPositivo = pesagem.ganho > 0
  const gmdBom = pesagem.gmd >= 0.8

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/pesagens"
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Voltar para Pesagens
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⚖️</span>
              <h1 className="text-3xl font-display text-foreground">
                Pesagem - {pesagem.animal?.brinco}
              </h1>
            </div>
            {pesagem.animal?.nome && (
              <p className="text-muted-foreground text-lg">
                {pesagem.animal.nome}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/pesagens/${pesagem.id}/editar`}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs do Animal */}
      <AnimalPesagemKPIs
        totalPesagens={gmdData.total_pesagens}
        gmd={gmdData.gmd}
        ganhoTotal={gmdData.ganho_total}
        periodoDias={gmdData.periodo_dias}
        pesoAtual={pesagem.peso}
      />

      {/* Detalhes da Pesagem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Principal */}
        <div className="card-leather p-6">
          <h2 className="font-display text-xl text-foreground mb-4">
            Detalhes desta Pesagem
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background/30 rounded-lg text-center">
              <p className="text-3xl font-mono font-bold text-foreground">
                {pesagem.peso}
              </p>
              <p className="text-sm text-muted-foreground">kg</p>
            </div>

            <div className="p-4 bg-background/30 rounded-lg text-center">
              <p className={`text-3xl font-mono font-bold ${ganhoPositivo ? 'text-green-400' : pesagem.ganho < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {pesagem.ganho > 0 ? '+' : ''}{pesagem.ganho}
              </p>
              <p className="text-sm text-muted-foreground">kg de ganho</p>
            </div>

            <div className="p-4 bg-background/30 rounded-lg text-center">
              <p className={`text-3xl font-mono font-bold ${gmdBom ? 'text-green-400' : 'text-yellow-400'}`}>
                {(pesagem.gmd * 1000).toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">g/dia (GMD)</p>
            </div>

            <div className="p-4 bg-background/30 rounded-lg text-center">
              <p className="text-3xl font-mono font-bold text-foreground">
                {pesagem.dias_desde_ultima || '-'}
              </p>
              <p className="text-sm text-muted-foreground">dias</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Data da Pesagem</span>
              <span className="font-medium">{formatDate(pesagem.data_pesagem)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Peso Anterior</span>
              <span className="font-medium">{pesagem.peso_anterior ? `${pesagem.peso_anterior} kg` : '-'}</span>
            </div>

            {pesagem.lote && (
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Lote</span>
                <Link href={`/dashboard/lotes/${pesagem.lote.id}`} className="text-primary hover:underline">
                  {pesagem.lote.nome}
                </Link>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Registrado em</span>
              <span className="font-medium">{formatDateTime(pesagem.created_at)}</span>
            </div>

            {pesagem.observacoes && (
              <div className="py-2">
                <span className="text-muted-foreground block mb-1">Observações</span>
                <p className="text-foreground">{pesagem.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Pesagens */}
        <div className="card-leather p-6">
          <h2 className="font-display text-xl text-foreground mb-4">
            Histórico do Animal
          </h2>

          {historico.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma pesagem anterior
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {historico.map((p, index) => (
                <Link
                  key={p.id}
                  href={`/dashboard/pesagens/${p.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    p.id === pesagem.id
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-background/30 hover:bg-background/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold">{p.peso} kg</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.data_pesagem)}</p>
                    </div>
                    <div className="text-right">
                      {p.ganho !== 0 && (
                        <p className={`text-sm font-medium ${p.ganho > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.ganho > 0 ? '+' : ''}{p.ganho} kg
                        </p>
                      )}
                      {p.gmd > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {(p.gmd * 1000).toFixed(0)} g/dia
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
