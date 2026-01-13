'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAreasPastagemComStatus, AreaPastagemComStatus } from '@/lib/services/areas-pastagem.service'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import PiqueteCard from './PiqueteCard'
import RotacaoPiqueteModal from './RotacaoPiqueteModal'
import toast from 'react-hot-toast'

interface LoteComPiquete extends LoteWithStats {
  piqueteVinculado?: AreaPastagemComStatus | null
  diasNoLote?: number | null
}

export default function SecaoManejoPastagem() {
  const [piquetes, setPiquetes] = useState<AreaPastagemComStatus[]>([])
  const [lotes, setLotes] = useState<LoteComPiquete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [loteParaRotacao, setLoteParaRotacao] = useState<LoteComPiquete | null>(null)
  const [piqueteAtualParaRotacao, setPiqueteAtualParaRotacao] = useState<AreaPastagemComStatus | null>(null)

  // Filtro de status
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'lotado' | 'disponivel' | 'recuperacao' | 'vencido'>('todos')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [piquetesData, lotesData] = await Promise.all([
        getAreasPastagemComStatus(),
        getLotes()
      ])

      setPiquetes(piquetesData)

      // Calcular dias no lote para cada lote com piquete
      const lotesComDias: LoteComPiquete[] = lotesData.map(lote => {
        const piqueteVinculado = piquetesData.find(p =>
          p.loteVinculado?.id === lote.id ||
          p.id === lote.piquete_id
        ) || null

        let diasNoLote: number | null = null
        if (lote.data_entrada_piquete) {
          const dataEntrada = new Date(lote.data_entrada_piquete)
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          diasNoLote = Math.floor((hoje.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24))
        }

        return {
          ...lote,
          piqueteVinculado,
          diasNoLote
        }
      })

      setLotes(lotesComDias)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
      toast.error('Erro ao carregar dados de pastagem')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar piquetes por status
  const piqueetesFiltrados = piquetes.filter(p => {
    if (filtroStatus === 'todos') return true
    if (filtroStatus === 'vencido') {
      // Buscar lote vinculado e verificar se esta vencido
      const lote = lotes.find(l => l.piqueteVinculado?.id === p.id)
      if (!lote) return false
      return lote.diasNoLote != null &&
        lote.dias_permanencia_ideal != null &&
        lote.diasNoLote > lote.dias_permanencia_ideal
    }
    return p.statusCalculado === filtroStatus
  })

  // Estatisticas
  const stats = {
    total: piquetes.length,
    lotados: piquetes.filter(p => p.statusCalculado === 'lotado').length,
    disponiveis: piquetes.filter(p => p.statusCalculado === 'disponivel').length,
    recuperacao: piquetes.filter(p => p.statusCalculado === 'recuperacao').length,
    vencidos: lotes.filter(l =>
      l.diasNoLote != null &&
      l.dias_permanencia_ideal != null &&
      l.diasNoLote > l.dias_permanencia_ideal
    ).length
  }

  // Abrir modal de rotacao
  const handleRotacaoClick = (piquete: AreaPastagemComStatus) => {
    const lote = lotes.find(l => l.piqueteVinculado?.id === piquete.id)
    if (lote) {
      setLoteParaRotacao(lote)
      setPiqueteAtualParaRotacao(piquete)
      setModalOpen(true)
    }
  }

  // Piquetes disponiveis para rotacao
  const piquetesDisponiveis = piquetes.filter(p => p.statusCalculado === 'disponivel')

  if (loading) {
    return (
      <div className="card-leather p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted/30 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted/30 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted/30 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-leather p-6 text-center">
        <p className="text-error mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
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
          <h2 className="font-display text-2xl">MANEJO DE PASTAGEM</h2>
          <p className="text-muted-foreground text-sm">Gerencie a rotacao de piquetes do rebanho</p>
        </div>
        <Link
          href="/dashboard/mapa"
          className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all text-sm font-medium"
        >
          + Novo Piquete
        </Link>
      </div>

      {/* Alerta de piquetes vencidos */}
      {stats.vencidos > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">!</span>
          <div>
            <p className="font-medium text-warning">Atencao: {stats.vencidos} lote(s) com prazo de permanencia vencido</p>
            <p className="text-sm text-muted-foreground">
              Realize a rotacao de piquete para manter a saude do pasto
            </p>
          </div>
          <button
            onClick={() => setFiltroStatus('vencido')}
            className="ml-auto px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 text-sm"
          >
            Ver Vencidos
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={`card-leather p-4 text-center transition-all hover:scale-[1.02] ${
            filtroStatus === 'todos' ? 'ring-2 ring-primary' : ''
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">TOTAL</p>
          <p className="font-display text-2xl">{stats.total}</p>
        </button>
        <button
          onClick={() => setFiltroStatus('lotado')}
          className={`card-leather p-4 text-center transition-all hover:scale-[1.02] ${
            filtroStatus === 'lotado' ? 'ring-2 ring-primary' : ''
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">LOTADOS</p>
          <p className="font-display text-2xl text-primary">{stats.lotados}</p>
        </button>
        <button
          onClick={() => setFiltroStatus('disponivel')}
          className={`card-leather p-4 text-center transition-all hover:scale-[1.02] ${
            filtroStatus === 'disponivel' ? 'ring-2 ring-success' : ''
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">DISPONIVEIS</p>
          <p className="font-display text-2xl text-success">{stats.disponiveis}</p>
        </button>
        <button
          onClick={() => setFiltroStatus('recuperacao')}
          className={`card-leather p-4 text-center transition-all hover:scale-[1.02] ${
            filtroStatus === 'recuperacao' ? 'ring-2 ring-error' : ''
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">RECUPERACAO</p>
          <p className="font-display text-2xl text-error">{stats.recuperacao}</p>
        </button>
        <button
          onClick={() => setFiltroStatus('vencido')}
          className={`card-leather p-4 text-center transition-all hover:scale-[1.02] ${
            filtroStatus === 'vencido' ? 'ring-2 ring-warning' : ''
          }`}
        >
          <p className="text-xs text-muted-foreground mb-1">VENCIDOS</p>
          <p className="font-display text-2xl text-warning">{stats.vencidos}</p>
        </button>
      </div>

      {/* Grid de Piquetes */}
      {piquetes.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <span className="text-6xl block mb-4">🌾</span>
          <h3 className="font-display text-2xl mb-2">NENHUM PIQUETE CADASTRADO</h3>
          <p className="text-muted-foreground mb-6">
            Cadastre areas de pastagem no mapa para gerenciar a rotacao
          </p>
          <Link
            href="/dashboard/mapa"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            <span>+</span>
            <span>CADASTRAR PIQUETE</span>
          </Link>
        </div>
      ) : piqueetesFiltrados.length === 0 ? (
        <div className="card-leather p-8 text-center">
          <p className="text-muted-foreground">Nenhum piquete encontrado com este filtro</p>
          <button
            onClick={() => setFiltroStatus('todos')}
            className="mt-4 text-primary hover:underline"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {piqueetesFiltrados.map(piquete => {
            const lote = lotes.find(l => l.piqueteVinculado?.id === piquete.id)
            return (
              <PiqueteCard
                key={piquete.id}
                piquete={piquete}
                onRotacaoClick={handleRotacaoClick}
                diasNoLote={lote?.diasNoLote ?? null}
                diasIdeal={lote?.dias_permanencia_ideal ?? null}
              />
            )
          })}
        </div>
      )}

      {/* Lotes sem piquete (avulsos) */}
      {lotes.filter(l => !l.piquete_id && l.status === 'ativo').length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-xl mb-4 text-muted-foreground">LOTES EM PASTO AVULSO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lotes
              .filter(l => !l.piquete_id && l.status === 'ativo')
              .map(lote => (
                <div key={lote.id} className="card-leather p-4 border-l-4 border-l-muted">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{lote.nome}</h4>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted/30 text-muted-foreground">
                      Avulso
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {lote.total_animais} animais
                  </p>
                  <button
                    onClick={() => {
                      setLoteParaRotacao(lote)
                      setPiqueteAtualParaRotacao(null)
                      setModalOpen(true)
                    }}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-muted/30 text-foreground hover:bg-muted/50 transition-all"
                  >
                    Vincular a Piquete
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal de Rotacao */}
      {loteParaRotacao && (
        <RotacaoPiqueteModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setLoteParaRotacao(null)
            setPiqueteAtualParaRotacao(null)
          }}
          loteId={loteParaRotacao.id}
          loteNome={loteParaRotacao.nome}
          piqueteAtual={piqueteAtualParaRotacao}
          piquetesDisponiveis={piquetesDisponiveis}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
