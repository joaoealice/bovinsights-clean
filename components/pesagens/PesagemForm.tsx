'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pesagem } from '@/lib/services/pesagens.service'

interface Animal {
  id: string
  brinco: string
  nome: string | null
  lote_id: string | null
  peso_atual?: number | null
}

interface Lote {
  id: string
  nome: string
}

interface PesagemFormProps {
  initialData?: Partial<Pesagem>
  animalId?: string
  onSubmit: (data: Partial<Pesagem>) => Promise<void>
  submitLabel?: string
}

// Hook de debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function PesagemForm({
  initialData,
  animalId,
  onSubmit,
  submitLabel = 'Registrar Pesagem'
}: PesagemFormProps) {
  const [loading, setLoading] = useState(false)
  const [animais, setAnimais] = useState<Animal[]>([])
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Estados para busca rapida
  const [buscaBrinco, setBuscaBrinco] = useState('')
  const [showSugestoes, setShowSugestoes] = useState(false)
  const [sugestoes, setSugestoes] = useState<Animal[]>([])
  const [loadingBusca, setLoadingBusca] = useState(false)
  const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(null)
  const [showCadastroRapido, setShowCadastroRapido] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sugestoesRef = useRef<HTMLDivElement>(null)
  const pesoInputRef = useRef<HTMLInputElement>(null)

  // Debounce da busca
  const buscaDebounced = useDebounce(buscaBrinco, 150)

  const [formData, setFormData] = useState({
    animal_id: animalId || initialData?.animal_id || '',
    lote_id: initialData?.lote_id || '',
    peso: initialData?.peso?.toString() || '',
    data_pesagem: initialData?.data_pesagem || new Date().toISOString().split('T')[0],
    observacoes: initialData?.observacoes || ''
  })

  useEffect(() => {
    loadData()
  }, [])

  // Efeito para buscar animais conforme digita
  useEffect(() => {
    if (buscaDebounced && buscaDebounced.length >= 1 && !animalSelecionado) {
      buscarAnimais(buscaDebounced)
    } else if (!buscaDebounced) {
      setSugestoes([])
    }
  }, [buscaDebounced, animalSelecionado])

  // Fechar sugestoes ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sugestoesRef.current &&
        !sugestoesRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSugestoes(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadData() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Carregar lotes
    const { data: lotesData } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('usuario_id', user.id)
      .eq('status', 'ativo')
      .order('nome')

    if (lotesData) setLotes(lotesData)

    // Carregar animais
    const { data: animaisData } = await supabase
      .from('animais')
      .select('id, brinco, nome, lote_id, peso_atual')
      .eq('usuario_id', user.id)
      .eq('status', 'Ativo')
      .order('brinco')

    if (animaisData) {
      setAnimais(animaisData)

      // Se tiver animalId, buscar e setar o animal selecionado
      if (animalId) {
        const animal = animaisData.find(a => a.id === animalId)
        if (animal) {
          setAnimalSelecionado(animal)
          setBuscaBrinco(animal.brinco)
        }
      }
    }

    setLoadingData(false)
  }

  // Buscar animais por brinco (busca rapida)
  async function buscarAnimais(termo: string) {
    setLoadingBusca(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('animais')
        .select('id, brinco, nome, lote_id, peso_atual')
        .eq('usuario_id', user.id)
        .eq('status', 'Ativo')
        .or(`brinco.ilike.%${termo}%,nome.ilike.%${termo}%`)
        .order('brinco')
        .limit(10)

      if (data) {
        setSugestoes(data)
        setShowSugestoes(true)
      }
    } finally {
      setLoadingBusca(false)
    }
  }

  // Selecionar animal da lista
  function selecionarAnimal(animal: Animal) {
    setAnimalSelecionado(animal)
    setBuscaBrinco(animal.brinco)
    setShowSugestoes(false)
    setFormData(prev => ({
      ...prev,
      animal_id: animal.id,
      lote_id: animal.lote_id || ''
    }))

    // Focar no campo de peso para agilizar
    setTimeout(() => {
      pesoInputRef.current?.focus()
    }, 100)
  }

  // Limpar selecao
  function limparSelecao() {
    setAnimalSelecionado(null)
    setBuscaBrinco('')
    setFormData(prev => ({
      ...prev,
      animal_id: '',
      lote_id: ''
    }))
    inputRef.current?.focus()
  }

  // Handler para teclas no input de busca
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setShowSugestoes(false)
    }
    if (e.key === 'Enter' && sugestoes.length === 1) {
      e.preventDefault()
      selecionarAnimal(sugestoes[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        animal_id: formData.animal_id,
        lote_id: formData.lote_id || undefined,
        peso: parseFloat(formData.peso),
        data_pesagem: formData.data_pesagem,
        observacoes: formData.observacoes || undefined
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* DATA DA PESAGEM - PRIMEIRO */}
      <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
        <label className="block text-lg font-medium text-foreground mb-3">
          Data da Pesagem <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          name="data_pesagem"
          value={formData.data_pesagem}
          onChange={handleChange}
          required
          className="w-full px-5 py-4 text-xl bg-background/50 border border-border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <p className="text-base text-muted-foreground mt-2">
          Defina a data uma vez e registre varias pesagens
        </p>
      </div>

      {/* BUSCA DE ANIMAL */}
      <div className="space-y-4">
        <label className="block text-lg font-medium text-foreground">
          Animal <span className="text-red-400">*</span>
        </label>

        {animalSelecionado && !animalId ? (
          // Animal selecionado - mostrar card grande
          <div className="flex items-center gap-4 p-5 bg-primary/10 border-2 border-primary/30 rounded-xl">
            <div className="flex-1">
              <div className="text-2xl font-mono font-bold text-foreground">
                {animalSelecionado.brinco}
              </div>
              {animalSelecionado.nome && (
                <div className="text-lg text-muted-foreground mt-1">
                  {animalSelecionado.nome}
                </div>
              )}
              {animalSelecionado.peso_atual && (
                <div className="text-base text-muted-foreground mt-2">
                  Peso atual: <span className="font-mono font-medium">{animalSelecionado.peso_atual} kg</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={limparSelecao}
              className="p-3 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-xl transition-colors"
              title="Limpar selecao"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          // Campo de busca
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={buscaBrinco}
              onChange={(e) => {
                setBuscaBrinco(e.target.value)
                if (animalSelecionado) {
                  setAnimalSelecionado(null)
                  setFormData(prev => ({ ...prev, animal_id: '' }))
                }
              }}
              onFocus={() => {
                if (sugestoes.length > 0) setShowSugestoes(true)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite o brinco ou nome..."
              disabled={!!animalId}
              autoComplete="off"
              className="w-full px-5 py-4 text-xl bg-background/50 border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Indicador de loading */}
            {loadingBusca && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
              </div>
            )}

            {/* Lista de sugestoes */}
            {showSugestoes && (
              <div
                ref={sugestoesRef}
                className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto"
              >
                {sugestoes.length > 0 ? (
                  sugestoes.map((animal, index) => (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => selecionarAnimal(animal)}
                      className={`w-full px-5 py-4 text-left hover:bg-primary/10 transition-colors flex items-center justify-between
                        ${index === 0 ? 'rounded-t-xl' : ''}
                        ${index === sugestoes.length - 1 ? 'rounded-b-xl' : 'border-b border-border/50'}`}
                    >
                      <div>
                        <div className="text-xl font-mono font-medium text-foreground">
                          {animal.brinco}
                        </div>
                        {animal.nome && (
                          <div className="text-base text-muted-foreground">
                            {animal.nome}
                          </div>
                        )}
                      </div>
                      {animal.peso_atual && (
                        <span className="text-lg font-mono text-muted-foreground">
                          {animal.peso_atual} kg
                        </span>
                      )}
                    </button>
                  ))
                ) : buscaBrinco.length >= 1 && !loadingBusca ? (
                  // Nenhum animal encontrado
                  <div className="p-5">
                    <p className="text-lg text-muted-foreground mb-4">
                      Nenhum animal encontrado com "{buscaBrinco}"
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCadastroRapido(true)}
                      className="w-full px-5 py-4 text-lg bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Cadastrar animal "{buscaBrinco}"
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        <p className="text-base text-muted-foreground">
          Digite o brinco para busca rapida - Enter seleciona resultado unico
        </p>
      </div>

      {/* Modal de Cadastro Rapido */}
      {showCadastroRapido && (
        <CadastroRapidoAnimal
          brincoInicial={buscaBrinco}
          lotes={lotes}
          onClose={() => setShowCadastroRapido(false)}
          onCadastrado={(animal) => {
            selecionarAnimal(animal)
            setShowCadastroRapido(false)
          }}
        />
      )}

      {/* Lote (auto-preenchido) */}
      {formData.lote_id && (
        <div className="p-4 bg-background/30 rounded-xl">
          <span className="text-base text-muted-foreground">Lote: </span>
          <span className="text-lg font-medium text-foreground">
            {lotes.find(l => l.id === formData.lote_id)?.nome || 'Sem lote'}
          </span>
        </div>
      )}

      {/* PESO */}
      <div>
        <label className="block text-lg font-medium text-foreground mb-3">
          Peso (kg) <span className="text-red-400">*</span>
        </label>
        <input
          ref={pesoInputRef}
          type="number"
          name="peso"
          value={formData.peso}
          onChange={handleChange}
          required
          min="0"
          step="0.1"
          placeholder="Ex: 450.5"
          className="w-full px-5 py-4 text-2xl font-mono bg-background/50 border border-border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* OBSERVACOES */}
      <div>
        <label className="block text-lg font-medium text-foreground mb-3">
          Observacoes
        </label>
        <textarea
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={3}
          placeholder="Observacoes sobre a pesagem..."
          className="w-full px-5 py-4 text-lg bg-background/50 border border-border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
        />
      </div>

      {/* BOTAO SUBMIT */}
      <button
        type="submit"
        disabled={loading || !formData.animal_id || !formData.peso}
        className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3
          disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
      >
        {loading ? (
          <>
            <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
            Salvando...
          </>
        ) : (
          <>
            <span className="text-2xl">⚖️</span>
            {submitLabel}
          </>
        )}
      </button>
    </form>
  )
}

// Componente de Cadastro Rapido de Animal
interface CadastroRapidoAnimalProps {
  brincoInicial: string
  lotes: Lote[]
  onClose: () => void
  onCadastrado: (animal: Animal) => void
}

function CadastroRapidoAnimal({
  brincoInicial,
  lotes,
  onClose,
  onCadastrado
}: CadastroRapidoAnimalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brinco: brincoInicial,
    nome: '',
    sexo: '' as 'Macho' | 'Fêmea' | '',
    lote_id: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario nao autenticado')

      const { data, error } = await supabase
        .from('animais')
        .insert({
          usuario_id: user.id,
          brinco: formData.brinco,
          nome: formData.nome || null,
          sexo: formData.sexo || null,
          lote_id: formData.lote_id || null,
          status: 'Ativo'
        })
        .select('id, brinco, nome, lote_id, peso_atual')
        .single()

      if (error) throw error

      onCadastrado(data)
    } catch (error: any) {
      alert(error.message || 'Erro ao cadastrar animal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-8 max-w-lg w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-foreground">
            Cadastro Rapido de Animal
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Brinco <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.brinco}
              onChange={(e) => setFormData(prev => ({ ...prev, brinco: e.target.value }))}
              required
              className="w-full px-4 py-3 text-lg bg-background/50 border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-2">
              Nome (opcional)
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome do animal"
              className="w-full px-4 py-3 text-lg bg-background/50 border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                Sexo
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value as 'Macho' | 'Fêmea' | '' }))}
                className="w-full px-4 py-3 text-lg bg-background/50 border border-border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecione</option>
                <option value="Macho">Macho</option>
                <option value="Fêmea">Femea</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                Lote
              </label>
              <select
                value={formData.lote_id}
                onChange={(e) => setFormData(prev => ({ ...prev, lote_id: e.target.value }))}
                className="w-full px-4 py-3 text-lg bg-background/50 border border-border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Sem lote</option>
                {lotes.map(lote => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 text-lg border border-border rounded-xl hover:bg-background/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.brinco}
              className="flex-1 px-5 py-3 text-lg bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Cadastrar e Usar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
