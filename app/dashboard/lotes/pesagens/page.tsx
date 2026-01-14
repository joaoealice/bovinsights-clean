'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getPesagens, searchPesagens, getEstatisticasPesagens, PesagemWithDetails, PesagemFilters, EstatisticasPesagem } from '@/lib/services/pesagens.service'
import { PesagemCard } from '@/components/pesagens/PesagemCard'
import { PesagemKPIs } from '@/components/pesagens/PesagemKPIs'
import { SearchFilter } from '@/components/ui/SearchFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'

interface Lote {
  id: string
  nome: string
}

export default function PesagensPage() {
  const [pesagens, setPesagens] = useState<PesagemWithDetails[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasPesagem>({
    total_pesagens: 0,
    peso_medio: 0,
    gmd_medio: 0,
    maior_peso: 0,
    menor_peso: 0
  })
  const [loading, setLoading] = useState(true)
  const [lotes, setLotes] = useState<Lote[]>([])

  // Filtros
  const [loteFilter, setLoteFilter] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Carregar lotes para o filtro
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: lotesData } = await supabase
          .from('lotes')
          .select('id, nome')
          .eq('usuario_id', user.id)
          .eq('status', 'ativo')
          .order('nome')

        if (lotesData) setLotes(lotesData)
      }

      // Carregar pesagens e estatísticas
      const [pesagensData, estatisticasData] = await Promise.all([
        getPesagens(),
        getEstatisticasPesagens()
      ])

      setPesagens(pesagensData)
      setEstatisticas(estatisticasData)

      // Calcular GMD médio
      if (pesagensData.length > 0) {
        const gmdTotal = pesagensData.reduce((sum, p) => sum + p.gmd, 0)
        const pesagensComGmd = pesagensData.filter(p => p.gmd > 0)
        const gmdMedio = pesagensComGmd.length > 0 ? gmdTotal / pesagensComGmd.length : 0
        setEstatisticas(prev => ({ ...prev, gmd_medio: gmdMedio }))
      }
    } catch (error) {
      console.error('Erro ao carregar pesagens:', error)
      toast.error('Erro ao carregar pesagens')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    try {
      const filters: PesagemFilters = {}
      if (loteFilter) filters.lote_id = loteFilter
      if (dataInicio) filters.data_inicio = dataInicio
      if (dataFim) filters.data_fim = dataFim

      const data = await searchPesagens(query, filters)
      setPesagens(data)
    } catch (error) {
      console.error('Erro ao buscar:', error)
      toast.error('Erro ao buscar pesagens')
    }
  }

  async function handleClearFilters() {
    setLoteFilter('')
    setDataInicio('')
    setDataFim('')
    await loadData()
  }

  if (loading) {
    return <PageLoading message="Carregando pesagens..." />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-foreground">Pesagens</h1>
          <p className="text-muted-foreground">
            Gerencie as pesagens do seu rebanho
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/pesagens/lote"
            className="px-5 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2 font-medium text-base"
          >
            <span>📋</span>
            Pesagem em Lote
          </Link>
          <Link
            href="/dashboard/pesagens/novo"
            className="btn-primary px-5 py-3 flex items-center gap-2 font-medium text-base"
          >
            <span>🐄</span>
            Pesagem Unitaria/Cabeca
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <PesagemKPIs
        estatisticas={estatisticas}
        gmdMedio={estatisticas.gmd_medio}
      />

      {/* Filtros */}
      <div className="card-leather p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca por brinco/nome */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Buscar animal
            </label>
            <input
              type="text"
              placeholder="Brinco ou nome..."
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>

          {/* Filtro por Lote */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Lote
            </label>
            <select
              value={loteFilter}
              onChange={(e) => setLoteFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os lotes</option>
              {lotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.nome}</option>
              ))}
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Data final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleSearch('')}
            className="btn-primary px-4 py-2"
          >
            Filtrar
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-border rounded-lg hover:bg-background/50 transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Lista de Pesagens */}
      {pesagens.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="Nenhuma pesagem registrada"
          description="Comece registrando a primeira pesagem do seu rebanho para acompanhar o ganho de peso."
          action={{
            label: 'Registrar Pesagem',
            href: '/dashboard/pesagens/novo'
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pesagens.map((pesagem) => (
            <PesagemCard key={pesagem.id} pesagem={pesagem} />
          ))}
        </div>
      )}
    </div>
  )
}
