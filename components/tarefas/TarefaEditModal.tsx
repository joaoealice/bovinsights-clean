'use client'

import { useState, useEffect } from 'react'
import { Tarefa, updateTarefa, TASK_CATEGORIES, TaskCategory } from '@/lib/services/tarefas.service'
import toast from 'react-hot-toast'

interface TarefaEditModalProps {
  tarefa: Tarefa
  onClose: () => void
  onSuccess: () => void
}

export default function TarefaEditModal({ tarefa, onClose, onSuccess }: TarefaEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: tarefa.title,
    description: tarefa.description || '',
    category: tarefa.category as TaskCategory,
    due_date: tarefa.due_date,
    due_time: tarefa.due_time || ''
  })

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

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
      await updateTarefa(tarefa.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        due_date: formData.due_date,
        due_time: formData.due_time || null
      })
      toast.success('Tarefa atualizada!')
      onSuccess()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card-leather p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl mb-6">EDITAR TAREFA</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Titulo *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field w-full"
              maxLength={255}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Descricao</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field w-full resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Categoria</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Data *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Hora</label>
              <input
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
