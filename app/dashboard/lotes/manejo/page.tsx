'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getManejos, ManejoWithLote, TIPOS_MANEJO, TipoManejo } from '@/lib/services/manejo.service'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import ManejoCard from '@/components/manejo/ManejoCard'
import SecaoManejoPastagem from '@/components/manejo/SecaoManejoPastagem'

type AbaManejo = 'rebanho' | 'pastagem'

export default function ManejoPage() {
  const [manejos, setManejos] = useState<ManejoWithLote[]>([])
  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaManejo>('rebanho')

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoManejo | ''>('')
  const [filtroLote, setFiltroLote] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [manejosData, lotesData] = await Promise.all([
        getManejos(),
        getLotes()
      ])
      setManejos(manejosData)
      setLotes(lotesData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  const manejosFiltrados = manejos.filter(manejo => {
    if (filtroTipo && manejo.tipo_manejo !== filtroTipo) return false
    if (filtroLote && manejo.lote_id !== filtroLote) return false
    if (busca && !manejo.descricao.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  // Agrupar por mês
  const manejosPorMes = manejosFiltrados.reduce((acc, manejo) => {
    const date = new Date(manejo.data_manejo + 'T00:00:00')
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(manejo)
    return acc
  }, {} as Record<string, ManejoWithLote[]>)

  const mesesOrdenados = Object.keys(manejosPorMes).sort((a, b) => b.localeCompare(a))

  const formatMesAno = (key: string) => {
    const [ano, mes] = key.split('-')
    const date = new Date(parseInt(ano), parseInt(mes) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()
  }

  // Estatísticas rápidas
  const stats = {
    total: manejos.length,
    mesAtual: manejos.filter(m => {
      const hoje = new Date()
      const dataManejo = new Date(m.data_manejo)
      return dataManejo.getMonth() === hoje.getMonth() && dataManejo.getFullYear() === hoje.getFullYear()
    }).length,
    vacinacoes: manejos.filter(m => m.tipo_manejo === 'vacinacao').length,
    vermifugos: manejos.filter(m => m.tipo_manejo === 'vermifugo').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="animate-pulse bg-muted/30 h-10 w-48 rounded-lg"></div>
          <div className="animate-pulse bg-muted/30 h-10 w-40 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-muted/30 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-muted/30 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-leather p-8 text-center">
        <p className="text-error text-lg">{error}</p>
        <button onClick={loadData} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">MANEJO</h1>
          <p className="text-muted-foreground">Registre e acompanhe todos os manejos do rebanho</p>
        </div>
        {abaAtiva === 'rebanho' && (
          <Link
            href="/dashboard/manejo/novo"
            className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-[1.02] shadow-lg flex items-center gap-2"
          >
            <span>+</span>
            <span>NOVO MANEJO</span>
          </Link>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setAbaAtiva('rebanho')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
            abaAtiva === 'rebanho'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          MANEJO DO REBANHO
        </button>
        <button
          onClick={() => setAbaAtiva('pastagem')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 -mb-px ${
            abaAtiva === 'pastagem'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          MANEJO DE PASTAGEM
        </button>
      </div>

      {/* Conteudo da aba de Pastagem */}
      {abaAtiva === 'pastagem' && <SecaoManejoPastagem />}

      {/* Conteudo da aba de Rebanho */}
      {abaAtiva === 'rebanho' && (
        <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-leather p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">TOTAL DE MANEJOS</p>
          <p className="font-display text-3xl text-foreground">{stats.total}</p>
        </div>
        <div className="card-leather p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">ESTE MES</p>
          <p className="font-display text-3xl text-primary">{stats.mesAtual}</p>
        </div>
        <div className="card-leather p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">VACINACOES</p>
          <p className="font-display text-3xl text-success">{stats.vacinacoes}</p>
        </div>
        <div className="card-leather p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">VERMIFUGOS</p>
          <p className="font-display text-3xl text-accent">{stats.vermifugos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-leather p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div>
            <input
              type="text"
              placeholder="Buscar por descricao..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filtro por tipo */}
          <div>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value as TipoManejo | '')}
              className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os tipos</option>
              {TIPOS_MANEJO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por lote */}
          <div>
            <select
              value={filtroLote}
              onChange={e => setFiltroLote(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os lotes</option>
              {lotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.nome}</option>
              ))}
            </select>
          </div>

          {/* Limpar filtros */}
          <div>
            <button
              onClick={() => {
                setBusca('')
                setFiltroTipo('')
                setFiltroLote('')
              }}
              className="w-full px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/30 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Manejos agrupada por mes */}
      {manejosFiltrados.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <span className="text-6xl block mb-4">💉</span>
          <h3 className="font-display text-2xl mb-2">NENHUM MANEJO ENCONTRADO</h3>
          <p className="text-muted-foreground mb-6">
            {manejos.length === 0
              ? 'Comece registrando seu primeiro manejo'
              : 'Tente ajustar os filtros de busca'}
          </p>
          {manejos.length === 0 && (
            <Link
              href="/dashboard/manejo/novo"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all"
            >
              <span>+</span>
              <span>REGISTRAR MANEJO</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {mesesOrdenados.map(mes => (
            <div key={mes}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-muted-foreground">
                  {formatMesAno(mes)}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {manejosPorMes[mes].length} manejo(s)
                </span>
              </div>
              <div className="space-y-3">
                {manejosPorMes[mes].map(manejo => (
                  <ManejoCard key={manejo.id} manejo={manejo} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  )
}
