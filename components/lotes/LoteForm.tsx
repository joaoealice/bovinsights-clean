'use client'

import { useState, useEffect } from 'react'
import { Lote } from '@/lib/services/lotes.service'

interface LoteFormProps {
  initialData?: Partial<Lote>
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
}

export default function LoteForm({ initialData, onSubmit, submitLabel = 'Salvar' }: LoteFormProps) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    localizacao: initialData?.localizacao || '',
    tipo_lote: initialData?.tipo_lote || '',
    status: initialData?.status || 'ativo',
    observacoes: initialData?.observacoes || '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        localizacao: initialData.localizacao || '',
        tipo_lote: initialData.tipo_lote || '',
        status: initialData.status || 'ativo',
        observacoes: initialData.observacoes || '',
      })
    }
  }, [initialData])

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
        ...formData
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome */}
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
          placeholder="Ex: Lote 01 - Confinamento"
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Localização */}
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

      {/* Tipo e Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Tipo de Lote
          </label>
          <select
            name="tipo_lote"
            value={formData.tipo_lote}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="">Selecione...</option>
            <option value="confinamento">Confinamento</option>
            <option value="semiconfinamento">Semi Confinamento</option>
            <option value="pasto">Pasto</option>
            <option value="cria">Cria</option>
            <option value="recria">Recria</option>
            <option value="engorda">Engorda</option>
            <option value="reproducao">Reprodução</option>
            <option value="quarentena">Quarentena</option>
          </select>
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

      {/* Observações */}
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

      {/* Botão Submit */}
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
