import { createClient } from '@/lib/supabase/client'

export type TaskCategory = 'Manejo' | 'Pesagem' | 'Sanidade' | 'Financeiro' | 'Geral'
export type TaskStatus = 'pending' | 'completed'

export interface Tarefa {
  id: string
  user_id: string
  title: string
  description: string | null
  category: TaskCategory
  due_date: string
  due_time: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface CreateTarefaData {
  title: string
  description?: string | null
  category?: TaskCategory
  due_date: string
  due_time?: string | null
}

export interface UpdateTarefaData {
  title?: string
  description?: string | null
  category?: TaskCategory
  due_date?: string
  due_time?: string | null
  status?: TaskStatus
}

// Listar todas as tarefas do usuario
export async function getTarefas(): Promise<Tarefa[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario nao autenticado')

  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
    .order('due_time', { ascending: true, nullsFirst: false })

  if (error) throw error
  return data || []
}

// Buscar tarefa por ID
export async function getTarefaById(id: string): Promise<Tarefa | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Criar nova tarefa
export async function createTarefa(tarefaData: CreateTarefaData): Promise<Tarefa> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario nao autenticado')

  const { data, error } = await supabase
    .from('tarefas')
    .insert({
      user_id: user.id,
      title: tarefaData.title,
      description: tarefaData.description || null,
      category: tarefaData.category || 'Geral',
      due_date: tarefaData.due_date,
      due_time: tarefaData.due_time || null,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Atualizar tarefa
export async function updateTarefa(id: string, tarefaData: UpdateTarefaData): Promise<Tarefa> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tarefas')
    .update(tarefaData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Marcar tarefa como concluida
export async function completeTarefa(id: string): Promise<Tarefa> {
  return updateTarefa(id, { status: 'completed' })
}

// Reabrir tarefa (voltar para pendente)
export async function reopenTarefa(id: string): Promise<Tarefa> {
  return updateTarefa(id, { status: 'pending' })
}

// Deletar tarefa
export async function deleteTarefa(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Categorias disponiveis
export const TASK_CATEGORIES: TaskCategory[] = [
  'Manejo',
  'Pesagem',
  'Sanidade',
  'Financeiro',
  'Geral'
]

// Icones por categoria
export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  'Manejo': '🐮',
  'Pesagem': '⚖️',
  'Sanidade': '💉',
  'Financeiro': '💰',
  'Geral': '📋'
}

// Cores por categoria (classes Tailwind)
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  'Manejo': 'bg-amber-500/20 text-amber-600',
  'Pesagem': 'bg-blue-500/20 text-blue-600',
  'Sanidade': 'bg-green-500/20 text-green-600',
  'Financeiro': 'bg-purple-500/20 text-purple-600',
  'Geral': 'bg-gray-500/20 text-gray-600'
}
