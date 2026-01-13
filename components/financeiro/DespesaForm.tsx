'use client'

import { useState, useEffect } from 'react'
import { CATEGORIAS_DESPESA, CategoriaDespesa } from '@/lib/services/financeiro.service'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'

interface DespesaFormProps {
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
  initialData?: any
  loteId?: string // Se passado, já vem vinculado ao lote
  loteName?: string // Nome do lote para exibir
}

export default function DespesaForm({
  onSubmit,
  submitLabel = 'Registrar Despesa',
  initialData,
  loteId,
  loteName
}: DespesaFormProps) {
  const [formData, setFormData] = useState({
    data_despesa: initialData?.data_despesa || new Date().toISOString().split('T')[0],
    categoria: initialData?.categoria || '',
    descricao: initialData?.descricao || '',
    valor: initialData?.valor?.toString() || '',
    vincular_lote: loteId ? true : (initialData?.lote_id ? true : false),
    lote_id: loteId || initialData?.lote_id || '',
    observacoes: initialData?.observacoes || '',
  })

  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(!loteId)

  // Carregar lotes apenas se não tiver loteId pré-definido
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'vincular_lote' && !checked ? { lote_id: '' } : {})
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        categoria: formData.categoria as CategoriaDespesa,
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        data_despesa: formData.data_despesa,
        lote_id: formData.vincular_lote && formData.lote_id ? formData.lote_id : null,
        observacoes: formData.observacoes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const valorNumerico = parseFloat(formData.valor) || 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Se veio de um lote, mostrar badge */}
      {loteId && loteName && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs text-muted-foreground">Despesa vinculada ao lote</p>
            <p className="font-semibold text-primary">{loteName}</p>
          </div>
        </div>
      )}

      {/* Linha 1: Data e Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Data <span className="text-error">*</span>
          </label>
          <input
            type="date"
            name="data_despesa"
            value={formData.data_despesa}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Tipo de Despesa <span className="text-error">*</span>
          </label>
          <select
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="">Selecione...</option>
            {CATEGORIAS_DESPESA.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Linha 2: Descrição */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Descrição <span className="text-error">*</span>
        </label>
        <input
          type="text"
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          required
          placeholder="Ex: Compra de sal mineral - 50kg"
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Linha 3: Valor */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Valor (R$) <span className="text-error">*</span>
        </label>
        <input
          type="number"
          name="valor"
          value={formData.valor}
          onChange={handleChange}
          required
          min="0.01"
          step="0.01"
          placeholder="0,00"
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-xl font-mono"
        />
      </div>

      {/* Vincular a Lote - só mostra se não veio de um lote */}
      {!loteId && (
        <div className="border-t border-border pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="vincular_lote"
              checked={formData.vincular_lote}
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-semibold">Vincular despesa a um lote específico?</span>
          </label>

          {formData.vincular_lote && (
            <div className="mt-4">
              <select
                name="lote_id"
                value={formData.lote_id}
                onChange={handleChange}
                required={formData.vincular_lote}
                disabled={loadingLotes}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              >
                <option value="">Selecione o lote...</option>
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
      )}

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
          placeholder="Informações adicionais..."
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* Resumo do Valor */}
      {valorNumerico > 0 && (
        <div className="bg-error/10 rounded-lg p-4 border border-error/30 text-center">
          <p className="text-xs text-muted-foreground mb-1">VALOR DA DESPESA</p>
          <p className="font-display text-3xl text-error">{formatCurrency(valorNumerico)}</p>
        </div>
      )}

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading || !formData.categoria || !formData.descricao || !formData.valor}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}
