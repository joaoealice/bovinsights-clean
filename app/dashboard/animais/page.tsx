'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getAnimais,
  searchAnimais,
  getEstatisticasAnimais,
  AnimalWithDetails,
  AnimalFilters,
  RACAS,
  TIPOS_ANIMAL,
  STATUS_ANIMAL
} from '@/lib/services/animais.service'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import AnimalCard from '@/components/animais/AnimalCard'
import AnimalKPIs from '@/components/animais/AnimalKPIs'
import toast from 'react-hot-toast'

export default function AnimaisPage() {
  const router = useRouter()
  const [animais, setAnimais] = useState<AnimalWithDetails[]>([])
  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<AnimalFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'animais' | 'lotes'>('lotes')
  const [estatisticas, setEstatisticas] = useState({
    total_animais: 0,
    total_ativos: 0,
    machos: 0,
    femeas: 0,
    peso_medio: 0,
    gmd_medio: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [animaisData, lotesData, stats] = await Promise.all([
        getAnimais(),
        getLotes(),
        getEstatisticasAnimais()
      ])
      setAnimais(animaisData)
      setLotes(lotesData)
      setEstatisticas(stats)
    } catch (error: any) {
      toast.error('Erro ao carregar animais')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const data = await searchAnimais(searchQuery, filters)
      setAnimais(data)
    } catch (error: any) {
      toast.error('Erro na busca')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AnimalFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilters({})
    loadData()
  }

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v)

  // Calcular totais baseados nos lotes (fonte principal)
  const totalAnimaisLotes = lotes.reduce((sum, l) => sum + l.total_animais, 0)
  const totalKgLotes = lotes.reduce((sum, l) => sum + (l.peso_medio * l.total_animais), 0)
  const pesoMedioGeral = totalAnimaisLotes > 0 ? totalKgLotes / totalAnimaisLotes : 0

  // Calcular KPIs usando dados dos lotes como fonte principal
  const kpis = [
    {
      label: 'Total de Animais',
      value: Math.max(totalAnimaisLotes, estatisticas.total_animais),
      icon: '🐮',
      subValue: `${lotes.filter(l => l.status === 'ativo').length} lotes ativos`
    },
    {
      label: 'Identificados',
      value: estatisticas.total_ativos,
      icon: '🏷️',
      subValue: animais.length > 0 ? `${Math.round((estatisticas.total_ativos / Math.max(totalAnimaisLotes, 1)) * 100)}% do rebanho` : 'Nenhum'
    },
    {
      label: 'Machos / Fêmeas',
      value: `${estatisticas.machos} / ${estatisticas.femeas}`,
      icon: '♂️♀️'
    },
    {
      label: 'Peso Médio',
      value: `${pesoMedioGeral > 0 ? pesoMedioGeral.toFixed(1) : estatisticas.peso_medio} kg`,
      icon: '⚖️',
      subValue: pesoMedioGeral > 0 ? `${(pesoMedioGeral / 30).toFixed(1)} @` : (estatisticas.peso_medio ? `${(estatisticas.peso_medio / 30).toFixed(1)} @` : undefined)
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">ANIMAIS</h1>
          <p className="text-muted-foreground">Identifique e gerencie animais nos lotes</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/lotes">
            <button className="bg-muted/30 hover:bg-muted/50 border border-border text-foreground font-bold px-6 py-4 rounded-lg transition-all flex items-center gap-2">
              <span>📍</span>
              VER LOTES
            </button>
          </Link>
          <Link href="/dashboard/animais/novo">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
              <span className="text-xl">+</span>
              IDENTIFICAR ANIMAL
            </button>
          </Link>
        </div>
      </div>

      {/* Aviso sobre identificacao */}
      {lotes.length > 0 && (
        <div className="card-leather p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30">
          <div className="flex items-start gap-4">
            <span className="text-3xl">i</span>
            <div>
              <h3 className="font-display text-lg mb-2">Identificacao Individual de Animais</h3>
              <p className="text-muted-foreground mb-3">
                Voce possui <strong>{totalAnimaisLotes} animais</strong> distribuidos em <strong>{lotes.length} lotes</strong>.
                {animais.length > 0 && (
                  <> Destes, <strong>{animais.length}</strong> estao identificados individualmente.</>
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-success">ok</span>
                  <span>Lote e a entidade principal do sistema</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success">ok</span>
                  <span>Identificacao nao altera o financeiro</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success">ok</span>
                  <span>Serve para rastreabilidade e performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <AnimalKPIs kpis={kpis} />

      {/* Barra de Busca e Filtros */}
      <div className="card-leather p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Buscar por brinco ou nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              showFilters ? 'bg-primary text-white' : 'bg-muted/30 border border-border hover:bg-muted/50'
            }`}
          >
            <span>Filtros</span>
            <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all"
          >
            Buscar
          </button>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-border animate-fadeIn">
            <select
              value={filters.lote_id || ''}
              onChange={(e) => handleFilterChange('lote_id', e.target.value)}
              className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Todos os Lotes</option>
              {lotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.nome}</option>
              ))}
            </select>

            <select
              value={filters.sexo || ''}
              onChange={(e) => handleFilterChange('sexo', e.target.value)}
              className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Todos os Sexos</option>
              <option value="Macho">Macho</option>
              <option value="Fêmea">Fêmea</option>
            </select>

            <select
              value={filters.raca || ''}
              onChange={(e) => handleFilterChange('raca', e.target.value)}
              className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Todas as Raças</option>
              {RACAS.map(raca => (
                <option key={raca.value} value={raca.value}>{raca.label}</option>
              ))}
            </select>

            <select
              value={filters.tipo || ''}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Todos os Tipos</option>
              {TIPOS_ANIMAL.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>

            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Todos os Status</option>
              {STATUS_ANIMAL.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Filtros ativos</span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-primary hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de Animais */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : animais.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <p className="text-6xl mb-4">🏷️</p>
          <h3 className="font-display text-2xl mb-2">
            {hasActiveFilters ? 'Nenhum animal encontrado' : 'Nenhum animal identificado'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {hasActiveFilters
              ? 'Tente ajustar os filtros de busca'
              : lotes.length > 0
                ? `Você possui ${totalAnimaisLotes} animais em ${lotes.length} lotes. Identifique individualmente quando necessário.`
                : 'Comece criando um lote para depois identificar os animais'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {lotes.length > 0 ? (
              <>
                <Link href="/dashboard/animais/novo">
                  <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
                    IDENTIFICAR ANIMAL
                  </button>
                </Link>
                <Link href="/dashboard/lotes">
                  <button className="bg-muted/30 hover:bg-muted/50 border border-border font-bold px-8 py-3 rounded-lg transition-all">
                    GERENCIAR LOTES
                  </button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard/lotes/novo">
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
                  CRIAR PRIMEIRO LOTE
                </button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Contador de resultados */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Exibindo <span className="font-semibold text-foreground">{animais.length}</span> animais
            </p>
          </div>

          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {animais.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
