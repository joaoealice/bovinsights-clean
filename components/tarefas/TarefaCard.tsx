'use client'

import { useState } from 'react'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Tarefa,
  completeTarefa,
  reopenTarefa,
  deleteTarefa,
  CATEGORY_ICONS,
  CATEGORY_COLORS
} from '@/lib/services/tarefas.service'
import TarefaEditModal from './TarefaEditModal'
import toast from 'react-hot-toast'

interface TarefaCardProps {
  tarefa: Tarefa
  onUpdate: () => void
}

export default function TarefaCard({ tarefa, onUpdate }: TarefaCardProps) {
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const dueDate = parseISO(tarefa.due_date)
  const isOverdue = tarefa.status === 'pending' && isPast(dueDate) && !isToday(dueDate)
  const isCompleted = tarefa.status === 'completed'

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      if (isCompleted) {
        await reopenTarefa(tarefa.id)
        toast.success('Tarefa reaberta')
      } else {
        await completeTarefa(tarefa.id)
        toast.success('Tarefa concluida!')
      }
      onUpdate()
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Erro ao atualizar tarefa')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

    setLoading(true)
    try {
      await deleteTarefa(tarefa.id)
      toast.success('Tarefa excluida')
      onUpdate()
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error)
      toast.error('Erro ao excluir tarefa')
    } finally {
      setLoading(false)
    }
  }

  const formatDueDate = () => {
    const dateStr = format(dueDate, "dd 'de' MMMM", { locale: ptBR })
    if (tarefa.due_time) {
      return `${dateStr} as ${tarefa.due_time.substring(0, 5)}`
    }
    return dateStr
  }

  return (
    <div
      className={`
        card-leather p-4 transition-all
        ${isCompleted ? 'opacity-60' : ''}
        ${isOverdue ? 'border-l-4 border-l-error' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className={`
            flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
            transition-all mt-0.5
            ${isCompleted
              ? 'bg-success border-success text-white'
              : 'border-muted-foreground hover:border-primary'
            }
          `}
        >
          {isCompleted && <span className="text-sm">✓</span>}
        </button>

        {/* Conteudo - clicavel para editar */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowEdit(true)}>
          <div className="flex items-center gap-2 mb-1">
            {/* Categoria */}
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1
              ${CATEGORY_COLORS[tarefa.category]}
            `}>
              <span>{CATEGORY_ICONS[tarefa.category]}</span>
              {tarefa.category}
            </span>

            {/* Badge atrasada */}
            {isOverdue && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-error/20 text-error">
                Atrasada
              </span>
            )}
          </div>

          {/* Titulo */}
          <h4 className={`
            font-semibold text-foreground
            ${isCompleted ? 'line-through text-muted-foreground' : ''}
          `}>
            {tarefa.title}
          </h4>

          {/* Descricao */}
          {tarefa.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {tarefa.description}
            </p>
          )}

          {/* Data */}
          <p className={`
            text-sm mt-2
            ${isOverdue ? 'text-error font-semibold' : 'text-muted-foreground'}
          `}>
            {formatDueDate()}
          </p>
        </div>

        {/* Botao excluir */}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-all"
          title="Excluir tarefa"
        >
          <span className="text-lg">🗑️</span>
        </button>
      </div>

      {/* Modal de edicao */}
      {showEdit && (
        <TarefaEditModal
          tarefa={tarefa}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); onUpdate() }}
        />
      )}
    </div>
  )
}
