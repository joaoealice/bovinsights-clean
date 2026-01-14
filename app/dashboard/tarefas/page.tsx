'use client'

import { useEffect, useState, useCallback } from 'react'
import { isToday, isFuture, isPast, parseISO } from 'date-fns'
import { getTarefas, Tarefa } from '@/lib/services/tarefas.service'
import TarefaForm from '@/components/tarefas/TarefaForm'
import TarefaCard from '@/components/tarefas/TarefaCard'
import toast from 'react-hot-toast'

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadTarefas = useCallback(async () => {
    try {
      const data = await getTarefas()
      setTarefas(data)
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
      toast.error('Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTarefas()
  }, [loadTarefas])

  const handleFormSuccess = () => {
    setShowForm(false)
    loadTarefas()
  }

  // Separar tarefas por grupo
  const tarefasHoje: Tarefa[] = []
  const tarefasProximas: Tarefa[] = []
  const tarefasConcluidas: Tarefa[] = []

  tarefas.forEach((tarefa) => {
    if (tarefa.status === 'completed') {
      tarefasConcluidas.push(tarefa)
    } else {
      const dueDate = parseISO(tarefa.due_date)
      if (isToday(dueDate)) {
        tarefasHoje.push(tarefa)
      } else if (isFuture(dueDate)) {
        tarefasProximas.push(tarefa)
      } else if (isPast(dueDate)) {
        // Atrasadas aparecem em "Hoje" para destaque
        tarefasHoje.push(tarefa)
      }
    }
  })

  // Ordenar: atrasadas primeiro em "Hoje"
  tarefasHoje.sort((a, b) => {
    const aDate = parseISO(a.due_date)
    const bDate = parseISO(b.due_date)
    const aOverdue = isPast(aDate) && !isToday(aDate)
    const bOverdue = isPast(bDate) && !isToday(bDate)
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    return aDate.getTime() - bDate.getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">TAREFAS</h1>
          <p className="text-muted-foreground">
            Gerencie suas atividades e lembretes
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <TarefaForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Lista vazia */}
      {tarefas.length === 0 && !showForm && (
        <div className="card-leather p-12 text-center">
          <span className="text-6xl block mb-4">📋</span>
          <h3 className="font-display text-2xl mb-2">NENHUMA TAREFA</h3>
          <p className="text-muted-foreground mb-6">
            Voce ainda nao tem tarefas cadastradas. Crie sua primeira tarefa para comecar!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Criar primeira tarefa
          </button>
        </div>
      )}

      {/* Secao: Hoje */}
      {tarefasHoje.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <span>🔔</span> HOJE
            {tarefasHoje.some(t => isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))) && (
              <span className="text-sm font-normal text-error">(inclui atrasadas)</span>
            )}
          </h2>
          <div className="space-y-3">
            {tarefasHoje.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                onUpdate={loadTarefas}
              />
            ))}
          </div>
        </section>
      )}

      {/* Secao: Proximas */}
      {tarefasProximas.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <span>📆</span> PROXIMAS
          </h2>
          <div className="space-y-3">
            {tarefasProximas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                onUpdate={loadTarefas}
              />
            ))}
          </div>
        </section>
      )}

      {/* Secao: Concluidas */}
      {tarefasConcluidas.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <span>✅</span> CONCLUIDAS
          </h2>
          <div className="space-y-3">
            {tarefasConcluidas.map((tarefa) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                onUpdate={loadTarefas}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
