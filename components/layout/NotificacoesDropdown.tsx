'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isToday, isPast, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getTarefas, Tarefa, CATEGORY_ICONS } from '@/lib/services/tarefas.service'

interface Notificacao {
  id: string
  tipo: 'tarefa_hoje' | 'tarefa_atrasada'
  titulo: string
  subtitulo: string
  icon: string
  href: string
}

export default function NotificacoesDropdown() {
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotificacoes()
  }, [])

  const loadNotificacoes = async () => {
    try {
      const tarefas = await getTarefas()
      const alerts: Notificacao[] = []

      tarefas.forEach((tarefa) => {
        if (tarefa.status === 'completed') return

        const dueDate = parseISO(tarefa.due_date)
        const isAtrasada = isPast(dueDate) && !isToday(dueDate)
        const isHoje = isToday(dueDate)

        if (isAtrasada) {
          alerts.push({
            id: tarefa.id,
            tipo: 'tarefa_atrasada',
            titulo: tarefa.title,
            subtitulo: `Atrasada - ${format(dueDate, "dd/MM", { locale: ptBR })}`,
            icon: '⚠️',
            href: '/dashboard/tarefas'
          })
        } else if (isHoje) {
          alerts.push({
            id: tarefa.id,
            tipo: 'tarefa_hoje',
            titulo: tarefa.title,
            subtitulo: tarefa.due_time ? `Hoje as ${tarefa.due_time.substring(0, 5)}` : 'Hoje',
            icon: CATEGORY_ICONS[tarefa.category],
            href: '/dashboard/tarefas'
          })
        }
      })

      setNotificacoes(alerts)
    } catch (error) {
      console.error('Erro ao carregar notificacoes:', error)
    } finally {
      setLoading(false)
    }
  }

  const count = notificacoes.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-3 hover:bg-muted rounded-lg transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-error rounded-full text-sm flex items-center justify-center text-white font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border bg-muted/30">
              <h4 className="font-display text-lg">NOTIFICACOES</h4>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Carregando...</div>
              ) : notificacoes.length === 0 ? (
                <div className="p-6 text-center">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-muted-foreground text-sm">Nenhuma notificacao</p>
                </div>
              ) : (
                notificacoes.map((notif) => (
                  <Link
                    key={notif.id}
                    href={notif.href}
                    onClick={() => setOpen(false)}
                    className={`
                      flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0
                      ${notif.tipo === 'tarefa_atrasada' ? 'bg-error/5' : ''}
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{notif.titulo}</p>
                      <p className={`text-xs ${notif.tipo === 'tarefa_atrasada' ? 'text-error' : 'text-muted-foreground'}`}>
                        {notif.subtitulo}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {notificacoes.length > 0 && (
              <Link
                href="/dashboard/tarefas"
                onClick={() => setOpen(false)}
                className="block p-3 text-center text-sm text-primary hover:bg-muted/50 border-t border-border"
              >
                Ver todas as tarefas
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
