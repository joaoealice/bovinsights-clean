'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLotes, searchLotes, LoteWithStats } from '@/lib/services/lotes.service'
import LoteCard from '@/components/lotes/LoteCard'
import LoteKPIs from '@/components/lotes/LoteKPIs'
import toast from 'react-hot-toast'

export default function LotesPage() {
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

  // Calcular KPIs
  const totalLotes = lotes.length
  const totalAnimais = lotes.reduce((sum, l) => sum + l.total_animais, 0)
  const pesoMedioGeral = totalAnimais > 0
    ? Math.round(lotes.reduce((sum, l) => sum + (l.peso_medio * l.total_animais), 0) / totalAnimais * 10) / 10
    : 0
  const lotesAtivos = lotes.filter(l => l.status === 'ativo').length

  const kpis = [
    { label: 'Total de Lotes', value: totalLotes },
    { label: 'Lotes Ativos', value: lotesAtivos },
    { label: 'Total de Animais', value: totalAnimais },
    { label: 'Peso Medio Geral', value: pesoMedioGeral > 0 ? `${pesoMedioGeral} kg` : '-' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lotes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os lotes da sua fazenda</p>
        </div>
        <Link href="/dashboard/lotes/novo">
          <button className="btn-primary">
            + Criar Lote
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <LoteKPIs kpis={kpis} />

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome do lote..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutencao</option>
          </select>
          <button onClick={handleSearch} className="btn-primary">
            Buscar
          </button>
        </div>
        {(searchQuery || statusFilter) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos</span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary hover:underline font-medium"
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Lista de Lotes */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : lotes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter
              ? 'Nenhum lote encontrado com os filtros aplicados'
              : 'Nenhum lote cadastrado'}
          </p>
          <Link href="/dashboard/lotes/novo">
            <button className="btn-primary">
              Criar Primeiro Lote
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotes.map((lote) => (
            <LoteCard key={lote.id} lote={lote} />
          ))}
        </div>
      )}
    </div>
  )
}
