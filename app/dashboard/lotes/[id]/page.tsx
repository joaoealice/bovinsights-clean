'use client'

import { useEffect, useState } from 'react'
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
  StatusPiquete,
  DIAS_RECUPERACAO_PASTO
} from '@/lib/services/areas-pastagem.service'
import { getDespesasPorLote, getCustoCabecaMes, Despesa, getResumoFinanceiroLote, ResumoFinanceiroLote } from '@/lib/services/financeiro.service'
import { getMarketPrices } from '@/lib/services/mercado.service'
import { getManejosPorLote, Manejo, getTipoManejoInfo } from '@/lib/services/manejo.service'
import { getPesagensByLote, PesagemWithDetails } from '@/lib/services/pesagens.service'
import LoteKPIs from '@/components/lotes/LoteKPIs'
import DespesaCard from '@/components/financeiro/DespesaCard'
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
  const [pesagens, setPesagens] = useState<PesagemWithDetails[]>([])
  const [pesagensResumo, setPesagensResumo] = useState<PesagemResumo[]>([])
  const [custosMes, setCustosMes] = useState<CustoCabecaMes[]>([])
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiroLote | null>(null)
  const [precoArroba, setPrecoArroba] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDespesaForm, setShowDespesaForm] = useState(false)

  // Estados para modal de troca de piquete
  const [showTrocaPiquete, setShowTrocaPiquete] = useState(false)
  const [piquetesDisponiveis, setPiquetesDisponiveis] = useState<AreaPastagemComStatus[]>([])
  const [loadingPiquetes, setLoadingPiquetes] = useState(false)
  const [piqueteSelecionado, setPiqueteSelecionado] = useState<string>('')
  const [salvandoTroca, setSalvandoTroca] = useState(false)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
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
        setPesagens(pesagensData)
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
  }

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
      <div className="card-leather p-12 text-center">
        <p className="text-6xl mb-4">❌</p>
        <h3 className="font-display text-2xl mb-2">Lote não encontrado</h3>
        <Link href="/dashboard/lotes">
          <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 mt-4">
            VOLTAR PARA LOTES
          </button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-success/20 text-success border-success/30'
      case 'inativo':
        return 'bg-muted/20 text-muted-foreground border-muted/30'
      case 'manutencao':
        return 'bg-warning/20 text-warning border-warning/30'
      case 'vendido':
        return 'bg-primary/20 text-primary border-primary/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-muted/30'
    }
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
    if (dias <= 45) return { fase: 'Inicio', cor: 'text-success' }
    if (dias <= 60) return { fase: 'Ciclo 45-60', cor: 'text-primary' }
    if (dias <= 90) return { fase: 'Ciclo 60-90', cor: 'text-accent' }
    if (dias <= 120) return { fase: 'Ciclo 90-120', cor: 'text-warning' }
    return { fase: 'Acima 120', cor: 'text-error' }
  }
  const faseCiclo = getFaseCiclo(diasNoLote)

  const kpis = [
    { label: 'Animais no Lote', value: lote.total_animais, icon: '🐮' },
    { label: 'Peso Médio', value: `${lote.peso_medio} kg`, icon: '⚖️', subValue: `${(lote.peso_medio / 30).toFixed(1)} @` },
    { label: 'Dias no Lote', value: diasNoLote, icon: '📅', subValue: faseCiclo.fase, subValueClass: faseCiclo.cor },
    { label: 'Custo/Cabeça/Mês', value: custoMesAtual && lote.total_animais > 0 ? formatCurrency(custoMesAtual.custoCabeca) : '-', icon: '📊' },
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
              <span className={`px-3 py-1 rounded-full text-sm font-mono font-bold border ${getStatusColor(lote.status)}`}>
                {lote.status.toUpperCase()}
              </span>
            </div>
            {lote.localizacao && (
              <p className="text-muted-foreground flex items-center gap-2">
                <span>📍</span>
                {lote.localizacao}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {!isLoteVendido && (
              <Link href={`/dashboard/lotes/${id}/editar`}>
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105">
                  Editar
                </button>
              </Link>
            )}
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

      {/* Banner de Lote Vendido */}
      {isLoteVendido && (
        <div className="bg-primary/10 border-2 border-primary rounded-xl p-6 flex items-center gap-4">
          <span className="text-4xl">💰</span>
          <div className="flex-1">
            <h3 className="font-display text-xl text-primary">LOTE VENDIDO</h3>
            <p className="text-muted-foreground">
              Este lote foi vendido e está em modo de somente leitura. Você pode visualizar os dados mas não pode editar.
            </p>
          </div>
          <Link href="/dashboard/vendas">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105">
              Ver Vendas
            </button>
          </Link>
        </div>
      )}

      {/* Card de Dados Fixos Iniciais */}
      <div className="card-leather p-6 bg-gradient-to-r from-success/5 to-primary/5 border-2 border-success/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">DADOS DE ENTRADA DO LOTE</h2>
          <span className="text-xs bg-success/20 text-success px-3 py-1 rounded-full font-semibold">
            Dados Fixos de Referência
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Data de Criação */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Data de Criação</p>
            <p className="font-mono font-bold text-lg text-foreground">
              {new Date(lote.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Tipo do Lote */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tipo do Lote</p>
            <p className="font-mono font-bold text-lg text-foreground">
              {lote.tipo_lote || 'Não informado'}
            </p>
          </div>

          {/* Quantidade Inicial */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Qtd. Inicial</p>
            <p className="font-mono font-bold text-lg text-foreground">
              {lote.quantidade_total || lote.total_animais} cab
            </p>
          </div>

          {/* Peso Médio Inicial */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Médio Inicial</p>
            <p className="font-mono font-bold text-lg text-foreground">
              {lote.peso_total_entrada && lote.quantidade_total
                ? `${(lote.peso_total_entrada / lote.quantidade_total).toFixed(1)} kg`
                : '-'}
            </p>
          </div>

          {/* Arroba Média Inicial */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">@ Média Inicial</p>
            <p className="font-mono font-bold text-lg text-primary">
              {lote.peso_total_entrada && lote.quantidade_total
                ? `${(lote.peso_total_entrada / lote.quantidade_total / 30).toFixed(2)} @`
                : '-'}
            </p>
          </div>

          {/* Peso Total Inicial */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Total Inicial</p>
            <p className="font-mono font-bold text-lg text-foreground">
              {lote.peso_total_entrada
                ? `${lote.peso_total_entrada.toLocaleString('pt-BR')} kg`
                : '-'}
            </p>
          </div>

          {/* Arroba Total Inicial */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">@ Total Inicial</p>
            <p className="font-mono font-bold text-lg text-primary">
              {lote.peso_total_entrada
                ? `${(lote.peso_total_entrada / 30).toFixed(1)} @`
                : '-'}
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
                <h3 className="font-display text-2xl flex items-center gap-2">
                  <span>🔄</span>
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
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌿</span>
                      <div>
                        <p className="font-semibold">Pasto Avulso</p>
                        <p className="text-sm text-muted-foreground">
                          Sem piquete cadastrado (rotação manual)
                        </p>
                      </div>
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
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {isRecuperacao ? '🔴' : isDisponivel ? '🟢' : '🟡'}
                              </span>
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
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>ℹ️</span>
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
        <div className="card-leather p-6 bg-gradient-to-r from-success/5 to-primary/5 border-2 border-success/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl flex items-center gap-2">
              <span>🌾</span>
              MANEJO DE PASTAGEM
            </h2>
            {(() => {
              // Calcular status da permanência
              if (!lote.data_entrada_piquete || !lote.dias_permanencia_ideal) {
                return (
                  <span className="text-xs bg-muted/20 text-muted-foreground px-3 py-1 rounded-full font-semibold">
                    Sem dados de permanência
                  </span>
                )
              }

              const dataEntrada = new Date(lote.data_entrada_piquete)
              const dataSaidaRecomendada = new Date(dataEntrada)
              dataSaidaRecomendada.setDate(dataSaidaRecomendada.getDate() + lote.dias_permanencia_ideal)

              const dataAlerta = new Date(dataSaidaRecomendada)
              dataAlerta.setDate(dataAlerta.getDate() - 2)

              const hoje = new Date()
              hoje.setHours(0, 0, 0, 0)

              const diasRestantes = Math.ceil((dataSaidaRecomendada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

              if (diasRestantes < 0) {
                return (
                  <span className="text-xs bg-error/20 text-error px-3 py-1 rounded-full font-semibold animate-pulse">
                    🚨 VENCIDO há {Math.abs(diasRestantes)} dias
                  </span>
                )
              } else if (diasRestantes <= 2) {
                return (
                  <span className="text-xs bg-warning/20 text-warning px-3 py-1 rounded-full font-semibold">
                    ⚠️ Vence em {diasRestantes} dias
                  </span>
                )
              } else {
                return (
                  <span className="text-xs bg-success/20 text-success px-3 py-1 rounded-full font-semibold">
                    ✅ OK - {diasRestantes} dias restantes
                  </span>
                )
              }
            })()}
          </div>

          {lote.piquete ? (
            <>
              {/* Informações do Piquete */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                {/* Nome do Piquete */}
                <div className="bg-success/10 rounded-xl p-4 border border-success/30 text-center col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Piquete Atual</p>
                  <p className="font-display text-xl text-success">{lote.piquete.nome}</p>
                  {lote.piquete.tipo_pasto && TIPOS_PASTO[lote.piquete.tipo_pasto as TipoPasto] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {TIPOS_PASTO[lote.piquete.tipo_pasto as TipoPasto].nome}
                    </p>
                  )}
                </div>

                {/* Área */}
                <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Área</p>
                  <p className="font-mono font-bold text-lg">{lote.piquete.area_hectares.toFixed(2)} ha</p>
                </div>

                {/* MS Disponível */}
                <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">MS Disponível</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.ms_total_kg ? `${(lote.piquete.ms_total_kg / 1000).toFixed(1)} t` : '-'}
                  </p>
                </div>

                {/* Altura Entrada */}
                <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Altura Entrada</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.altura_entrada_cm ? `${lote.piquete.altura_entrada_cm} cm` : '-'}
                  </p>
                </div>

                {/* Altura Saída */}
                <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Altura Saída</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.piquete.altura_saida_cm ? `${lote.piquete.altura_saida_cm} cm` : '-'}
                  </p>
                </div>
              </div>

              {/* Card de Permanência */}
              {lote.data_entrada_piquete && lote.dias_permanencia_ideal && (
                (() => {
                  const dataEntrada = new Date(lote.data_entrada_piquete)
                  const dataSaidaRecomendada = new Date(dataEntrada)
                  dataSaidaRecomendada.setDate(dataSaidaRecomendada.getDate() + lote.dias_permanencia_ideal)

                  const dataAlerta = new Date(dataSaidaRecomendada)
                  dataAlerta.setDate(dataAlerta.getDate() - 2)

                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)

                  const diasNoPiquete = Math.floor((hoje.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24))
                  const diasRestantes = Math.ceil((dataSaidaRecomendada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                  const percentualUsado = Math.min((diasNoPiquete / lote.dias_permanencia_ideal) * 100, 100)

                  const isVencido = diasRestantes < 0
                  const isAlerta = diasRestantes <= 2 && diasRestantes >= 0

                  return (
                    <div className={`rounded-xl p-6 border-2 ${
                      isVencido ? 'bg-error/10 border-error' :
                      isAlerta ? 'bg-warning/10 border-warning' :
                      'bg-success/10 border-success'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Data de Entrada */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Entrada no Piquete</p>
                          <p className="font-display text-2xl">
                            {dataEntrada.toLocaleDateString('pt-BR')}
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
                            isVencido ? 'text-error' : isAlerta ? 'text-warning' : 'text-success'
                          }`}>
                            {dataSaidaRecomendada.toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        {/* Dias Restantes */}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase mb-1">
                            {isVencido ? 'Dias de Atraso' : 'Dias Restantes'}
                          </p>
                          <p className={`font-display text-4xl ${
                            isVencido ? 'text-error' : isAlerta ? 'text-warning' : 'text-success'
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
                            className={`h-full transition-all ${
                              isVencido ? 'bg-error' : isAlerta ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${percentualUsado}%` }}
                          />
                          {/* Marcador de alerta (2 dias antes) */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-warning/50"
                            style={{ left: `${((lote.dias_permanencia_ideal - 2) / lote.dias_permanencia_ideal) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {percentualUsado.toFixed(0)}% do tempo ideal utilizado
                        </p>
                      </div>

                      {/* Alertas */}
                      {isVencido && (
                        <div className="mt-4 p-3 bg-error/20 rounded-lg border border-error">
                          <p className="text-sm text-error font-semibold flex items-center gap-2">
                            <span>🚨</span>
                            ATENÇÃO: Tempo de permanência excedido! Faça a rotação do lote para evitar degradação do pasto.
                          </p>
                        </div>
                      )}
                      {isAlerta && (
                        <div className="mt-4 p-3 bg-warning/20 rounded-lg border border-warning">
                          <p className="text-sm text-warning font-semibold flex items-center gap-2">
                            <span>⚠️</span>
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
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>ℹ️</span>
                    Dados de permanência não configurados. Edite o lote para definir a data de entrada e dias ideais.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-muted/20 rounded-lg p-6 border border-border text-center">
              <p className="text-4xl mb-3">🌾</p>
              <p className="text-muted-foreground mb-2">Nenhum piquete vinculado a este lote</p>
              <p className="text-sm text-muted-foreground">
                Este lote é do tipo {lote.tipo_lote === 'pasto' ? 'Pasto' : 'Semi Confinamento'} mas não tem piquete cadastrado.
              </p>
              {!isLoteVendido && (
                <Link href={`/dashboard/lotes/${id}/editar`}>
                  <button className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2 rounded-lg transition-all hover:scale-105">
                    Vincular Piquete
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card de PERFORMANCE */}
      <div className="card-leather p-6 bg-gradient-to-r from-accent/5 to-warning/5 border-2 border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">PERFORMANCE</h2>
          <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-semibold">
            Indicadores Atuais
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* GMD - Ganho Médio Diário */}
          <div className={`rounded-xl p-4 border text-center ${(() => {
            // Calcular GMD para determinar cor
            let gmd = 0
            const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
              ? lote.peso_total_entrada / lote.quantidade_total
              : 0

            if (pesagensResumo.length >= 1 && pesoMedioInicial > 0) {
              const ultimaPesagem = pesagensResumo[0]
              const ganhoTotal = ultimaPesagem.pesoMedio - pesoMedioInicial
              if (diasNoLote > 0) {
                gmd = ganhoTotal / diasNoLote
              }
            } else if (pesagensResumo.length >= 2) {
              const primeiraPesagem = pesagensResumo[pesagensResumo.length - 1]
              const ultimaPesagem = pesagensResumo[0]
              const ganhoTotal = ultimaPesagem.pesoMedio - primeiraPesagem.pesoMedio
              const diasEntrePesagens = Math.floor(
                (new Date(ultimaPesagem.data).getTime() - new Date(primeiraPesagem.data).getTime()) / (1000 * 60 * 60 * 24)
              )
              if (diasEntrePesagens > 0) {
                gmd = ganhoTotal / diasEntrePesagens
              }
            }

            return gmd >= 1 ? 'bg-success/10 border-success/30' :
                   gmd >= 0.7 ? 'bg-primary/10 border-primary/30' :
                   gmd >= 0.5 ? 'bg-warning/10 border-warning/30' :
                   gmd > 0 ? 'bg-error/10 border-error/30' : 'bg-accent/10 border-accent/30'
          })()}`}>
            <p className="text-xs text-muted-foreground mb-1">GMD</p>
            <p className={`font-mono font-bold text-2xl ${(() => {
              // Calcular GMD para determinar cor do texto
              let gmd = 0
              const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                ? lote.peso_total_entrada / lote.quantidade_total
                : 0

              if (pesagensResumo.length >= 1 && pesoMedioInicial > 0) {
                const ultimaPesagem = pesagensResumo[0]
                const ganhoTotal = ultimaPesagem.pesoMedio - pesoMedioInicial
                if (diasNoLote > 0) {
                  gmd = ganhoTotal / diasNoLote
                }
              } else if (pesagensResumo.length >= 2) {
                const primeiraPesagem = pesagensResumo[pesagensResumo.length - 1]
                const ultimaPesagem = pesagensResumo[0]
                const ganhoTotal = ultimaPesagem.pesoMedio - primeiraPesagem.pesoMedio
                const diasEntrePesagens = Math.floor(
                  (new Date(ultimaPesagem.data).getTime() - new Date(primeiraPesagem.data).getTime()) / (1000 * 60 * 60 * 24)
                )
                if (diasEntrePesagens > 0) {
                  gmd = ganhoTotal / diasEntrePesagens
                }
              }

              return gmd >= 1 ? 'text-success' :
                     gmd >= 0.7 ? 'text-primary' :
                     gmd >= 0.5 ? 'text-warning' :
                     gmd > 0 ? 'text-error' : 'text-accent'
            })()}`}>
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
                    return `${(ganhoTotal / diasNoLote).toFixed(2)} kg`
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
                    return `${(ganhoTotal / diasEntrePesagens).toFixed(2)} kg`
                  }
                }
                return '-'
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ganho Medio Diario</p>
          </div>

          {/* Peso Médio Atual */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Médio Atual</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.peso_medio > 0 ? `${lote.peso_medio.toFixed(1)} kg` : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_medio > 0 ? `${(lote.peso_medio / 30).toFixed(2)} @` : ''}
            </p>
          </div>

          {/* Ganho Total de Peso */}
          <div className="bg-success/10 rounded-xl p-4 border border-success/30 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ganho Total</p>
            <p className="font-mono font-bold text-2xl text-success">
              {(() => {
                const pesoMedioInicial = lote.peso_total_entrada && lote.quantidade_total
                  ? lote.peso_total_entrada / lote.quantidade_total
                  : 0
                if (pesoMedioInicial > 0 && lote.peso_medio > 0) {
                  const ganho = lote.peso_medio - pesoMedioInicial
                  return `+${ganho.toFixed(1)} kg`
                }
                return '-'
              })()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">por animal</p>
          </div>

          {/* Peso Total Atual */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso Total Atual</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.peso_medio > 0 && lote.total_animais > 0
                ? `${(lote.peso_medio * lote.total_animais).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg`
                : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.peso_medio > 0 && lote.total_animais > 0
                ? `${((lote.peso_medio * lote.total_animais) / 30).toFixed(1)} @`
                : ''}
            </p>
          </div>

          {/* Animais Atuais */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Animais Atuais</p>
            <p className="font-mono font-bold text-2xl text-foreground">
              {lote.total_animais} cab
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lote.quantidade_total && lote.total_animais !== lote.quantidade_total
                ? `(entrada: ${lote.quantidade_total})`
                : ''}
            </p>
          </div>

          {/* Dias no Lote */}
          <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dias no Lote</p>
            <p className={`font-mono font-bold text-2xl ${faseCiclo.cor}`}>
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

      {/* Informações Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Informações */}
        <div className="card-leather p-6 space-y-4">
          <h2 className="font-display text-2xl mb-4">INFORMAÇÕES</h2>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Tipo de Lote</p>
            <p className="font-semibold">{lote.tipo_lote || 'Não especificado'}</p>
          </div>

          {lote.observacoes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{lote.observacoes}</p>
            </div>
          )}
        </div>

        {/* Card de Custos da Compra */}
        <div className="card-leather p-6">
          <h2 className="font-display text-2xl mb-4">CUSTOS DA COMPRA</h2>

          {lote.custo_total && lote.custo_total > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valor dos Animais</p>
                  <p className="font-mono font-bold text-lg">
                    {lote.valor_animais?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Frete + Comissão</p>
                  <p className="font-mono font-bold text-lg">
                    {((lote.frete || 0) + (lote.comissao || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Custo Total Compra</p>
                  <p className="font-mono font-bold text-xl text-primary">
                    {lote.custo_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="flex justify-between items-center bg-primary/10 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Investimento Médio/Unidade</p>
                  <p className="font-mono font-bold text-xl text-primary">
                    {lote.custo_por_cabeca
                      ? lote.custo_por_cabeca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : lote.quantidade_total && lote.quantidade_total > 0
                        ? (lote.custo_total / lote.quantidade_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '-'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 border border-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Custos de compra não informados
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Card de RESUMO FINANCEIRO DO LOTE */}
      {resumoFinanceiro && (
        <div className="card-leather p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl">RESUMO FINANCEIRO DO LOTE</h2>
            <span className="text-xs text-muted-foreground">
              Base: {formatCurrency(precoArroba)}/@ (BA Sul)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Investimento Inicial */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Investimento Inicial</p>
              <p className="font-mono font-bold text-xl text-foreground">
                {formatCurrency(resumoFinanceiro.investimento_inicial)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Custo de compra do lote
              </p>
            </div>

            {/* Custeios/Despesas */}
            <div className="bg-background/50 rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Custeios (Despesas)</p>
              <p className="font-mono font-bold text-xl text-foreground">
                {formatCurrency(resumoFinanceiro.custeios)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {despesas.length} despesas registradas
              </p>
            </div>

            {/* Total Investido */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Total Investido</p>
              <p className="font-mono font-bold text-xl text-primary">
                {formatCurrency(resumoFinanceiro.total_investido)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inicial + Custeios
              </p>
            </div>

            {/* Valor Estoque Atual */}
            <div className="bg-success/10 rounded-xl p-4 border border-success/30">
              <p className="text-xs text-muted-foreground mb-1">Valor Estoque Atual</p>
              <p className="font-mono font-bold text-xl text-success">
                {formatCurrency(resumoFinanceiro.valor_estoque_atual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumoFinanceiro.total_arrobas.toFixed(1)} @ x {formatCurrency(precoArroba)}
              </p>
            </div>
          </div>

          {/* Card de Margem de Lucro em destaque */}
          <div className={`rounded-xl p-6 border-2 ${
            resumoFinanceiro.margem_percentual >= 25 ? 'bg-success/10 border-success/30' :
            resumoFinanceiro.margem_percentual >= 10 ? 'bg-primary/10 border-primary/30' :
            resumoFinanceiro.margem_percentual >= 0 ? 'bg-warning/10 border-warning/30' :
            'bg-error/10 border-error/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-display text-xl mb-2">MARGEM DE LUCRO ATUAL</h3>
                <p className="text-sm text-muted-foreground">
                  {resumoFinanceiro.margem_percentual >= 25
                    ? 'Margem excelente! Acima do objetivo de 25%'
                    : resumoFinanceiro.margem_percentual >= 10
                    ? 'Margem boa, mas abaixo do objetivo de 25%'
                    : resumoFinanceiro.margem_percentual >= 0
                    ? 'Margem baixa, considere otimizar custos'
                    : 'Operando com prejuizo no momento'
                  }
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Lucro/Prejuizo</p>
                  <p className={`font-mono font-bold text-2xl ${
                    resumoFinanceiro.lucro_ou_prejuizo >= 0 ? 'text-success' : 'text-error'
                  }`}>
                    {resumoFinanceiro.lucro_ou_prejuizo >= 0 ? '+' : ''}{formatCurrency(resumoFinanceiro.lucro_ou_prejuizo)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Margem</p>
                  <p className={`font-mono font-bold text-4xl ${
                    resumoFinanceiro.margem_percentual >= 25 ? 'text-success' :
                    resumoFinanceiro.margem_percentual >= 10 ? 'text-primary' :
                    resumoFinanceiro.margem_percentual >= 0 ? 'text-warning' : 'text-error'
                  }`}>
                    {resumoFinanceiro.margem_percentual > 0 ? '+' : ''}{resumoFinanceiro.margem_percentual.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Indicadores adicionais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Animais</p>
                <p className="font-mono font-bold">{resumoFinanceiro.total_animais} cab</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Arrobas</p>
                <p className="font-mono font-bold">{resumoFinanceiro.total_arrobas.toFixed(1)} @</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Custo/Cabeca</p>
                <p className="font-mono font-bold">{formatCurrency(resumoFinanceiro.custo_por_cabeca)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Custo/Arroba</p>
                <p className="font-mono font-bold">{formatCurrency(resumoFinanceiro.custo_por_arroba)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card de Ciclo e Dias */}
      <div className="card-leather p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl mb-2">CICLO DO LOTE</h2>
            <p className="text-muted-foreground">
              Entrada: <strong>{new Date(dataInicioLote).toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Dias na Fazenda</p>
              <p className={`font-mono font-bold text-6xl ${faseCiclo.cor}`}>{diasNoLote}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Fase</p>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${faseCiclo.cor} bg-current/10`}>
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
              className={`h-full transition-all ${
                diasNoLote <= 45 ? 'bg-success' :
                diasNoLote <= 60 ? 'bg-primary' :
                diasNoLote <= 90 ? 'bg-accent' :
                diasNoLote <= 120 ? 'bg-warning' : 'bg-error'
              }`}
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
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center gap-2">
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
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2 rounded-lg transition-all hover:scale-105">
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
                <h3 className="font-display text-lg mb-4 flex items-center gap-2">
                  <span>📈</span>
                  Evolucao de Peso
                </h3>
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

            {/* Cards de Pesagens por Data */}
            <div>
              <h3 className="font-display text-lg mb-3 flex items-center gap-2">
                <span>📋</span>
                Registros de Pesagem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pesagensResumo.slice(0, 6).map((pesagem, index) => {
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString + 'T00:00:00')
                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                  }
                  const isLatest = index === 0

                  // Calcular GMD em relacao a pesagem anterior
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
                    <div
                      key={pesagem.data}
                      className={`p-4 rounded-lg border ${
                        isLatest
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-muted/10 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-semibold ${isLatest ? 'text-primary' : 'text-muted-foreground'}`}>
                          {formatDate(pesagem.data)}
                        </span>
                        {isLatest && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Ultima
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Animais</p>
                          <p className="font-mono font-bold">{pesagem.qtdAnimais}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Peso Medio</p>
                          <p className="font-mono font-bold">{pesagem.pesoMedio.toFixed(1)} kg</p>
                        </div>
                      </div>
                      {/* GMD do periodo */}
                      {gmd !== 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">GMD do Periodo</p>
                          <p className={`font-mono font-bold ${
                            gmd >= 1 ? 'text-success' :
                            gmd >= 0.7 ? 'text-primary' :
                            gmd >= 0.5 ? 'text-warning' : 'text-error'
                          }`}>
                            {gmd.toFixed(2)} kg/dia
                          </p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">Peso Total / Arrobas</p>
                        <p className="font-mono text-sm">{pesagem.pesoTotal.toFixed(0)} kg / {(pesagem.pesoTotal / 30).toFixed(1)} @</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {pesagensResumo.length > 6 && (
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
            <h2 className="font-display text-2xl">DESPESAS DO LOTE</h2>
            <p className="text-sm text-muted-foreground">
              Custos mensais de manutenção e operação
            </p>
          </div>
          {!isLoteVendido && (
            <Link href={`/dashboard/financeiro/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center gap-2">
                <span>+</span>
                Registrar Despesa
              </button>
            </Link>
          )}
        </div>

        {despesas.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-muted-foreground mb-2">Nenhuma despesa registrada para este lote</p>
            <p className="text-sm text-muted-foreground">
              Registre despesas como ração, medicamentos, mão de obra, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de Despesas Recentes */}
            <div className="space-y-2">
              {despesas.slice(0, 5).map((despesa) => (
                <DespesaCard key={despesa.id} despesa={despesa as any} showLote={false} />
              ))}
            </div>

            {despesas.length > 5 && (
              <Link href={`/dashboard/financeiro?lote=${id}`}>
                <button className="w-full text-center text-primary hover:underline font-semibold py-2">
                  Ver todas as {despesas.length} despesas →
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Resumo Custo/Cabeça/Mês */}
        {custosMes.length > 0 && lote.total_animais > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-display text-xl mb-4">CUSTO POR CABEÇA / MÊS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {custosMes.slice(0, 4).map((custoMes) => (
                <div key={custoMes.mes} className="bg-muted/20 rounded-lg p-4 border border-border">
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

            {/* Total Geral */}
            <div className="mt-4 bg-accent/10 rounded-lg p-4 border border-accent/30 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Despesas do Lote</p>
                <p className="font-mono font-bold text-xl">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Custo/Cabeça Total</p>
                <p className="font-mono font-bold text-xl text-accent">
                  {lote.total_animais > 0 ? formatCurrency(totalDespesas / lote.total_animais) : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção de Manejos do Lote */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl">MANEJOS DO LOTE</h2>
            <p className="text-sm text-muted-foreground">
              Historico de vacinacoes, vermifugos e outros manejos
            </p>
          </div>
          {!isLoteVendido && (
            <Link href={`/dashboard/manejo/novo?lote=${id}&loteName=${encodeURIComponent(lote.nome)}`}>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center gap-2">
                <span>+</span>
                Registrar Manejo
              </button>
            </Link>
          )}
        </div>

        {manejos.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-muted-foreground mb-2">Nenhum manejo registrado para este lote</p>
            <p className="text-sm text-muted-foreground">
              Registre vacinacoes, vermifugos, suplementacoes, etc.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de Manejos Recentes */}
            <div className="space-y-2">
              {manejos.slice(0, 5).map((manejo) => {
                const tipoInfo = getTipoManejoInfo(manejo.tipo_manejo)
                const formatDate = (dateString: string) => {
                  const date = new Date(dateString + 'T00:00:00')
                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                }
                return (
                  <Link
                    key={manejo.id}
                    href={`/dashboard/manejo/${manejo.id}`}
                    className="flex items-center gap-4 p-4 bg-muted/10 rounded-lg border border-border hover:bg-muted/20 transition-all"
                  >
                    <span className="text-2xl">
                      {manejo.tipo_manejo === 'vacinacao' ? '💉' :
                       manejo.tipo_manejo === 'vermifugo' ? '💊' :
                       manejo.tipo_manejo === 'suplementacao' ? '🌾' :
                       manejo.tipo_manejo === 'marcacao' ? '🏷️' :
                       manejo.tipo_manejo === 'castracao' ? '✂️' :
                       manejo.tipo_manejo === 'desmama' ? '🍼' : '📋'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{manejo.descricao}</p>
                      <p className="text-sm text-muted-foreground">{tipoInfo.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(manejo.data_manejo)}</p>
                      {manejo.tipo_manejo === 'vacinacao' && manejo.vacinas && (
                        <p className="text-xs text-success">{manejo.vacinas.length} vacina(s)</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {manejos.length > 5 && (
              <Link href={`/dashboard/manejo?lote=${id}`}>
                <button className="w-full text-center text-primary hover:underline font-semibold py-2">
                  Ver todos os {manejos.length} manejos →
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Resumo de Vacinações */}
        {manejos.filter(m => m.tipo_manejo === 'vacinacao').length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-display text-xl mb-4">RESUMO DE VACINACOES</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-success/10 rounded-lg p-4 border border-success/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Vacinacoes</p>
                <p className="font-mono font-bold text-2xl text-success">
                  {manejos.filter(m => m.tipo_manejo === 'vacinacao').length}
                </p>
              </div>
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Vermifugos</p>
                <p className="font-mono font-bold text-2xl text-primary">
                  {manejos.filter(m => m.tipo_manejo === 'vermifugo').length}
                </p>
              </div>
              <div className="bg-accent/10 rounded-lg p-4 border border-accent/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Outros Manejos</p>
                <p className="font-mono font-bold text-2xl text-accent">
                  {manejos.filter(m => !['vacinacao', 'vermifugo'].includes(m.tipo_manejo)).length}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4 border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Registros</p>
                <p className="font-mono font-bold text-2xl">
                  {manejos.length}
                </p>
              </div>
            </div>
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
