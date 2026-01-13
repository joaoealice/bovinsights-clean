'use client'

import { useState, useEffect } from 'react'
import { Lote } from '@/lib/services/lotes.service'

interface LoteEntradaFormProps {
  initialData?: Partial<Lote>
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
}

export default function LoteEntradaForm({ initialData, onSubmit, submitLabel = 'Criar Lote' }: LoteEntradaFormProps) {
  const [formData, setFormData] = useState({
    // Informações do lote
    nome: initialData?.nome || '',
    capacidade_maxima: initialData?.capacidade_maxima || '',
    localizacao: initialData?.localizacao || '',
    tipo_lote: initialData?.tipo_lote || 'confinamento',
    status: initialData?.status || 'ativo',
    observacoes: initialData?.observacoes || '',
    // Entrada de animais
    data_entrada: initialData?.data_entrada || new Date().toISOString().split('T')[0],
    quantidade_total: initialData?.quantidade_total || '',
    peso_total_entrada: initialData?.peso_total_entrada || '',
    fornecedor: initialData?.fornecedor || '',
    // Custos
    preco_arroba_compra: initialData?.preco_arroba_compra || '',
    frete: initialData?.frete || '0',
    comissao: initialData?.comissao || '0',
  })
  const [loading, setLoading] = useState(false)
  const [calculos, setCalculos] = useState({
    pesoArrobas: 0,
    valorAnimais: 0,
    custoTotal: 0,
    custoPorCabeca: 0,
  })

  // Calcular valores automaticamente
  useEffect(() => {
    const pesoTotal = parseFloat(formData.peso_total_entrada as any) || 0
    const precoArroba = parseFloat(formData.preco_arroba_compra as any) || 0
    const frete = parseFloat(formData.frete as any) || 0
    const comissao = parseFloat(formData.comissao as any) || 0
    const qtdAnimais = parseInt(formData.quantidade_total as any) || 0

    if (pesoTotal > 0 && precoArroba > 0) {
      const pesoArrobas = pesoTotal / 30
      const valorAnimais = pesoArrobas * precoArroba
      const custoTotal = valorAnimais + frete + comissao
      const custoPorCabeca = qtdAnimais > 0 ? custoTotal / qtdAnimais : 0

      setCalculos({
        pesoArrobas: Math.round(pesoArrobas * 100) / 100,
        valorAnimais: Math.round(valorAnimais * 100) / 100,
        custoTotal: Math.round(custoTotal * 100) / 100,
        custoPorCabeca: Math.round(custoPorCabeca * 100) / 100,
      })
    } else {
      setCalculos({ pesoArrobas: 0, valorAnimais: 0, custoTotal: 0, custoPorCabeca: 0 })
    }
  }, [formData.peso_total_entrada, formData.preco_arroba_compra, formData.frete, formData.comissao, formData.quantidade_total])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        capacidade_maxima: parseInt(formData.capacidade_maxima as any) || 0,
        quantidade_total: parseInt(formData.quantidade_total as any) || 0,
        peso_total_entrada: parseFloat(formData.peso_total_entrada as any) || 0,
        preco_arroba_compra: parseFloat(formData.preco_arroba_compra as any) || 0,
        frete: parseFloat(formData.frete as any) || 0,
        comissao: parseFloat(formData.comissao as any) || 0,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* INFORMAÇÕES DO LOTE */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <span>📦</span> INFORMAÇÕES DO LOTE
        </h2>
        
        <div>
          <label className="block text-sm font-semibold mb-2">
            Nome do Lote <span className="text-error">*</span>
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder="Ex: Lote 01 - Confinamento Dez/2024"
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Tipo de Lote <span className="text-error">*</span>
            </label>
            <select
              name="tipo_lote"
              value={formData.tipo_lote}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="confinamento">Confinamento</option>
              <option value="pasto">Pasto</option>
              <option value="semiconfinamento">Semi-confinamento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Localização
            </label>
            <input
              type="text"
              name="localizacao"
              value={formData.localizacao}
              onChange={handleChange}
              placeholder="Ex: Pasto 3, Setor Norte"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Status <span className="text-error">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </div>
        </div>
      </div>

      {/* ENTRADA DE ANIMAIS */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <span>📥</span> ENTRADA DE ANIMAIS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Data de Entrada <span className="text-error">*</span>
            </label>
            <input
              type="date"
              name="data_entrada"
              value={formData.data_entrada}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Fornecedor
            </label>
            <input
              type="text"
              name="fornecedor"
              value={formData.fornecedor}
              onChange={handleChange}
              placeholder="Ex: Fazenda São José"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Quantidade de Animais <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="quantidade_total"
              value={formData.quantidade_total}
              onChange={handleChange}
              required
              min="1"
              placeholder="100"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Peso Total de Entrada (kg) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="peso_total_entrada"
              value={formData.peso_total_entrada}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="28500.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* CUSTOS */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <span>💰</span> CUSTOS DA OPERAÇÃO
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Preço @ Compra (R$) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              name="preco_arroba_compra"
              value={formData.preco_arroba_compra}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="245.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Frete (R$)
            </label>
            <input
              type="number"
              name="frete"
              value={formData.frete}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="2500.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Comissão (R$)
            </label>
            <input
              type="number"
              name="comissao"
              value={formData.comissao}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="1200.00"
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Capacidade movida para cá */}
        <div className="pt-4">
          <label className="block text-sm font-semibold mb-2">
            Capacidade Máxima do Lote <span className="text-error">*</span>
          </label>
          <input
            type="number"
            name="capacidade_maxima"
            value={formData.capacidade_maxima}
            onChange={handleChange}
            required
            min="1"
            placeholder="150"
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Defina uma capacidade maior que a quantidade de animais para permitir crescimento do lote
          </p>
        </div>
      </div>

      {/* CÁLCULO AUTOMÁTICO */}
      {calculos.custoTotal > 0 && (
        <div className="p-8 bg-primary/10 border-2 border-primary/30 rounded-xl space-y-4">
          <h2 className="font-display text-3xl flex items-center gap-3 text-primary">
            <span>📊</span> CÁLCULO AUTOMÁTICO
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Peso em Arrobas</p>
              <p className="font-display text-3xl">{calculos.pesoArrobas.toFixed(2)} @</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Valor dos Animais</p>
              <p className="font-display text-3xl text-success">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculos.valorAnimais)}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Custo Total</p>
              <p className="font-display text-3xl text-primary">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculos.custoTotal)}
              </p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Custo por Cabeça</p>
              <p className="font-display text-3xl text-primary">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(calculos.custoPorCabeca)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* OBSERVAÇÕES */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Observações
        </label>
        <textarea
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={4}
          placeholder="Informações adicionais sobre o lote..."
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* BOTÃO SUBMIT */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
