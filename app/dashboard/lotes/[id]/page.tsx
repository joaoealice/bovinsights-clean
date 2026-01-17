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

      // Buscar preço atual da arroba (BA Sul como referência)
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

        // Agrupar pesagens por data para criar resumo
        const pesagensPorData = pesagensData.reduce((acc: Record<string, PesagemWithDetails[]>, p) => {
          if (!acc[p.data_pesagem]) {
            acc[p.data_pesagem] = []
          }
          acc[p.data_pesagem].push(p)
          return acc
        }, {})

        // Combinar pesagens da tabela com historico do lote
        const resumoTabela: PesagemResumo[] = Object.entries(pesagensPorData)
          .map(([data, pesagensDodia]) => ({
            data,
            qtdAnimais: pesagensDodia.length,
            pesoTotal: pesagensDodia.reduce((sum, p) => sum + p.peso, 0),
            pesoMedio: pesagensDodia.reduce((sum, p) => sum + p.peso, 0) / pesagensDodia.length
          }))

        // Adicionar pesagens do historico do lote (pesagens agregadas sem animais)
        const historicoLote = (loteData as any).historico_pesagens as any[] || []
        const resumoHistorico: PesagemResumo[] = historicoLote.map((h: any) => ({
          data: h.data,
          qtdAnimais: h.quantidade_animais,
          pesoTotal: h.peso_total,
          pesoMedio: h.peso_medio
        }))

        // Combinar e remover duplicatas (priorizar tabela se mesma data)
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
    if (!confirm('Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)
      await deleteLote(id)
      toast.success('Lote excluído com sucesso!')
      router.push('/dashboard/lotes')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir lote')
      setDeleting(false)
    }
  }

  // Abrir modal de troca de piquete
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

  // Realizar troca de piquete
  const handleTrocarPiquete = async () => {
    if (!lote) return

    setSalvandoTroca(true)

    try {
      const piqueteAntigoId = lote.piquete?.id || null
      const piqueteNovoId = piqueteSelecionado === 'avulso' ? null : piqueteSelecionado || null

      await realizarRotacaoPiquete(id, piqueteAntigoId, piqueteNovoId)

      toast.success('Rotação realizada com sucesso!')
      setShowTrocaPiquete(false)

      // Recarregar dados do lote
      await loadData()
    } catch (error: any) {
      console.error('Erro ao trocar piquete:', error)
      toast.error(error.message || 'Erro ao realizar rotação')
    } finally {
      setSalvandoTroca(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatMesLabel = (mesKey: string) => {
    const [ano, mes] = mesKey.split('-')
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${meses[parseInt(mes) - 1]}/${ano}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lote) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <h3 className="font-display text-2xl mb-2">Lote não encontrado</h3>
        <Link href="/dashboard/lotes">
          <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 mt-4 text-sm">
            Voltar para Lotes
          </button>
        </Link>
      </div>
    )
  }

  // Verificar se o lote está vendido (somente leitura)
  const isLoteVendido = lote.status === 'vendido'

  // Calcular custo/cabeça do mês atual
  const hoje = new Date()
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  const custoMesAtual = custosMes.find(c => c.mes === mesAtualKey)

  // Calcular dias de existencia do lote
  const dataInicioLote = lote.data_entrada || lote.created_at
  const diasNoLote = Math.floor(
    (hoje.getTime() - new Date(dataInicioLote).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Determinar fase do ciclo baseado nos dias
  const getFaseCiclo = (dias: number) => {
    if (dias <= 45) return { fase: 'Inicio' }
    if (dias <= 60) return { fase: 'Ciclo 45-60' }
    if (dias <= 90) return { fase: 'Ciclo 60-90' }
    if (dias <= 120) return { fase: 'Ciclo 90-120' }
    return { fase: 'Acima 120' }
  }
  const faseCiclo = getFaseCiclo(diasNoLote)

  const kpis = [
    { label: 'Animais (cab)', value: lote.total_animais, icon: '🐮' },
    {
      label: 'Peso Médio (kg)',
      value: lote.peso_medio.toFixed(1),
      subValue: `${(lote.peso_medio / 30).toFixed(1)} @`,
      icon: '⚖️',
    },
    { label: 'Dias no Lote', value: diasNoLote, subValue: faseCiclo.fase, icon: '📅' },
    {
      label: 'Custo/Cabeça (Mês) (R$)',
      value:
        custoMesAtual && lote.total_animais > 0
          ? custoMesAtual.custoCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : '-',
      icon: '💰',
    },
  ]

  // Total de despesas do lote
  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0)

  // Calcular GMD real para usar no componente de Conferência Alimentar
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/lotes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para lotes</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-4xl md:text-5xl">{lote.nome}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-mono font-bold border ${
                  lote.status === 'ativo'
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-muted/30 bg-muted/20 text-muted-foreground'
                }`}
              >
                {lote.status.toUpperCase()}
              </span>
            </div>
            {lote.localizacao && (
              <p className="text-muted-foreground">{lote.localizacao}</p>
            )}
          </div>

          <div className="flex gap-2">
            {!isLoteVendido && (
              <Link href={`/dashboard/lotes/${id}/editar`}>
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm">
                  Editar
                </button>
              </Link>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 text-sm"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Lote Vendido */}
      {isLoteVendido && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-display text-xl text-foreground">LOTE VENDIDO</h3>
          <p className="text-muted-foreground mb-4">
            Este lote foi vendido e está em modo de somente leitura. Você pode
            visualizar os dados mas não pode editar.
          </p>
          <Link href="/dashboard/vendas">
            <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm">
              Ver Vendas
            </button>
          </Link>
        </div>
      )}

      {/* Card de Dados Fixos Iniciais */}
      <div className="border rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">DADOS DE ENTRADA</h2>
          <span className="text-xs text-muted-foreground">Referência</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Data de Criação */}
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-2">Data Entrada</p>
            <p className="font-mono font-bold text-lg">
              {new Date(lote.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
          </div>

          {/* Tipo do Lote */}
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-2">Sistema</p>
            <p className="font-mono font-bold text-lg">
              {lote.tipo_lote === 'confinamento' ? 'CONF.' : lote.tipo_lote || '-'}
            </p>
          </div>

          {/* Quantidade Inicial */}
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-2">Animais (cab)</p>
            <p className="font-mono font-bold text-xl">
              {lote.quantidade_total || lote.total_animais}
            </p>
          </div>

          {/* Peso Médio Inicial */}
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-2">Peso Médio (kg)</p>
            <p className="font-mono font-bold text-xl">
              {lote.peso_total_entrada && lote.quantidade_total
                ? (lote.peso_total_entrada / lote.quantidade_total).toFixed(1)
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_total_entrada && lote.quantidade_total
                ? `${(lote.peso_total_entrada / lote.quantidade_total / 30).toFixed(2)} @`
                : ''}
            </p>
          </div>

          {/* Peso Total Inicial */}
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase mb-2">Peso Total (kg)</p>
            <p className="font-mono font-bold text-xl">
              {lote.peso_total_entrada
                ? lote.peso_total_entrada.toLocaleString('pt-BR')
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_total_entrada
                ? `${(lote.peso_total_entrada / 30).toFixed(1)} @`
                : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Troca de Piquete */}
      {showTrocaPiquete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl">
                  Rotação de Piquete
                </h3>
                <button
                  onClick={() => setShowTrocaPiquete(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-muted-foreground mt-2">
                Selecione o novo piquete para o lote <strong>{lote?.nome}</strong>
              </p>
            </div>

            <div className="p-6">
              {loadingPiquetes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-muted-foreground">Carregando piquetes...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Opção Pasto Avulso */}
                  <button
                    onClick={() => setPiqueteSelecionado('avulso')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      piqueteSelecionado === 'avulso'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">Pasto Avulso</p>
                      <p className="text-sm text-muted-foreground">
                        Sem piquete cadastrado (rotação manual)
                      </p>
                    </div>
                  </button>

                  {/* Lista de Piquetes */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase">
                      Piquetes Cadastrados
                    </p>
                    {piquetesDisponiveis.map((piquete) => {
                      const statusInfo = STATUS_PIQUETE_INFO[piquete.statusCalculado]
                      const isPiqueteAtual = lote?.piquete?.id === piquete.id
                      const isDisponivel = piquete.statusCalculado === 'disponivel'
                      const isRecuperacao = piquete.statusCalculado === 'recuperacao'

                      return (
                        <button
                          key={piquete.id}
                          onClick={() => !isPiqueteAtual && setPiqueteSelecionado(piquete.id)}
                          disabled={isPiqueteAtual}
                          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                            isPiqueteAtual
                              ? 'border-muted bg-muted/20 cursor-not-allowed opacity-60'
                              : piqueteSelecionado === piquete.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{piquete.nome}</p>
                                {isPiqueteAtual && (
                                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    Atual
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {piquete.area_hectares.toFixed(2)} ha
                                {piquete.tipo_pasto && TIPOS_PASTO[piquete.tipo_pasto as TipoPasto] &&
                                  ` • ${TIPOS_PASTO[piquete.tipo_pasto as TipoPasto].nome}`
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgCor} ${statusInfo.cor}`}>
                                {statusInfo.label}
                              </span>
                              {isRecuperacao && piquete.diasParaDisponivel && (
                                <p className="text-xs text-error mt-1">
                                  Disponível em {piquete.diasParaDisponivel} dias
                                </p>
                              )}
                              {piquete.loteVinculado && !isPiqueteAtual && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Lote: {piquete.loteVinculado.nome}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Info adicional do piquete */}
                          {piquete.ms_total_kg && (
                            <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">MS: </span>
                                <span className="font-mono">{(piquete.ms_total_kg / 1000).toFixed(1)}t</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Entrada: </span>
                                <span className="font-mono">{piquete.altura_entrada_cm || '-'}cm</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Saída: </span>
                                <span className="font-mono">{piquete.altura_saida_cm || '-'}cm</span>
                              </div>
                            </div>
                          )}
                        </button>
                      )
                    })}

                    {piquetesDisponiveis.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Nenhum piquete cadastrado</p>
                        <Link href="/dashboard/suporte-forrageiro">
                          <button className="mt-2 text-primary hover:underline">
                            Cadastrar piquete →
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Aviso sobre recuperação */}
                  <div className="bg-muted/20 rounded-lg p-4 border border-border mt-4">
                    <p className="text-sm text-muted-foreground">
                      O piquete atual será marcado como "Em Recuperação" por {DIAS_RECUPERACAO_PASTO} dias após a saída.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setShowTrocaPiquete(false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleTrocarPiquete}
                disabled={!piqueteSelecionado || salvandoTroca}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
              >
                {salvandoTroca ? 'Salvando...' : 'Confirmar Rotação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card de MANEJO DE PASTAGEM - Só aparece se lote tem piquete vinculado ou é tipo pastagem */}
      {(lote.piquete || lote.tipo_lote === 'pasto' || lote.tipo_lote === 'semiconfinamento') && (
        <div className="border rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">PASTAGEM</h2>
            {(() => {
              // Calcular status da permanência
              if (!lote.data_entrada_piquete || !lote.dias_permanencia_ideal) {
                return (
                  <span className="text-xs text-muted-foreground">
                    Sem dados
                  </span>
                )
              }

              const dataEntrada = new Date(lote.data_entrada_piquete)
              const dataSaidaRecomendada = new Date(dataEntrada)
              dataSaidaRecomendada.setDate(dataSaidaRecomendada.getDate() + lote.dias_permanencia_ideal)

              const hoje = new Date()
              hoje.setHours(0, 0, 0, 0)

              const diasRestantes = Math.ceil((dataSaidaRecomendada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

              if (diasRestantes < 0) {
                return (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-medium">
                    Vencido há {Math.abs(diasRestantes)} dias
                  </span>
                )
              } else if (diasRestantes <= 2) {
                return (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                    Vence em {diasRestantes} dias
                  </span>
                )
              } else {
                return (
                  <span className="text-xs text-muted-foreground">
                    {diasRestantes} dias restantes
                  </span>
                )
              }
            })()}
          </div>

          {lote.piquete ? (
            <>
              {/* Informações do Piquete */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                {/* Nome do Piquete */}
                <div className="bg-card border rounded-lg p-3 text-center col-span-2">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Piquete Atual</p>
                  <p className="font-mono font-bold text-lg">{lote.piquete.nome}</p>
                  {lote.piquete.tipo_pasto && TIPOS_PASTO[lote.piquete.tipo_pasto as TipoPasto] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {TIPOS_PASTO[lote.piquete.tipo_pasto as TipoPasto].nome}
                    </p>
                  )}
                </div>

                {/* Área */}
                <div className="bg-card border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Área (ha)</p>
                  <p className="font-mono font-bold text-lg">{lote.piquete.area_hectares.toFixed(2)}</p>
                </div>

                {/* MS Disponível */}
                <div className="bg-card border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-2">MS (ton)</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.ms_total_kg ? (lote.piquete.ms_total_kg / 1000).toFixed(1) : '-'}
                  </p>
                </div>

                {/* Altura Entrada */}
                <div className="bg-card border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Alt. Entrada (cm)</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.altura_entrada_cm || '-'}
                  </p>
                </div>

                {/* Altura Saída */}
                <div className="bg-card border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Alt. Saída (cm)</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.altura_saida_cm || '-'}
                  </p>
                </div>
              </div>

              {/* Card de Permanência */}
              {lote.data_entrada_piquete && lote.dias_permanencia_ideal && (
                (() => {
                  const dataEntrada = new Date(lote.data_entrada_piquete)
                  const dataSaidaRecomendada = new Date(dataEntrada)
                  dataSaidaRecomendada.setDate(dataSaidaRecomendada.getDate() + lote.dias_permanencia_ideal)

                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)

                  const diasNoPiquete = Math.floor((hoje.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24))
                  const diasRestantes = Math.ceil((dataSaidaRecomendada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                  const percentualUsado = Math.min((diasNoPiquete / lote.dias_permanencia_ideal) * 100, 100)

                  const isVencido = diasRestantes < 0
                  const isAlerta = diasRestantes <= 2 && diasRestantes >= 0

                  return (
                    <div className="rounded-xl p-6 border bg-card">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Data de Entrada */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Entrada no Piquete</p>
                          <p className="font-display text-2xl">
                            {dataEntrada.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            há {diasNoPiquete} dias
                          </p>
                        </div>

                        {/* Dias Ideais */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Permanência Ideal</p>
                          <p className="font-display text-2xl">
                            {lote.dias_permanencia_ideal} dias
                          </p>
                        </div>

                        {/* Data de Saída Recomendada */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Saída Recomendada</p>
                          <p className={`font-display text-2xl ${
                            isVencido ? 'text-primary' : isAlerta ? 'text-primary' : ''
                          }`}>
                            {dataSaidaRecomendada.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </p>
                        </div>

                        {/* Dias Restantes */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">
                            {isVencido ? 'Dias de Atraso' : 'Dias Restantes'}
                          </p>
                          <p className={`font-display text-4xl ${
                            isVencido ? 'text-primary' : isAlerta ? 'text-primary' : ''
                          }`}>
                            {isVencido ? Math.abs(diasRestantes) : diasRestantes}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-6 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Entrada</span>
                          <span>Alerta (-2 dias)</span>
                          <span>Saída Ideal</span>
                        </div>
                        <div className="h-4 bg-muted/30 rounded-full overflow-hidden relative">
                          <div
                            className="h-full transition-all bg-primary"
                            style={{ width: `${percentualUsado}%` }}
                          />
                          {/* Marcador de alerta (2 dias antes) */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-primary/50"
                            style={{ left: `${((lote.dias_permanencia_ideal - 2) / lote.dias_permanencia_ideal) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {percentualUsado.toFixed(0)}% do tempo ideal utilizado
                        </p>
                      </div>

                      {/* Alertas */}
                      {isVencido && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary">
                          <p className="text-sm text-primary font-semibold">
                            ATENÇÃO: Tempo de permanência excedido! Faça a rotação do lote para evitar degradação do pasto.
                          </p>
                        </div>
                      )}
                      {isAlerta && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary">
                          <p className="text-sm text-primary font-semibold">
                            Prepare a rotação! Data recomendada de saída se aproxima.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}

              {/* Sem dados de permanência */}
              {(!lote.data_entrada_piquete || !lote.dias_permanencia_ideal) && (
                <div className="bg-muted/20 rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground">
                    Dados de permanência não configurados. Edite o lote para definir a data de entrada e dias ideais.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-muted/20 rounded-lg p-6 border border-border text-center">
              <p className="text-muted-foreground mb-2">Nenhum piquete vinculado a este lote</p>
              <p className="text-sm text-muted-foreground">
                Este lote é do tipo {lote.tipo_lote === 'pasto' ? 'Pasto' : 'Semi Confinamento'} mas não tem piquete cadastrado.
              </p>
              {!isLoteVendido && (
                <Link href={`/dashboard/lotes/${id}/editar`}>
                  <button className="mt-4 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm mx-auto">
                    Vincular Piquete
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card de PERFORMANCE */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">PERFORMANCE</h2>
          <span className="text-xs text-muted-foreground">
            Indicadores Atuais
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* GMD - Ganho Médio Diário */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">GMD (kg/dia)</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {(() => {
                // Calcular GMD usando peso de entrada do lote quando disponivel
                const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                  ? lote.peso_total_entrada / lote.quantidade_total
                  : 0

                // Se temos peso de entrada e pesagens, calcular desde a entrada
                if (pesagensResumo.length >= 1 && pesoMedioInicial > 0) {
                  const ultimaPesagem = pesagensResumo[0]
                  const ganhoTotal = ultimaPesagem.pesoMedio - pesoMedioInicial
                  if (diasNoLote > 0) {
                    return (ganhoTotal / diasNoLote).toFixed(2)
                  }
                }

                // Fallback: calcular entre pesagens
                if (pesagensResumo.length >= 2) {
                  const primeiraPesagem = pesagensResumo[pesagensResumo.length - 1]
                  const ultimaPesagem = pesagensResumo[0]
                  const ganhoTotal = ultimaPesagem.pesoMedio - primeiraPesagem.pesoMedio
                  const diasEntrePesagens = Math.floor(
                    (new Date(ultimaPesagem.data).getTime() - new Date(primeiraPesagem.data).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  if (diasEntrePesagens > 0) {
                    return (ganhoTotal / diasEntrePesagens).toFixed(2)
                  }
                }
                return '-'
              })()}
            </p>
          </div>

          {/* Peso Médio Atual */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Médio Atual (kg)</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.peso_medio > 0 ? lote.peso_medio.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_medio > 0 ? `${(lote.peso_medio / 30).toFixed(2)} @` : ''}
            </p>
          </div>

          {/* Ganho Total de Peso */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ganho Total (kg)</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {(() => {
                const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                  ? lote.peso_total_entrada / lote.quantidade_total
                  : 0
                if (pesoMedioInicial > 0 && lote.peso_medio > 0) {
                  const ganho = lote.peso_medio - pesoMedioInicial
                  return `+${ganho.toFixed(1)}`
                }
                return '-'
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">por animal</p>
          </div>

          {/* Peso Total Atual */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Total Atual (kg)</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.peso_medio > 0 && lote.total_animais > 0
                ? (lote.peso_medio * lote.total_animais).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_medio > 0 && lote.total_animais > 0
                ? `${((lote.peso_medio * lote.total_animais) / 30).toFixed(1)} @`
                : ''}
            </p>
          </div>

          {/* Animais Atuais */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Animais Atuais (cab)</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.total_animais}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.quantidade_total && lote.total_animais !== lote.quantidade_total
                ? `(entrada: ${lote.quantidade_total})`
                : ''}
            </p>
          </div>

          {/* Dias no Lote */}
          <div className="bg-card border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dias no Lote</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {diasNoLote}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{faseCiclo.fase}</p>
          </div>
        </div>
      </div>

      {/* Seção de Projeção e Conferência Alimentar - Aparece para todos os lotes */}
      <ConferenciaAlimentar
        loteId={id}
        pesoMedio={lote.peso_medio}
        quantidadeAnimais={lote.total_animais}
        gmdReal={gmdReal}
        tipoLote={lote.tipo_lote || undefined}
        isReadOnly={isLoteVendido}
      />

      {/* KPIs */}
      <LoteKPIs kpis={kpis} />

      {/* Card de RESUMO FINANCEIRO DO LOTE */}
      {resumoFinanceiro && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl">RESUMO FINANCEIRO DO LOTE</h2>
            <span className="text-xs text-muted-foreground">
              Base: {formatCurrency(precoArroba)}/@ (BA Sul)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Investimento Inicial */}
            <div className="bg-card border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Investimento Inicial</p>
              <p className="font-mono font-bold text-xl text-foreground">
                {formatCurrency(resumoFinanceiro.investimento_inicial)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Custo de compra do lote
              </p>
            </div>

            {/* Custeios/Despesas */}
            <div className="bg-card border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Custeios (Despesas)</p>
              <p className="font-mono font-bold text-xl text-foreground">
                {formatCurrency(resumoFinanceiro.custeios)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {despesas.length} despesas registradas
              </p>
            </div>

            {/* Total Investido */}
            <div className="bg-card border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
              <p className="font-mono font-bold text-xl text-primary">
                {formatCurrency(resumoFinanceiro.total_investido)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inicial + Custeios
              </p>
            </div>

            {/* Valor Estoque Atual */}
            <div className="bg-card border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Valor Estoque Atual</p>
              <p className="font-mono font-bold text-xl text-primary">
                {formatCurrency(resumoFinanceiro.valor_estoque_atual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumoFinanceiro.total_arrobas.toFixed(1)} @ x {formatCurrency(precoArroba)}
              </p>
            </div>
          </div>

          {/* Card de Margem de Lucro em destaque */}
          <div className="border rounded-lg p-6">
            {/* Header com título */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">MARGEM DE LUCRO ATUAL</h3>
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-primary/10 text-primary">
                {resumoFinanceiro.margem_percentual >= 10 ? 'Boa' : 'Baixa'}
              </span>
            </div>

            {/* Valores principais em destaque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-card border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Margem</p>
                <p className="font-mono font-bold text-4xl text-primary">
                  {resumoFinanceiro.margem_percentual > 0 ? '+' : ''}{resumoFinanceiro.margem_percentual.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-card border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuizo</p>
                <p className="font-mono font-bold text-2xl text-primary">
                  {resumoFinanceiro.lucro_ou_prejuizo >= 0 ? '+' : ''}{formatCurrency(resumoFinanceiro.lucro_ou_prejuizo)}
                </p>
              </div>
            </div>

            {/* Indicadores adicionais */}
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Animais</p>
                <p className="font-mono font-bold text-sm">{resumoFinanceiro.total_animais} cab</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Arrobas</p>
                <p className="font-mono font-bold text-sm">{resumoFinanceiro.total_arrobas.toFixed(1)} @</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">R$/Cabeca</p>
                <p className="font-mono font-bold text-sm">{formatCurrency(resumoFinanceiro.custo_por_cabeca)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">R$/Arroba</p>
                <p className="font-mono font-bold text-sm">{formatCurrency(resumoFinanceiro.custo_por_arroba)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card de Ciclo e Dias */}
      <div className="border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl mb-2">CICLO DO LOTE</h2>
            <p className="text-muted-foreground">
              Entrada: <strong>{new Date(dataInicioLote).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</strong>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Dias na Fazenda</p>
              <p className="font-mono font-bold text-6xl text-primary">{diasNoLote}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Fase</p>
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-muted/20 text-muted-foreground">
                {faseCiclo.fase}
              </span>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sistema</p>
              <p className="font-semibold">{lote.tipo_lote || 'Nao informado'}</p>
            </div>
          </div>
        </div>
        {/* Barra de progresso do ciclo */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>0 dias</span>
            <span>45</span>
            <span>60</span>
            <span>90</span>
            <span>120+</span>
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full transition-all bg-primary"
              style={{ width: `${Math.min((diasNoLote / 120) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secao de Pesagens do Lote */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl">HISTORICO DE PESAGENS</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe a evolucao de peso do lote
            </p>
          </div>
          {!isLoteVendido && (
            <Link href={`/dashboard/pesagens/lote?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm">
                <span>⚖️</span>
                Nova Pesagem
              </button>
            </Link>
          )}
        </div>

        {pesagensResumo.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-4xl mb-3">⚖️</p>
            <p className="text-muted-foreground mb-2">Nenhuma pesagem registrada para este lote</p>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoteVendido ? 'Este lote foi vendido sem pesagens registradas' : 'Registre pesagens para acompanhar o ganho de peso e performance'}
            </p>
            {!isLoteVendido && (
              <Link href={`/dashboard/pesagens/lote?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm">
                  Iniciar Primeira Pesagem
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grafico de Evolucao de Peso */}
            {pesagensResumo.length >= 1 && (
              <div className="bg-muted/10 rounded-xl p-4 border border-border">
                {/* Data visível em cima do gráfico */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg flex items-center gap-2">
                    <span>📈</span>
                    Evolucao de Peso
                  </h3>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Última pesagem</p>
                    <p className="font-mono font-semibold text-primary">
                      {new Date(pesagensResumo[0].data + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
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

            {/* Tabela de Histórico de Pesagens - Estilo Excel */}
            <div>
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <span>📋</span>
                Histórico Completo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Qtde</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Peso Médio</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Rendimento (@)</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">GMD</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Período</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Linha inicial - Data de criação do lote */}
                    {lote.peso_total_entrada && lote.quantidade_total && (
                      <tr className="border-b border-border/50 bg-success/5">
                        <td className="p-3">
                          <span className="font-mono text-sm text-success font-semibold">
                            {new Date(lote.data_entrada || lote.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </span>
                          <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded">Entrada</span>
                        </td>
                        <td className="text-center p-3 font-mono text-sm">{lote.quantidade_total}</td>
                        <td className="text-center p-3 font-mono text-sm">{(lote.peso_total_entrada / lote.quantidade_total).toFixed(1)} kg</td>
                        <td className="text-center p-3 font-mono text-sm">{(lote.peso_total_entrada / 30).toFixed(1)} @</td>
                        <td className="text-center p-3 font-mono text-sm text-muted-foreground">-</td>
                        <td className="text-center p-3 font-mono text-sm text-muted-foreground">0 dias</td>
                      </tr>
                    )}
                    {/* Linhas de pesagens */}
                    {[...pesagensResumo].reverse().map((pesagem, index, arr) => {
                      const formatDate = (dateString: string) => {
                        const date = new Date(dateString + 'T00:00:00')
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      }
                      const isLatest = index === arr.length - 1

                      // Calcular GMD e período
                      let gmd = 0
                      let periodo = 0

                      if (index === 0 && lote.peso_total_entrada && lote.quantidade_total) {
                        // Primeira pesagem - compara com entrada
                        const pesoInicial = lote.peso_total_entrada / lote.quantidade_total
                        const ganho = pesagem.pesoMedio - pesoInicial
                        const dataInicial = new Date(lote.data_entrada || lote.created_at)
                        periodo = Math.max(1, Math.floor(
                          (new Date(pesagem.data).getTime() - dataInicial.getTime()) / (1000 * 60 * 60 * 24)
                        ))
                        gmd = ganho / periodo
                      } else if (index > 0) {
                        // Demais pesagens - compara com anterior
                        const pesagemAnterior = arr[index - 1]
                        const ganho = pesagem.pesoMedio - pesagemAnterior.pesoMedio
                        periodo = Math.max(1, Math.floor(
                          (new Date(pesagem.data).getTime() - new Date(pesagemAnterior.data).getTime()) / (1000 * 60 * 60 * 24)
                        ))
                        gmd = ganho / periodo
                      }

                      return (
                        <tr
                          key={pesagem.data}
                          className={`border-b border-border/50 hover:bg-muted/10 ${isLatest ? 'bg-primary/5' : ''}`}
                        >
                          <td className="p-3">
                            <span className={`font-mono text-sm ${isLatest ? 'text-primary font-semibold' : ''}`}>
                              {formatDate(pesagem.data)}
                            </span>
                            {isLatest && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Última</span>
                            )}
                          </td>
                          <td className="text-center p-3 font-mono text-sm">{pesagem.qtdAnimais}</td>
                          <td className="text-center p-3 font-mono text-sm font-semibold">{pesagem.pesoMedio.toFixed(1)} kg</td>
                          <td className="text-center p-3 font-mono text-sm">{(pesagem.pesoTotal / 30).toFixed(1)} @</td>
                          <td className="text-center p-3">
                            {gmd !== 0 ? (
                              <span className={`font-mono text-sm font-semibold ${
                                gmd >= 1 ? 'text-success' :
                                gmd >= 0.7 ? 'text-primary' :
                                gmd >= 0.5 ? 'text-warning' : 'text-error'
                              }`}>
                                {gmd.toFixed(2)} kg
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center p-3 font-mono text-sm text-muted-foreground">{periodo} dias</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {pesagensResumo.length > 10 && (
              <Link href={`/dashboard/pesagens?lote=${id}`}>
                <button className="w-full text-center text-primary hover:underline font-semibold py-2">
                  Ver todas as {pesagensResumo.length} pesagens →
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Seção de Despesas do Lote */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl">HISTORICO DE DESPESAS</h2>
            <p className="text-sm text-muted-foreground">
              Custos de manutenção e operação do lote
            </p>
          </div>
          {!isLoteVendido && (
            <Link href={`/dashboard/financeiro/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm">
                <span>💰</span>
                Nova Despesa
              </button>
            </Link>
          )}
        </div>

        {despesas.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-4xl mb-3">💰</p>
            <p className="text-muted-foreground mb-2">Nenhuma despesa registrada para este lote</p>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoteVendido ? 'Este lote foi vendido sem despesas registradas' : 'Registre despesas como ração, medicamentos, mão de obra, etc.'}
            </p>
            {!isLoteVendido && (
              <Link href={`/dashboard/financeiro/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm">
                  Registrar Primeira Despesa
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo de Custos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-error/10 rounded-lg p-3 border border-error/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Despesas (R$)</p>
                <p className="font-mono font-bold text-xl text-error">
                  {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-accent/10 rounded-lg p-3 border border-accent/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Custo/Cabeça (R$)</p>
                <p className="font-mono font-bold text-xl text-accent">
                  {lote.total_animais > 0 ? (totalDespesas / lote.total_animais).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Registros</p>
                <p className="font-mono font-bold text-xl text-primary">
                  {despesas.length}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Custo/Mês Atual (R$)</p>
                <p className="font-mono font-bold text-xl">
                  {custoMesAtual ? custoMesAtual.custoCabeca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                </p>
              </div>
            </div>

            {/* Tabela de Histórico de Despesas - Estilo Planilha */}
            <div>
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <span>📋</span>
                Histórico Completo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Descrição</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Valor</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">R$/Cab</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map((despesa, index) => {
                      const isLatest = index === 0

                      const getCategoriaCor = (categoria: string) => {
                        switch (categoria) {
                          case 'racao': return 'bg-warning/20 text-warning'
                          case 'medicamento': return 'bg-error/20 text-error'
                          case 'vacina': return 'bg-success/20 text-success'
                          case 'vermifugo': return 'bg-primary/20 text-primary'
                          case 'mao_obra': return 'bg-accent/20 text-accent'
                          case 'transporte': return 'bg-purple-500/20 text-purple-500'
                          case 'manutencao': return 'bg-orange-500/20 text-orange-500'
                          default: return 'bg-muted/20 text-muted-foreground'
                        }
                      }

                      const getCategoriaIcone = (categoria: string) => {
                        switch (categoria) {
                          case 'racao': return '🌾'
                          case 'medicamento': return '💊'
                          case 'vacina': return '💉'
                          case 'vermifugo': return '🔬'
                          case 'mao_obra': return '👷'
                          case 'transporte': return '🚚'
                          case 'manutencao': return '🔧'
                          default: return '💰'
                        }
                      }

                      const getCategoriaLabel = (categoria: string) => {
                        const labels: Record<string, string> = {
                          'racao': 'Ração',
                          'medicamento': 'Medicamento',
                          'vacina': 'Vacina',
                          'vermifugo': 'Vermífugo',
                          'mao_obra': 'Mão de Obra',
                          'transporte': 'Transporte',
                          'manutencao': 'Manutenção',
                          'outros': 'Outros'
                        }
                        return labels[categoria] || categoria
                      }

                      return (
                        <tr
                          key={despesa.id}
                          className={`border-b border-border/50 hover:bg-muted/10 ${isLatest ? 'bg-primary/5' : ''}`}
                        >
                          <td className="p-3">
                            <span className={`font-mono text-sm ${isLatest ? 'text-primary font-semibold' : ''}`}>
                              {new Date(despesa.data_despesa + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </span>
                            {isLatest && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Última</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getCategoriaCor(despesa.categoria)}`}>
                              <span>{getCategoriaIcone(despesa.categoria)}</span>
                              {getCategoriaLabel(despesa.categoria)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium">{despesa.descricao}</span>
                            {despesa.observacoes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{despesa.observacoes}</p>
                            )}
                          </td>
                          <td className="text-right p-3">
                            <span className="font-mono text-sm font-semibold text-error">
                              {formatCurrency(despesa.valor)}
                            </span>
                          </td>
                          <td className="text-right p-3">
                            <span className="font-mono text-sm text-muted-foreground">
                              {lote.total_animais > 0 ? formatCurrency(despesa.valor / lote.total_animais) : '-'}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            <Link href={`/dashboard/financeiro/${despesa.id}`}>
                              <button className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded transition-all">
                                Ver
                              </button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Rodapé com totais */}
                  <tfoot>
                    <tr className="bg-muted/20 border-t-2 border-border">
                      <td colSpan={3} className="p-3 text-right font-semibold text-sm">Total:</td>
                      <td className="text-right p-3">
                        <span className="font-mono font-bold text-error">{formatCurrency(totalDespesas)}</span>
                      </td>
                      <td className="text-right p-3">
                        <span className="font-mono font-bold text-accent">
                          {lote.total_animais > 0 ? formatCurrency(totalDespesas / lote.total_animais) : '-'}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {despesas.length > 10 && (
              <Link href={`/dashboard/financeiro?lote=${id}`}>
                <button className="w-full text-center text-primary hover:underline font-semibold py-2">
                  Ver todas as {despesas.length} despesas →
                </button>
              </Link>
            )}

            {/* Custo por Mês */}
            {custosMes.length > 0 && lote.total_animais > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                  <span>📊</span>
                  Custo por Cabeça / Mês
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {custosMes.slice(0, 4).map((custoMes) => (
                    <div key={custoMes.mes} className="bg-muted/20 rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">{formatMesLabel(custoMes.mes)}</p>
                      <p className="font-mono font-bold text-lg text-accent">
                        {formatCurrency(custoMes.custoCabeca)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(custoMes.custoTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção de Manejos do Lote */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl">HISTORICO DE MANEJOS</h2>
            <p className="text-sm text-muted-foreground">
              Vacinações, vermífugos e outros procedimentos
            </p>
          </div>
          {!isLoteVendido && (
            <Link href={`/dashboard/manejo/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm">
                <span>💉</span>
                Novo Manejo
              </button>
            </Link>
          )}
        </div>

        {manejos.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-4xl mb-3">💉</p>
            <p className="text-muted-foreground mb-2">Nenhum manejo registrado para este lote</p>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoteVendido ? 'Este lote foi vendido sem manejos registrados' : 'Registre vacinações, vermífugos, suplementações, etc.'}
            </p>
            {!isLoteVendido && (
              <Link href={`/dashboard/manejo/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm">
                  Registrar Primeiro Manejo
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo de Manejos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-success/10 rounded-lg p-3 border border-success/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Vacinações</p>
                <p className="font-mono font-bold text-xl text-success">
                  {manejos.filter(m => m.tipo_manejo === 'vacinacao').length}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Vermífugos</p>
                <p className="font-mono font-bold text-xl text-primary">
                  {manejos.filter(m => m.tipo_manejo === 'vermifugo').length}
                </p>
              </div>
              <div className="bg-accent/10 rounded-lg p-3 border border-accent/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Outros</p>
                <p className="font-mono font-bold text-xl text-accent">
                  {manejos.filter(m => !['vacinacao', 'vermifugo'].includes(m.tipo_manejo)).length}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-3 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-mono font-bold text-xl">
                  {manejos.length}
                </p>
              </div>
            </div>

            {/* Tabela de Histórico de Manejos - Estilo Planilha */}
            <div>
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <span>📋</span>
                Histórico Completo
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Descrição</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Detalhes</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manejos.map((manejo, index) => {
                      const tipoInfo = getTipoManejoInfo(manejo.tipo_manejo)
                      const isLatest = index === 0

                      const getIcone = (tipo: string) => {
                        switch (tipo) {
                          case 'vacinacao': return '💉'
                          case 'vermifugo': return '💊'
                          case 'suplementacao': return '🌾'
                          case 'marcacao': return '🏷️'
                          case 'castracao': return '✂️'
                          case 'desmama': return '🍼'
                          default: return '📋'
                        }
                      }

                      const getTipoCor = (tipo: string) => {
                        switch (tipo) {
                          case 'vacinacao': return 'bg-success/20 text-success'
                          case 'vermifugo': return 'bg-primary/20 text-primary'
                          case 'suplementacao': return 'bg-accent/20 text-accent'
                          case 'marcacao': return 'bg-warning/20 text-warning'
                          case 'castracao': return 'bg-error/20 text-error'
                          default: return 'bg-muted/20 text-muted-foreground'
                        }
                      }

                      return (
                        <tr
                          key={manejo.id}
                          className={`border-b border-border/50 hover:bg-muted/10 ${isLatest ? 'bg-primary/5' : ''}`}
                        >
                          <td className="p-3">
                            <span className={`font-mono text-sm ${isLatest ? 'text-primary font-semibold' : ''}`}>
                              {new Date(manejo.data_manejo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </span>
                            {isLatest && (
                              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Último</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getTipoCor(manejo.tipo_manejo)}`}>
                              <span>{getIcone(manejo.tipo_manejo)}</span>
                              {tipoInfo.label}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium">{manejo.descricao}</span>
                            {manejo.observacoes && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{manejo.observacoes}</p>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {manejo.tipo_manejo === 'vacinacao' && manejo.vacinas && manejo.vacinas.length > 0 ? (
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                                {manejo.vacinas.length} vacina(s)
                              </span>
                            ) : manejo.observacoes ? (
                              <span className="text-xs text-muted-foreground truncate max-w-[100px] inline-block">{manejo.observacoes}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-center p-3">
                            <Link href={`/dashboard/manejo/${manejo.id}`}>
                              <button className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded transition-all">
                                Ver
                              </button>
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {manejos.length > 10 && (
              <Link href={`/dashboard/manejo?lote=${id}`}>
                <button className="w-full text-center text-primary hover:underline font-semibold py-2">
                  Ver todos os {manejos.length} manejos →
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Lista de Animais */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">ANIMAIS ({lote.total_animais})</h2>
          {lote.total_animais > 0 && (
            <button className="text-primary hover:underline font-semibold">
              Ver todos →
            </button>
          )}
        </div>

        {lote.total_animais === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum animal neste lote</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Lista de animais será implementada na próxima fase</p>
          </div>
        )}
      </div>
    </div>
  )
}
