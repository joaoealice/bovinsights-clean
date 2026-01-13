'use client'

import { useState, useEffect } from 'react'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import {
  getDadosLoteParaVenda,
  DadosLoteParaVenda,
  kgToArrobas,
  OBJETIVO_MARGEM,
  ModoPagamento
} from '@/lib/services/vendas.service'

interface VendaFormProps {
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
  initialData?: any
  loteId?: string
  loteName?: string
}

const MODOS_PAGAMENTO = [
  { value: 'a_vista' as const, label: 'A Vista', icon: '💵', description: 'Pagamento imediato' },
  { value: 'prazo' as const, label: 'A Prazo', icon: '📅', description: 'Com data de vencimento' },
  { value: 'permuta' as const, label: 'Permuta', icon: '🔄', description: 'Troca por outros bens' },
]

export default function VendaForm({
  onSubmit,
  submitLabel = 'Registrar Venda',
  initialData,
  loteId,
  loteName
}: VendaFormProps) {
  const [formData, setFormData] = useState({
    data_venda: initialData?.data_venda || new Date().toISOString().split('T')[0],
    lote_id: loteId || initialData?.lote_id || '',
    quantidade_cabecas: initialData?.quantidade_cabecas?.toString() || '',
    peso_total_kg: initialData?.peso_total_kg?.toString() || '',
    preco_arroba_venda: initialData?.preco_arroba_venda?.toString() || '',
    custo_total: initialData?.custo_total?.toString() || '0',
    comprador: initialData?.comprador || '',
    observacoes: initialData?.observacoes || '',
    // Pagamento
    modo_pagamento: (initialData?.modo_pagamento || 'a_vista') as ModoPagamento,
    data_vencimento: initialData?.data_vencimento || '',
    valor_permuta: initialData?.valor_permuta?.toString() || '',
    descricao_permuta: initialData?.descricao_permuta || '',
    // Post Mortem
    post_mortem_data: initialData?.post_mortem_data || '',
    post_mortem_frigorifico: initialData?.post_mortem_frigorifico || '',
    post_mortem_rendimento_carcaca: initialData?.post_mortem_rendimento_carcaca?.toString() || '',
  })

  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [dadosLote, setDadosLote] = useState<DadosLoteParaVenda | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(!loteId)
  const [loadingDadosLote, setLoadingDadosLote] = useState(false)

  // Carregar lotes
  useEffect(() => {
    if (!loteId) {
      async function loadLotes() {
        try {
          const data = await getLotes()
          setLotes(data.filter(l => l.status === 'ativo'))
        } catch (error) {
          console.error('Erro ao carregar lotes:', error)
        } finally {
          setLoadingLotes(false)
        }
      }
      loadLotes()
    }
  }, [loteId])

  // Carregar dados completos do lote quando selecionar
  useEffect(() => {
    async function loadDadosLote() {
      const selectedLoteId = formData.lote_id || loteId
      if (!selectedLoteId) {
        setDadosLote(null)
        return
      }

      setLoadingDadosLote(true)
      try {
        const dados = await getDadosLoteParaVenda(selectedLoteId)
        if (dados) {
          setDadosLote(dados)
          // Auto-preencher campos se não tiver dados iniciais
          if (!initialData) {
            setFormData(prev => ({
              ...prev,
              quantidade_cabecas: dados.quantidade_animais.toString(),
              // Peso total: usar última pesagem se existir, senão deixar em branco
              peso_total_kg: dados.peso_total_kg > 0 ? dados.peso_total_kg.toString() : '',
              custo_total: dados.custo_total.toString()
            }))
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do lote:', error)
      } finally {
        setLoadingDadosLote(false)
      }
    }

    loadDadosLote()
  }, [formData.lote_id, loteId, initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleModoPagamentoChange = (modo: ModoPagamento) => {
    setFormData(prev => ({
      ...prev,
      modo_pagamento: modo,
      // Limpar campos relacionados ao mudar o modo
      data_vencimento: modo === 'prazo' ? prev.data_vencimento : '',
      valor_permuta: modo === 'permuta' ? prev.valor_permuta : '',
      descricao_permuta: modo === 'permuta' ? prev.descricao_permuta : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        lote_id: formData.lote_id || null,
        data_venda: formData.data_venda,
        quantidade_cabecas: parseInt(formData.quantidade_cabecas) || 0,
        peso_total_kg: parseFloat(formData.peso_total_kg) || 0,
        preco_arroba_venda: parseFloat(formData.preco_arroba_venda) || 0,
        custo_total: parseFloat(formData.custo_total) || 0,
        comprador: formData.comprador || null,
        observacoes: formData.observacoes || null,
        // Pagamento
        modo_pagamento: formData.modo_pagamento,
        data_vencimento: formData.modo_pagamento === 'prazo' ? formData.data_vencimento : null,
        valor_permuta: formData.modo_pagamento === 'permuta' ? parseFloat(formData.valor_permuta) || null : null,
        descricao_permuta: formData.modo_pagamento === 'permuta' ? formData.descricao_permuta : null,
        // Post Mortem
        post_mortem_data: formData.post_mortem_data || null,
        post_mortem_frigorifico: formData.post_mortem_frigorifico || null,
        post_mortem_rendimento_carcaca: formData.post_mortem_rendimento_carcaca
          ? parseFloat(formData.post_mortem_rendimento_carcaca)
          : null,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Calculos em tempo real
  const pesoKg = parseFloat(formData.peso_total_kg) || 0
  const pesoArrobas = kgToArrobas(pesoKg)
  const precoArroba = parseFloat(formData.preco_arroba_venda) || 0
  const valorVenda = pesoArrobas * precoArroba
  const custoTotal = parseFloat(formData.custo_total) || 0
  const lucroBruto = valorVenda - custoTotal
  const margem = custoTotal > 0 ? (lucroBruto / custoTotal) * 100 : 0
  const atingiuObjetivo = margem >= OBJETIVO_MARGEM
  const quantidadeCabecas = parseInt(formData.quantidade_cabecas) || 0
  const pesoMedioPorCabeca = quantidadeCabecas > 0 ? pesoKg / quantidadeCabecas : 0

  // Calcular indicador de progresso para margem
  const progressoMargem = Math.min((margem / OBJETIVO_MARGEM) * 100, 150) // Max 150%
  const corMargem = margem >= OBJETIVO_MARGEM
    ? 'bg-success'
    : margem >= OBJETIVO_MARGEM * 0.8
      ? 'bg-warning'
      : 'bg-error'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Se veio de um lote, mostrar badge */}
      {loteId && loteName && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs text-muted-foreground">Venda vinculada ao lote</p>
            <p className="font-semibold text-primary">{loteName}</p>
          </div>
        </div>
      )}

      {/* Card de dados do lote (quando selecionado) */}
      {dadosLote && (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="font-display text-lg">Dados do Lote: {dadosLote.lote_nome}</h3>
            </div>
            {loadingDadosLote && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Animais</p>
              <p className="font-mono font-bold text-lg">{dadosLote.quantidade_animais}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Peso Total</p>
              <p className="font-mono font-bold text-lg">{dadosLote.peso_total_kg.toLocaleString()} kg</p>
              <p className="text-xs text-primary">{dadosLote.peso_total_arrobas.toFixed(1)} @</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Custo Aquisição</p>
              <p className="font-mono font-bold text-lg text-error">{formatCurrency(dadosLote.custo_aquisicao)}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Custo Despesas</p>
              <p className="font-mono font-bold text-lg text-warning">{formatCurrency(dadosLote.custo_despesas)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-primary/20">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Investimento Total</p>
              <p className="font-mono font-bold text-xl text-primary">{formatCurrency(dadosLote.custo_total)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Custo/Cabeça</p>
              <p className="font-mono font-bold text-lg">{formatCurrency(dadosLote.custo_por_cabeca)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Custo/@</p>
              <p className="font-mono font-bold text-lg">{formatCurrency(dadosLote.custo_por_arroba)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Seção: Dados da Venda */}
      <div className="card-leather p-6 space-y-4">
        <h3 className="font-display text-xl border-b border-border pb-2">Dados da Venda</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Data da Venda <span className="text-error">*</span>
            </label>
            <input
              type="date"
              name="data_venda"
              value={formData.data_venda}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {!loteId && (
            <div>
              <label className="block text-sm font-semibold mb-2">
                Lote <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <select
                name="lote_id"
                value={formData.lote_id}
                onChange={handleChange}
                disabled={loadingLotes}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              >
                <option value="">Venda avulsa (sem lote)</option>
                {lotes.map(lote => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nome} ({lote.total_animais} animais)
                  </option>
                ))}
              </select>
              {loadingLotes && <p className="text-xs text-muted-foreground mt-1">Carregando lotes...</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Quantidade de Cabeças <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="quantidade_cabecas"
              value={formData.quantidade_cabecas}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              required
              min="1"
              placeholder="Ex: 50"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Comprador <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              name="comprador"
              value={formData.comprador}
              onChange={handleChange}
              placeholder="Nome do comprador/frigorífico"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Seção: Peso e Valores */}
      <div className="card-leather p-6 space-y-4">
        <h3 className="font-display text-xl border-b border-border pb-2">Peso e Valores</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Peso Total (kg) <span className="text-error">*</span>
              {dadosLote && dadosLote.peso_total_kg > 0 && (
                <span className="text-xs text-primary ml-2">(última pesagem)</span>
              )}
            </label>
            <input
              type="number"
              name="peso_total_kg"
              value={formData.peso_total_kg}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              required
              min="0"
              step="0.1"
              placeholder={dadosLote && dadosLote.peso_total_kg === 0 ? "Sem pesagem registrada" : "Ex: 25000"}
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {pesoKg > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                = <span className="font-semibold text-primary">{pesoArrobas.toFixed(2)} @</span>
                {pesoMedioPorCabeca > 0 && (
                  <span className="ml-2">({pesoMedioPorCabeca.toFixed(1)} kg/cab)</span>
                )}
              </p>
            )}
            {dadosLote && dadosLote.peso_total_kg === 0 && (
              <p className="text-xs text-warning mt-1">Nenhuma pesagem registrada para este lote</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Preço por @ (R$) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="preco_arroba_venda"
              value={formData.preco_arroba_venda}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              required
              min="0"
              step="0.01"
              placeholder="Ex: 320.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Custo Total (R$)
              {loadingDadosLote && <span className="text-xs text-muted-foreground ml-2">carregando...</span>}
            </label>
            <input
              type="number"
              name="custo_total"
              value={formData.custo_total}
              readOnly
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente (aquisição + despesas)</p>
          </div>
        </div>

        {/* Resumo Financeiro com Indicador de Margem Aprimorado */}
        {valorVenda > 0 && (
          <div className="mt-6 pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">VALOR TOTAL VENDA</p>
                <p className="font-mono font-bold text-xl text-primary">{formatCurrency(valorVenda)}</p>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">CUSTO TOTAL</p>
                <p className="font-mono font-bold text-xl text-error">{formatCurrency(custoTotal)}</p>
              </div>

              <div className={`rounded-lg p-4 text-center ${lucroBruto >= 0 ? 'bg-success/10' : 'bg-error/10'}`}>
                <p className="text-xs text-muted-foreground mb-1">LUCRO BRUTO</p>
                <p className={`font-mono font-bold text-xl ${lucroBruto >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(lucroBruto)}
                </p>
              </div>
            </div>

            {/* Indicador Visual de Margem */}
            <div className={`rounded-xl p-5 ${atingiuObjetivo ? 'bg-success/10 border-2 border-success' : 'bg-muted/30 border border-border'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{atingiuObjetivo ? '🎯' : '📈'}</span>
                  <div>
                    <p className="text-sm font-semibold">
                      {atingiuObjetivo ? 'OBJETIVO ATINGIDO!' : 'MARGEM DE LUCRO'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Meta: {OBJETIVO_MARGEM}% de margem
                    </p>
                  </div>
                </div>
                <div className={`font-mono font-bold text-3xl ${atingiuObjetivo ? 'text-success' : margem >= OBJETIVO_MARGEM * 0.8 ? 'text-warning' : 'text-error'}`}>
                  {margem.toFixed(1)}%
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                {/* Marcador do objetivo */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/50 z-10"
                  style={{ left: `${(100 / 150) * 100}%` }}
                />
                {/* Barra de progresso */}
                <div
                  className={`h-full ${corMargem} transition-all duration-500`}
                  style={{ width: `${progressoMargem}%` }}
                />
              </div>

              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-semibold">{OBJETIVO_MARGEM}% (Objetivo)</span>
                <span>{OBJETIVO_MARGEM * 1.5}%+</span>
              </div>

              {!atingiuObjetivo && custoTotal > 0 && (
                <div className="mt-3 p-3 bg-background/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Para atingir {OBJETIVO_MARGEM}% de margem, o valor mínimo de venda deveria ser:{' '}
                    <span className="font-semibold text-primary">
                      {formatCurrency(custoTotal * (1 + OBJETIVO_MARGEM / 100))}
                    </span>
                    {' '}(faltam {formatCurrency(custoTotal * (1 + OBJETIVO_MARGEM / 100) - valorVenda)})
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Seção: Modo de Pagamento */}
      <div className="card-leather p-6 space-y-4">
        <h3 className="font-display text-xl border-b border-border pb-2">Forma de Pagamento</h3>

        {/* Seletor de modo de pagamento */}
        <div className="grid grid-cols-3 gap-3">
          {MODOS_PAGAMENTO.map(modo => (
            <button
              key={modo.value}
              type="button"
              onClick={() => handleModoPagamentoChange(modo.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.modo_pagamento === modo.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-muted/30'
              }`}
            >
              <span className="text-2xl block mb-2">{modo.icon}</span>
              <p className="font-semibold text-sm">{modo.label}</p>
              <p className="text-xs text-muted-foreground">{modo.description}</p>
            </button>
          ))}
        </div>

        {/* Campos condicionais para pagamento a prazo */}
        {formData.modo_pagamento === 'prazo' && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-warning">
              <span className="text-xl">📅</span>
              <p className="font-semibold">Venda a Prazo</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Data de Vencimento <span className="text-error">*</span>
              </label>
              <input
                type="date"
                name="data_vencimento"
                value={formData.data_vencimento}
                onChange={handleChange}
                required={formData.modo_pagamento === 'prazo'}
                min={formData.data_venda}
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta venda será registrada em Contas a Receber
              </p>
            </div>
          </div>
        )}

        {/* Campos condicionais para permuta */}
        {formData.modo_pagamento === 'permuta' && (
          <div className="mt-4 p-4 bg-info/10 border border-info/30 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-info">
              <span className="text-xl">🔄</span>
              <p className="font-semibold">Venda em Permuta</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Valor dos Bens Recebidos (R$)
                </label>
                <input
                  type="number"
                  name="valor_permuta"
                  value={formData.valor_permuta}
                  onChange={handleChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Descrição da Permuta
                </label>
                <input
                  type="text"
                  name="descricao_permuta"
                  value={formData.descricao_permuta}
                  onChange={handleChange}
                  placeholder="Ex: 10 bezerros, 1 trator..."
                  className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção: Post Mortem */}
      <div className="card-leather p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="text-2xl">🩺</span>
          <h3 className="font-display text-xl">Post Mortem</h3>
          <span className="text-xs text-muted-foreground">(opcional - dados do frigorífico)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Data</label>
            <input
              type="date"
              name="post_mortem_data"
              value={formData.post_mortem_data}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Frigorífico</label>
            <input
              type="text"
              name="post_mortem_frigorifico"
              value={formData.post_mortem_frigorifico}
              onChange={handleChange}
              placeholder="Nome do frigorífico"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Rendimento de Carcaça (%)</label>
            <input
              type="number"
              name="post_mortem_rendimento_carcaca"
              value={formData.post_mortem_rendimento_carcaca}
              onChange={handleChange}
              onWheel={(e) => e.currentTarget.blur()}
              min="0"
              max="100"
              step="0.1"
              placeholder="Ex: 54.5"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Peso carcaça / Peso vivo x 100</p>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Observações <span className="text-muted-foreground text-xs">(opcional)</span>
        </label>
        <textarea
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={2}
          placeholder="Informações adicionais sobre a venda..."
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading || !formData.quantidade_cabecas || !formData.peso_total_kg || !formData.preco_arroba_venda || (formData.modo_pagamento === 'prazo' && !formData.data_vencimento)}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}
