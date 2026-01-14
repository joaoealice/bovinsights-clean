'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getContas,
  getResumoConta,
  registrarPagamento,
  ContaWithRelations,
  ResumoConta,
  TipoConta,
  StatusConta
} from '@/lib/services/contas.service'
import toast from 'react-hot-toast'

export default function ContasPage() {
  const [contas, setContas] = useState<ContaWithRelations[]>([])
  const [resumo, setResumo] = useState<ResumoConta | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<TipoConta | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<StatusConta | ''>('')

  useEffect(() => {
    loadData()
  }, [filtroTipo, filtroStatus])

  const loadData = async () => {
    try {
      setLoading(true)
      const filtros: any = {}
      if (filtroTipo) filtros.tipo = filtroTipo
      if (filtroStatus) filtros.status = filtroStatus

      const [contasData, resumoData] = await Promise.all([
        getContas(filtros),
        getResumoConta()
      ])
      setContas(contasData)
      setResumo(resumoData)
    } catch (error: any) {
      toast.error('Erro ao carregar contas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handlePagarReceber = async (conta: ContaWithRelations) => {
    const valorRestante = conta.valor - (conta.valor_pago || 0)
    const confirmar = window.confirm(
      `Confirmar ${conta.tipo === 'receber' ? 'recebimento' : 'pagamento'} de ${formatCurrency(valorRestante)}?`
    )

    if (!confirmar) return

    try {
      await registrarPagamento(conta.id, valorRestante)
      toast.success(`${conta.tipo === 'receber' ? 'Recebimento' : 'Pagamento'} registrado!`)
      loadData()
    } catch (error: any) {
      toast.error('Erro ao registrar pagamento')
      console.error(error)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  }

  const isVencida = (conta: ContaWithRelations) => {
    const hoje = new Date().toISOString().split('T')[0]
    return ['pendente', 'parcial'].includes(conta.status) && conta.data_vencimento < hoje
  }

  const getStatusBadge = (conta: ContaWithRelations) => {
    if (conta.status === 'pago') {
      return <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">Pago</span>
    }
    if (conta.status === 'cancelado') {
      return <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">Cancelado</span>
    }
    if (isVencida(conta)) {
      return <span className="px-2 py-1 text-xs rounded-full bg-error/20 text-error">Vencida</span>
    }
    if (conta.status === 'parcial') {
      return <span className="px-2 py-1 text-xs rounded-full bg-warning/20 text-warning">Parcial</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-info/20 text-info">Pendente</span>
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl mb-2">CONTAS</h1>
          <p className="text-muted-foreground">Controle de valores a pagar e receber</p>
        </div>
      </div>

      {/* KPIs Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">A Receber</p>
            <p className="font-display text-xl text-success">
              {formatCurrency(resumo.total_a_receber)}
            </p>
          </div>
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">A Pagar</p>
            <p className="font-display text-xl text-error">
              {formatCurrency(resumo.total_a_pagar)}
            </p>
          </div>
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">Recebido (Mês)</p>
            <p className="font-display text-xl text-success/70">
              {formatCurrency(resumo.recebido_mes)}
            </p>
          </div>
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">Pago (Mês)</p>
            <p className="font-display text-xl text-error/70">
              {formatCurrency(resumo.pago_mes)}
            </p>
          </div>
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">Vencidas</p>
            <p className={`font-display text-xl ${resumo.vencidas > 0 ? 'text-error' : ''}`}>
              {resumo.vencidas}
            </p>
          </div>
          <div className="card-leather p-4">
            <p className="text-xs text-muted-foreground mb-1">Vence em 7 dias</p>
            <p className={`font-display text-xl ${resumo.a_vencer_7_dias > 0 ? 'text-warning' : ''}`}>
              {resumo.a_vencer_7_dias}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoConta | '')}
          className="px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os tipos</option>
          <option value="receber">A Receber</option>
          <option value="pagar">A Pagar</option>
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusConta | '')}
          className="px-4 py-2 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="parcial">Parcial</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Lista de Contas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : contas.length === 0 ? (
        <div className="card-leather p-12 text-center">
          <p className="text-6xl mb-4">📋</p>
          <h3 className="font-display text-2xl mb-2">Nenhuma conta registrada</h3>
          <p className="text-muted-foreground mb-6">
            As contas a receber serão criadas automaticamente quando você registrar vendas a prazo
          </p>
          <Link href="/dashboard/vendas/novo">
            <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105">
              REGISTRAR VENDA
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {contas.map((conta) => (
            <div
              key={conta.id}
              className={`card-leather p-4 flex flex-col md:flex-row md:items-center gap-4 ${
                isVencida(conta) ? 'border-l-4 border-l-error' : ''
              }`}
            >
              {/* Tipo e descrição */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xl ${conta.tipo === 'receber' ? '' : ''}`}>
                    {conta.tipo === 'receber' ? '📥' : '📤'}
                  </span>
                  <span className="font-semibold">{conta.descricao}</span>
                  {getStatusBadge(conta)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Vencimento: {formatDate(conta.data_vencimento)}</span>
                  {conta.lote && (
                    <span>Lote: {conta.lote.nome}</span>
                  )}
                  {conta.origem !== 'manual' && (
                    <span className="capitalize">Origem: {conta.origem}</span>
                  )}
                </div>
              </div>

              {/* Valores */}
              <div className="text-right">
                <p className={`font-mono font-bold text-xl ${conta.tipo === 'receber' ? 'text-success' : 'text-error'}`}>
                  {conta.tipo === 'receber' ? '+' : '-'} {formatCurrency(conta.valor)}
                </p>
                {conta.valor_pago > 0 && conta.status !== 'pago' && (
                  <p className="text-sm text-muted-foreground">
                    Pago: {formatCurrency(conta.valor_pago)} | Resta: {formatCurrency(conta.valor - conta.valor_pago)}
                  </p>
                )}
              </div>

              {/* Ações */}
              {['pendente', 'parcial'].includes(conta.status) && (
                <button
                  onClick={() => handlePagarReceber(conta)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 ${
                    conta.tipo === 'receber'
                      ? 'bg-success/20 text-success hover:bg-success/30'
                      : 'bg-error/20 text-error hover:bg-error/30'
                  }`}
                >
                  {conta.tipo === 'receber' ? 'Receber' : 'Pagar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
