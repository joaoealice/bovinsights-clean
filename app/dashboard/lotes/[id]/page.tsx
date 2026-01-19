'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getLoteById, deleteLote, LoteWithPiquete } from '@/lib/services/lotes.service'
import {
  TIPOS_PASTO,
  TipoPasto,
  getAreasPastagemComStatus,
  realizarRotacaoPiquete,
  AreaPastagemComStatus,
  STATUS_PIQUETE_INFO,
  DIAS_RECUPERACAO_PASTO
} from '@/lib/services/areas-pastagem.service'
import { getDespesasPorLote, getCustoCabecaMes, Despesa, getResumoFinanceiroLote, ResumoFinanceiroLote } from '@/lib/services/financeiro.service'
import { getMarketPrices } from '@/lib/services/mercado.service'
import { getManejosPorLote, Manejo, getTipoManejoInfo } from '@/lib/services/manejo.service'
import { getPesagensByLote, PesagemWithDetails } from '@/lib/services/pesagens.service'
import LoteKPIs from '@/components/lotes/LoteKPIs'
import GraficoEvolucaoPeso from '@/components/lotes/GraficoEvolucaoPeso'
import ConferenciaAlimentar from '@/components/nutricao/ConferenciaAlimentar'
import toast from 'react-hot-toast'

interface CustoCabecaMes {
  mes: string
  custoTotal: number
  custoCabeca: number
}

interface PesagemResumo {
  data: string
  qtdAnimais: number
  pesoMedio: number
  pesoTotal: number
}

