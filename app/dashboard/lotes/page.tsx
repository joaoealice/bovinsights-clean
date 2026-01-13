'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getLotes, searchLotes, LoteWithStats } from '@/lib/services/lotes.service'
import LoteCard from '@/components/lotes/LoteCard'
import LoteKPIs from '@/components/lotes/LoteKPIs'
import toast from 'react-hot-toast'

export default function LotesPage() {
  const router = useRouter()
  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadLotes()
  }, [])

  const loadLotes = async () => {
    try {
      setLoading(true)
      const data = await getLotes()
      setLotes(data)
    } catch (error: any) {
      toast.error('Erro ao carregar lotes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const data = await searchLotes(searchQuery, statusFilter)
      setLotes(data)
    } catch (error: any) {
      toast.error('Erro na busca')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    loadLotes()
  }

  // Calcular KPIs gerais
  const totalLotes = lotes.length
  const totalAnimais = lotes.reduce((sum, l) => sum + l.total_animais, 0)
  const pesoMedioGeral = totalAnimais > 0
    ? Math.round(lotes.reduce((sum, l) => sum + (l.peso_medio * l.total_animais), 0) / totalAnimais * 10) / 10
    : 0
  const lotesAtivos = lotes.filter(l => l.status === 'ativo').length

  const kpis = [
    { label: 'Total de Lotes', value: totalLotes, icon: '📍' },
    { label: 'Lotes Ativos', value: lotesAtivos, icon: '✅' },
    { label: 'Total de Animais', value: totalAnimais, icon: '🐮' },
    { label: 'Peso Médio Geral', value: `${pesoMedioGeral} kg`, icon: '⚖️' },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">LOTES</h1>
          <p className="text-muted-foreground">Gerencie os lotes da sua fazenda</p>
        </div>
        <Link href="/dashboard/lotes/novo">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            <span className="text-xl">+</span>
            CRIAR LOTE
          </button>
        </Link>
      </div>

        {/* KPIs */}
        <LoteKPIs kpis={kpis} />

        {/* Filtros */}
        <div className="card-leather p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="🔍 Buscar por nome do lote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="manutencao">Manutenção</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all"
              >
                Buscar
              </button>
            </div>
          </div>
          {(searchQuery || statusFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary hover:underline font-semibold"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de Lotes */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : lotes.length === 0 ? (
          <div className="card-leather p-12 text-center">
            <p className="text-6xl mb-4">📍</p>
            <h3 className="font-display text-2xl mb-2">Nenhum lote encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro lote'}
            </p>
            <Link href="/dashboard/lotes/novo">
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
                CRIAR PRIMEIRO LOTE
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lotes.map((lote) => (
              <LoteCard key={lote.id} lote={lote} />
            ))}
          </div>
        )}
    </div>
  )
}
