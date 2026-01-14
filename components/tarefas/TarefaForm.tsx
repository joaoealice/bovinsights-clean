'use client'

import { useState } from 'react'
import { createTarefa, TASK_CATEGORIES, TaskCategory } from '@/lib/services/tarefas.service'
import toast from 'react-hot-toast'

interface TarefaFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function TarefaForm({ onSuccess, onCancel }: TarefaFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Geral' as TaskCategory,
    due_date: '',
    due_time: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Informe o titulo da tarefa')
      return
    }

    if (!formData.due_date) {
      toast.error('Informe a data da tarefa')
      return
    }

    setLoading(true)
    try {
      await createTarefa({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        due_date: formData.due_date,
        due_time: formData.due_time || null
      })
      toast.success('Tarefa criada com sucesso!')
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      toast.error('Erro ao criar tarefa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-leather p-6">
      <h3 className="font-display text-2xl mb-6">NOVA TAREFA</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titulo */}
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            Titulo *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Vacinar lote de bezerros"
            className="input-field w-full"
            maxLength={255}
            autoFocus
          />
        </div>

        {/* Descricao */}
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            Descricao (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalhes adicionais sobre a tarefa..."
            className="input-field w-full resize-none"
            rows={3}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-semibold text-muted-foreground mb-2">
            Categoria
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
            className="input-field w-full"
          >
            {TASK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">
              Hora (opcional)
            </label>
            <input
              type="time"
              value={formData.due_time}
              onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
              className="input-field w-full"
            />
          </div>
        </div>

        {/* Botoes */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </form>
    </div>
  )
}