export default function LoteDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [lote, setLote] = useState<LoteWithPiquete | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [manejos, setManejos] = useState<Manejo[]>([])
  const [pesagensResumo, setPesagensResumo] = useState<PesagemResumo[]>([])
  const [custosMes, setCustosMes] = useState<CustoCabecaMes[]>([])
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiroLote | null>(null)
  const [precoArroba, setPrecoArroba] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Estados para modal de troca de piquete
  const [showTrocaPiquete, setShowTrocaPiquete] = useState(false)
  const [piquetesDisponiveis, setPiquetesDisponiveis] = useState<AreaPastagemComStatus[]>([])
  const [loadingPiquetes, setLoadingPiquetes] = useState(false)
  const [piqueteSelecionado, setPiqueteSelecionado] = useState<string>('')
  const [salvandoTroca, setSalvandoTroca] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)

      const prices = await getMarketPrices()
      const bahiaSul = prices.find(p =>
        p.region?.toLowerCase().includes('ba sul') ||
        p.region?.toLowerCase().includes('bahia sul')
      )
      const preco = bahiaSul?.price_cash || prices[0]?.price_cash || 300
      setPrecoArroba(preco)

      const loteData = await getLoteById(id)
      setLote(loteData)

      if (loteData) {
        const [despesasData, custosData, manejosData, pesagensData, resumoData] = await Promise.all([
          getDespesasPorLote(id),
          getCustoCabecaMes(id, loteData.total_animais),
          getManejosPorLote(id),
          getPesagensByLote(id),
          getResumoFinanceiroLote(id, preco)
        ])
        setDespesas(despesasData)
        setCustosMes(custosData)
        setManejos(manejosData)
        setResumoFinanceiro(resumoData)

        const pesagensPorData = pesagensData.reduce((acc: Record<string, PesagemWithDetails[]>, p) => {
          if (!acc[p.data_pesagem]) {
            acc[p.data_pesagem] = []
          }
          acc[p.data_pesagem].push(p)
          return acc
        }, {})

        const resumoTabela: PesagemResumo[] = Object.entries(pesagensPorData)
          .map(([data, pesagensDodia]) => ({
            data,
            qtdAnimais: pesagensDodia.length,
            pesoTotal: pesagensDodia.reduce((sum, p) => sum + p.peso, 0),
            pesoMedio: pesagensDodia.reduce((sum, p) => sum + p.peso, 0) / pesagensDodia.length
          }))

        const historicoLote = (loteData as any).historico_pesagens as any[] || []
        const resumoHistorico: PesagemResumo[] = historicoLote.map((h: any) => ({
          data: h.data,
          qtdAnimais: h.quantidade_animais,
          pesoTotal: h.peso_total,
          pesoMedio: h.peso_medio
        }))

        const todasPesagens = [...resumoTabela]
        resumoHistorico.forEach(ph => {
          if (!todasPesagens.find(pt => pt.data === ph.data)) {
            todasPesagens.push(ph)
          }
        })

        const resumo = todasPesagens.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        setPesagensResumo(resumo)
      }
    } catch (error: any) {
      toast.error('Erro ao carregar lote')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este lote?')) return

    try {
      setDeleting(true)
      await deleteLote(id)
      toast.success('Lote excluido com sucesso!')
      router.push('/dashboard/lotes')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir lote')
      setDeleting(false)
    }
  }

  const handleAbrirTrocaPiquete = async () => {
    setShowTrocaPiquete(true)
    setLoadingPiquetes(true)
    setPiqueteSelecionado('')

    try {
      const piquetes = await getAreasPastagemComStatus()
      setPiquetesDisponiveis(piquetes)
    } catch (error) {
      console.error('Erro ao carregar piquetes:', error)
      toast.error('Erro ao carregar piquetes')
    } finally {
      setLoadingPiquetes(false)
    }
  }

  const handleTrocarPiquete = async () => {
    if (!lote) return

    setSalvandoTroca(true)

    try {
      const piqueteAntigoId = lote.piquete?.id || null
      const piqueteNovoId = piqueteSelecionado === 'avulso' ? null : piqueteSelecionado || null

      await realizarRotacaoPiquete(id, piqueteAntigoId, piqueteNovoId)

      toast.success('Rotacao realizada com sucesso!')
      setShowTrocaPiquete(false)
      await loadData()
    } catch (error: any) {
      console.error('Erro ao trocar piquete:', error)
      toast.error(error.message || 'Erro ao realizar rotacao')
    } finally {
      setSalvandoTroca(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!lote) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground mb-4">Lote nao encontrado</p>
        <Link href="/dashboard/lotes">
          <button className="btn-primary">Voltar para Lotes</button>
        </Link>
      </div>
    )
  }

  const isLoteVendido = lote.status === 'vendido'

  const hoje = new Date()
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const custoMesAtual = custosMes.find(c => c.mes === mesAtualKey)

  const dataInicioLote = lote.data_entrada || lote.created_at
  const diasNoLote = Math.floor(
    (hoje.getTime() - new Date(dataInicioLote).getTime()) / (1000 * 60 * 60 * 24)
  )

  const getFaseCiclo = (dias: number) => {
    if (dias <= 45) return 'Inicio'
    if (dias <= 60) return '45-60d'
    if (dias <= 90) return '60-90d'
    if (dias <= 120) return '90-120d'
    return '+120d'
  }
  const faseCiclo = getFaseCiclo(diasNoLote)

  const kpis = [
    { label: 'Animais', value: lote.total_animais },
    { label: 'Peso Medio', value: `${lote.peso_medio.toFixed(0)} kg`, subValue: `${(lote.peso_medio / 30).toFixed(1)} @` },
    { label: 'Dias no Lote', value: diasNoLote, subValue: faseCiclo },
    { label: 'Custo/Cab (Mes)', value: custoMesAtual && lote.total_animais > 0 ? formatCurrency(custoMesAtual.custoCabeca) : '-' },
  ]

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)

  const gmdReal = (() => {
    const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
      ? lote.peso_total_entrada / lote.quantidade_total
      : 0

    if (pesagensResumo.length >= 1 && pesoMedioInicial > 0) {
      const ultimaPesagem = pesagensResumo[0]
      const ganhoTotal = ultimaPesagem.pesoMedio - pesoMedioInicial
      if (diasNoLote > 0) {
        return ganhoTotal / diasNoLote
      }
    } else if (pesagensResumo.length >= 2) {
      const primeiraPesagem = pesagensResumo[pesagensResumo.length - 1]
      const ultimaPesagem = pesagensResumo[0]
      const ganhoTotal = ultimaPesagem.pesoMedio - primeiraPesagem.pesoMedio
      const diasEntrePesagens = Math.floor(
        (new Date(ultimaPesagem.data).getTime() - new Date(primeiraPesagem.data).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diasEntrePesagens > 0) {
        return ganhoTotal / diasEntrePesagens
      }
    }
    return null
  })()

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/lotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <span>←</span> Voltar
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{lote.nome}</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                lote.status === 'ativo' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {lote.status.toUpperCase()}
              </span>
            </div>
            {lote.localizacao && (
              <p className="text-sm text-muted-foreground">{lote.localizacao}</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isLoteVendido && (
              <Link href={`/dashboard/lotes/${id}/editar`}>
                <button className="btn-secondary">Editar</button>
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-danger"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* Banner Lote Vendido */}
      {isLoteVendido && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-sm font-medium text-warning">Lote vendido - modo somente leitura</p>
        </div>
      )}

      {/* KPIs */}
      <LoteKPIs kpis={kpis} />

      {/* Dados de Entrada */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Dados de Entrada</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Data Entrada</p>
            <p className="text-lg font-bold tabular-nums">
              {new Date(lote.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Sistema</p>
            <p className="text-lg font-bold">
              {lote.tipo_lote === 'confinamento' ? 'Conf.' : lote.tipo_lote || '-'}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Animais</p>
            <p className="text-lg font-bold tabular-nums">{lote.quantidade_total || lote.total_animais}</p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Peso Med. Inicial</p>
            <p className="text-lg font-bold tabular-nums">
              {lote.peso_total_entrada && lote.quantidade_total
                ? `${(lote.peso_total_entrada / lote.quantidade_total).toFixed(0)} kg`
                : '-'}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Peso Total</p>
            <p className="text-lg font-bold tabular-nums">
              {lote.peso_total_entrada ? `${lote.peso_total_entrada.toLocaleString('pt-BR')} kg` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">GMD</p>
            <p className="text-xl font-bold tabular-nums">
              {(() => {
                const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                  ? lote.peso_total_entrada / lote.quantidade_total
                  : 0

                if (pesagensResumo.length >= 1 && pesoMedioInicial > 0) {
                  const ultimaPesagem = pesagensResumo[0]
                  const ganhoTotal = ultimaPesagem.pesoMedio - pesoMedioInicial
                  if (diasNoLote > 0) {
                    return `${(ganhoTotal / diasNoLote).toFixed(2)} kg`
                  }
                }
                return '-'
              })()}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Peso Med. Atual</p>
            <p className="text-xl font-bold tabular-nums">
              {lote.peso_medio > 0 ? `${lote.peso_medio.toFixed(0)} kg` : '-'}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Ganho Total</p>
            <p className="text-xl font-bold tabular-nums">
              {(() => {
                const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                  ? lote.peso_total_entrada / lote.quantidade_total
                  : 0
                if (pesoMedioInicial > 0 && lote.peso_medio > 0) {
                  const ganho = lote.peso_medio - pesoMedioInicial
                  return `+${ganho.toFixed(0)} kg`
                }
                return '-'
              })()}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Peso Total</p>
            <p className="text-xl font-bold tabular-nums">
              {lote.peso_medio > 0 && lote.total_animais > 0
                ? `${(lote.peso_medio * lote.total_animais).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
                : '-'}
            </p>
          </div>
          <div className="text-center bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Animais</p>
            <p className="text-xl font-bold tabular-nums">{lote.total_animais}</p>
          </div>
          <div className="text-center bg-primary/10 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Dias</p>
            <p className="text-xl font-bold tabular-nums text-primary">{diasNoLote}</p>
          </div>
        </div>
      </div>

      {/* Conferencia Alimentar */}
      <ConferenciaAlimentar
        loteId={id}
        pesoMedio={lote.peso_medio}
        quantidadeAnimais={lote.total_animais}
        gmdReal={gmdReal}
        tipoLote={lote.tipo_lote || undefined}
        isReadOnly={isLoteVendido}
      />

      {/* Resumo Financeiro */}
      {resumoFinanceiro && (
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
            <span className="text-xs text-muted-foreground">Base: {formatCurrency(precoArroba)}/@</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Investimento</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(resumoFinanceiro.investimento_inicial)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Custeios</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(resumoFinanceiro.custeios)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
              <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(resumoFinanceiro.total_investido)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Valor Estoque</p>
              <p className="text-lg font-bold tabular-nums text-primary">{formatCurrency(resumoFinanceiro.valor_estoque_atual)}</p>
            </div>
          </div>

          {/* Margem */}
          <div className="bg-muted/20 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Margem</p>
                <p className={`text-2xl font-bold ${resumoFinanceiro.margem_percentual >= 0 ? 'text-success' : 'text-error'}`}>
                  {resumoFinanceiro.margem_percentual > 0 ? '+' : ''}{resumoFinanceiro.margem_percentual.toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuizo</p>
                <p className={`text-xl font-bold ${resumoFinanceiro.lucro_ou_prejuizo >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(resumoFinanceiro.lucro_ou_prejuizo)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">R$/Cabeca</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(resumoFinanceiro.custo_por_cabeca)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">R$/Arroba</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(resumoFinanceiro.custo_por_arroba)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historico de Pesagens */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Historico de Pesagens</h2>
          {!isLoteVendido && (
            <Link href={`/dashboard/pesagens/lote?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="btn-primary">Nova Pesagem</button>
            </Link>
          )}
        </div>

        {pesagensResumo.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhuma pesagem registrada</p>
            {!isLoteVendido && (
              <Link href={`/dashboard/pesagens/lote?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="btn-primary">Registrar Primeira Pesagem</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pesagensResumo.length >= 1 && (
              <div className="bg-muted/20 rounded-lg p-4">
                <GraficoEvolucaoPeso
                  pesagens={pesagensResumo}
                  pesoMedioInicial={
                    lote.peso_total_entrada && lote.quantidade_total
                      ? lote.peso_total_entrada / lote.quantidade_total
                      : undefined
                  }
                  dataEntrada={lote.data_entrada}
                />
              </div>
            )}

            {/* Tabela de Pesagens */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Data</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Qtde</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Peso Med.</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">GMD</th>
                  </tr>
                </thead>
                <tbody>
                  {pesagensResumo.slice(0, 5).map((pesagem, index) => {
                    let gmd = 0
                    if (index < pesagensResumo.length - 1) {
                      const pesagemAnterior = pesagensResumo[index + 1]
                      const ganho = pesagem.pesoMedio - pesagemAnterior.pesoMedio
                      const dias = Math.max(1, Math.floor(
                        (new Date(pesagem.data).getTime() - new Date(pesagemAnterior.data).getTime()) / (1000 * 60 * 60 * 24)
                      ))
                      gmd = ganho / dias
                    }

                    return (
                      <tr key={pesagem.data} className="border-b border-border/50">
                        <td className="py-3 px-4 text-sm tabular-nums">
                          {new Date(pesagem.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="text-center py-3 px-4 text-sm tabular-nums">{pesagem.qtdAnimais}</td>
                        <td className="text-center py-3 px-4 text-sm font-medium tabular-nums">{pesagem.pesoMedio.toFixed(0)} kg</td>
                        <td className="text-center py-3 px-4">
                          {gmd !== 0 ? (
                            <span className={`text-sm font-medium ${gmd >= 1 ? 'text-success' : gmd >= 0.5 ? 'text-warning' : 'text-error'}`}>
                              {gmd.toFixed(2)} kg
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Historico de Despesas */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Historico de Despesas</h2>
          {!isLoteVendido && (
            <Link href={`/dashboard/financeiro/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="btn-primary">Nova Despesa</button>
            </Link>
          )}
        </div>

        {despesas.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhuma despesa registrada</p>
            {!isLoteVendido && (
              <Link href={`/dashboard/financeiro/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="btn-primary">Registrar Primeira Despesa</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo de Despesas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-error/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-lg font-bold tabular-nums text-error">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Custo/Cab</p>
                <p className="text-lg font-bold tabular-nums">
                  {lote.total_animais > 0 ? formatCurrency(totalDespesas / lote.total_animais) : '-'}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Registros</p>
                <p className="text-lg font-bold tabular-nums">{despesas.length}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Custo/Mes</p>
                <p className="text-lg font-bold tabular-nums">
                  {custoMesAtual ? formatCurrency(custoMesAtual.custoCabeca) : '-'}
                </p>
              </div>
            </div>

            {/* Lista de Despesas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Descricao</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.slice(0, 5).map((despesa) => (
                    <tr key={despesa.id} className="border-b border-border/50">
                      <td className="py-3 px-4 text-sm tabular-nums">
                        {new Date(despesa.data_despesa + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-sm">{despesa.descricao}</td>
                      <td className="text-right py-3 px-4 text-sm font-medium tabular-nums text-error">
                        {formatCurrency(despesa.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Historico de Manejos */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Historico de Manejos</h2>
          {!isLoteVendido && (
            <Link href={`/dashboard/manejo/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="btn-primary">Novo Manejo</button>
            </Link>
          )}
        </div>

        {manejos.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground mb-4">Nenhum manejo registrado</p>
            {!isLoteVendido && (
              <Link href={`/dashboard/manejo/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="btn-primary">Registrar Primeiro Manejo</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Descricao</th>
                </tr>
              </thead>
              <tbody>
                {manejos.slice(0, 5).map((manejo) => {
                  const tipoInfo = getTipoManejoInfo(manejo.tipo_manejo)
                  return (
                    <tr key={manejo.id} className="border-b border-border/50">
                      <td className="py-3 px-4 text-sm tabular-nums">
                        {new Date(manejo.data_manejo + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted">
                          {tipoInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{manejo.descricao}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Troca de Piquete */}
      {showTrocaPiquete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rotacao de Piquete</h3>
              <button
                onClick={() => setShowTrocaPiquete(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                X
              </button>
            </div>

            <div className="p-4">
              {loadingPiquetes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setPiqueteSelecionado('avulso')}
                    className={`w-full p-3 rounded-lg border text-left ${
                      piqueteSelecionado === 'avulso'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium">Pasto Avulso</p>
                    <p className="text-sm text-muted-foreground">Sem piquete cadastrado</p>
                  </button>

                  {piquetesDisponiveis.map((piquete) => {
                    const statusInfo = STATUS_PIQUETE_INFO[piquete.statusCalculado]
                    const isPiqueteAtual = lote?.piquete?.id === piquete.id

                    return (
                      <button
                        key={piquete.id}
                        onClick={() => !isPiqueteAtual && setPiqueteSelecionado(piquete.id)}
                        disabled={isPiqueteAtual}
                        className={`w-full p-3 rounded-lg border text-left ${
                          isPiqueteAtual
                            ? 'border-muted bg-muted/20 opacity-50'
                            : piqueteSelecionado === piquete.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{piquete.nome}</p>
                            <p className="text-sm text-muted-foreground">{piquete.area_hectares.toFixed(2)} ha</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${statusInfo.bgCor} ${statusInfo.cor}`}>
                            {isPiqueteAtual ? 'Atual' : statusInfo.label}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <button
                onClick={() => setShowTrocaPiquete(false)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleTrocarPiquete}
                disabled={!piqueteSelecionado || salvandoTroca}
                className="flex-1 btn-primary"
              >
                {salvandoTroca ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
