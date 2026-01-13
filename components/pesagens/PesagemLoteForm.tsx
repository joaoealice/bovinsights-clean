'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAnimaisParaPesagem, createPesagemLoteAgregada } from '@/lib/services/pesagens.service'
import { formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Lote {
  id: string
  nome: string
  quantidade_animais: number // Animais identificados (cadastrados)
  quantidade_total?: number // Quantidade total do lote (referência principal)
  peso_medio_animal?: number // Peso médio atual do lote
}

interface AnimalPesagem {
  id: string
  brinco: string
  nome: string | null
  peso_atual: number | null
  ultima_pesagem?: string
  novo_peso: string
  selecionado?: boolean
}

interface PesagemLoteFormProps {
  loteId?: string
  // Callback para pesagem de animais individuais identificados
  onSubmitAnimais?: (pesagens: { animal_id: string; peso: number }[], dataPesagem: string, loteId: string, observacoes?: string) => Promise<void>
  // Callback para pesagem agregada do lote (sem animais cadastrados)
  onSubmitLoteAgregado?: (loteId: string, pesoTotal: number, quantidadeAnimais: number, dataPesagem: string, observacoes?: string) => Promise<void>
  submitLabel?: string
}

// Constante para conversao kg <-> arroba
const KG_POR_ARROBA = 15

// Tipos de modo de pesagem
type ModoPesagem = 'lote_inteiro' | 'animais_individuais'

export function PesagemLoteForm({
  loteId: initialLoteId,
  onSubmitAnimais,
  onSubmitLoteAgregado,
  submitLabel = 'Registrar Pesagens'
}: PesagemLoteFormProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [animais, setAnimais] = useState<AnimalPesagem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingAnimais, setLoadingAnimais] = useState(false)

  const [loteId, setLoteId] = useState(initialLoteId || '')
  const [dataPesagem, setDataPesagem] = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')

  // Estados para modo de pesagem
  const [modoPesagem, setModoPesagem] = useState<ModoPesagem>('lote_inteiro')

  // Estados para peso total (modo lote inteiro)
  const [pesoTotalLote, setPesoTotalLote] = useState('')
  const [qtdeAnimaisPesagem, setQtdeAnimaisPesagem] = useState('')
  const [showConfirmacaoQtde, setShowConfirmacaoQtde] = useState(false)

  // Estados para animais individuais
  const [animaisSelecionados, setAnimaisSelecionados] = useState<string[]>([])
  const [buscaAnimal, setBuscaAnimal] = useState('')

  useEffect(() => {
    loadLotes()
  }, [])

  useEffect(() => {
    if (loteId) {
      loadAnimais(loteId)
    } else {
      setAnimais([])
      setQtdeAnimaisPesagem('')
      setAnimaisSelecionados([])
    }
  }, [loteId])

  async function loadLotes() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar todos os lotes ativos com quantidade_total e peso_medio_animal
    const { data: todosLotes } = await supabase
      .from('lotes')
      .select('id, nome, quantidade_total, peso_medio_animal')
      .eq('usuario_id', user.id)
      .eq('status', 'ativo')
      .order('nome')

    if (todosLotes) {
      // Para cada lote, contar animais IDENTIFICADOS (cadastrados)
      const lotesComQtde = await Promise.all(
        todosLotes.map(async (lote) => {
          const { count } = await supabase
            .from('animais')
            .select('*', { count: 'exact', head: true })
            .eq('lote_id', lote.id)
            .eq('status', 'Ativo')

          return {
            ...lote,
            quantidade_animais: count || 0, // Animais identificados
            quantidade_total: lote.quantidade_total || 0, // Quantidade do lote (referência)
            peso_medio_animal: lote.peso_medio_animal || 0
          }
        })
      )
      setLotes(lotesComQtde)
    }
    setLoadingData(false)
  }

  async function loadAnimais(loteId: string) {
    setLoadingAnimais(true)
    try {
      // Buscar apenas animais IDENTIFICADOS (já cadastrados) - NÃO cria automaticamente
      const animaisData = await getAnimaisParaPesagem(loteId)

      setAnimais(animaisData.map(a => ({
        ...a,
        novo_peso: ''
      })))

      // A quantidade de referência vem do LOTE, não dos animais cadastrados
      const loteSel = lotes.find(l => l.id === loteId)
      const qtdReferencia = loteSel?.quantidade_total || animaisData.length
      setQtdeAnimaisPesagem(qtdReferencia.toString())
    } finally {
      setLoadingAnimais(false)
    }
  }

  // Calcular peso medio e arrobas
  const pesoTotalNum = parseFloat(pesoTotalLote) || 0
  const qtdeAnimaisNum = parseInt(qtdeAnimaisPesagem) || 0
  const pesoMedioCalculado = qtdeAnimaisNum > 0 ? pesoTotalNum / qtdeAnimaisNum : 0
  const arrobasTotal = pesoTotalNum / KG_POR_ARROBA
  const arrobasPorAnimal = qtdeAnimaisNum > 0 ? arrobasTotal / qtdeAnimaisNum : 0

  // Lote selecionado
  const loteSelecionado = lotes.find(l => l.id === loteId)

  // Verificar se quantidade confere com o lote (não com animais cadastrados)
  const qtdeDoLote = loteSelecionado?.quantidade_total || 0
  const qtdeConfere = qtdeAnimaisNum === qtdeDoLote || qtdeDoLote === 0

  // Verificar se há animais identificados no lote
  const temAnimaisIdentificados = animais.length > 0

  // Filtrar animais pela busca
  const animaisFiltrados = animais.filter(a =>
    a.brinco.toLowerCase().includes(buscaAnimal.toLowerCase()) ||
    (a.nome && a.nome.toLowerCase().includes(buscaAnimal.toLowerCase()))
  )

  // Toggle selecao de animal
  const toggleAnimal = (animalId: string) => {
    setAnimaisSelecionados(prev =>
      prev.includes(animalId)
        ? prev.filter(id => id !== animalId)
        : [...prev, animalId]
    )
  }

  // Selecionar todos os animais
  const selecionarTodos = () => {
    setAnimaisSelecionados(animais.map(a => a.id))
  }

  // Desselecionar todos
  const desselecionarTodos = () => {
    setAnimaisSelecionados([])
  }

  // Atualizar peso individual de um animal
  const atualizarPesoAnimal = (animalId: string, peso: string) => {
    setAnimais(prev =>
      prev.map(a =>
        a.id === animalId ? { ...a, novo_peso: peso } : a
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (modoPesagem === 'lote_inteiro') {
      // Modo Lote Inteiro - Pesagem AGREGADA (o Lote é o eixo central)
      if (!pesoTotalLote || !qtdeAnimaisPesagem) {
        alert('Informe o peso total e a quantidade de animais')
        return
      }

      // Verificar se quantidade confere com o lote
      if (!qtdeConfere && !showConfirmacaoQtde && qtdeDoLote > 0) {
        setShowConfirmacaoQtde(true)
        return
      }

      setLoading(true)
      try {
        // Usar pesagem agregada - funciona com ou sem animais cadastrados
        if (onSubmitLoteAgregado) {
          await onSubmitLoteAgregado(
            loteId,
            pesoTotalNum,
            qtdeAnimaisNum,
            dataPesagem,
            observacoes || undefined
          )
        } else {
          // Fallback: usar a função diretamente
          const resultado = await createPesagemLoteAgregada(
            loteId,
            pesoTotalNum,
            qtdeAnimaisNum,
            dataPesagem,
            observacoes || undefined
          )
          if (resultado.success) {
            toast.success(`Pesagem registrada! Peso medio: ${resultado.pesoMedio} kg/animal`)
          }
        }
      } finally {
        setLoading(false)
      }
    } else {
      // Modo Animais Individuais - apenas para animais IDENTIFICADOS
      if (!temAnimaisIdentificados) {
        alert('Nenhum animal identificado neste lote. Use o modo "Lote Inteiro" ou cadastre animais primeiro.')
        return
      }

      const animaisComPeso = animais.filter(a =>
        animaisSelecionados.includes(a.id) && a.novo_peso && parseFloat(a.novo_peso) > 0
      )

      if (animaisComPeso.length === 0) {
        alert('Selecione pelo menos um animal e informe o peso')
        return
      }

      const pesagens = animaisComPeso.map(a => ({
        animal_id: a.id,
        peso: parseFloat(a.novo_peso)
      }))

      setLoading(true)
      try {
        if (onSubmitAnimais) {
          await onSubmitAnimais(pesagens, dataPesagem, loteId, observacoes || undefined)
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleConfirmarQtdeDiferente = () => {
    setShowConfirmacaoQtde(false)
    // Resubmit
    const form = document.querySelector('form')
    if (form) form.requestSubmit()
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
          value={dataPesagem}
          onChange={(e) => setDataPesagem(e.target.value)}
          required
          className="w-full px-5 py-4 text-xl bg-background/50 border border-border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* SELECAO DE LOTE */}
      <div>
        <label className="block text-lg font-medium text-foreground mb-3">
          Selecione o Lote <span className="text-red-400">*</span>
        </label>
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          required
          disabled={!!initialLoteId}
          className="w-full px-5 py-4 text-xl bg-background/50 border border-border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Selecione um lote</option>
          {lotes.map(lote => (
            <option key={lote.id} value={lote.id}>
              {lote.nome} ({lote.quantidade_animais > 0 ? lote.quantidade_animais : lote.quantidade_total || 0} animais)
            </option>
          ))}
        </select>
      </div>

      {/* INFO DO LOTE SELECIONADO */}
      {loteId && loteSelecionado && (
        <div className="p-5 bg-background/30 rounded-xl border border-border">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-lg text-muted-foreground">Lote:</span>
              <span className="ml-3 text-xl font-medium text-foreground">{loteSelecionado.nome}</span>
            </div>
            <div className="flex gap-6">
              {/* Quantidade do Lote (referencia principal) */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{loteSelecionado.quantidade_total || 0}</div>
                <div className="text-sm text-muted-foreground">animais no lote</div>
              </div>
              {/* Animais identificados (opcional) */}
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{animais.length}</div>
                <div className="text-sm text-muted-foreground">identificados</div>
              </div>
              {/* Peso medio atual */}
              {loteSelecionado.peso_medio_animal && loteSelecionado.peso_medio_animal > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{loteSelecionado.peso_medio_animal} kg</div>
                  <div className="text-sm text-muted-foreground">peso medio atual</div>
                </div>
              )}
            </div>
          </div>
          {/* Aviso sobre animais identificados */}
          {animais.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-600">
                Nenhum animal identificado neste lote. A pesagem sera registrada de forma agregada (peso total / quantidade).
                Se desejar identificar animais individualmente, cadastre-os na secao Animais.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SELEÇÃO DE MODO DE PESAGEM */}
      {loteId && (
        <div className="p-6 bg-card rounded-xl border-2 border-primary/30">
          <h3 className="text-xl font-display text-foreground mb-4">
            Modo de Pesagem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção Lote Inteiro */}
            <button
              type="button"
              onClick={() => setModoPesagem('lote_inteiro')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                modoPesagem === 'lote_inteiro'
                  ? 'bg-primary/10 border-primary shadow-lg'
                  : 'bg-background/50 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🐄</span>
                <div>
                  <p className="font-bold text-lg text-foreground">Lote Inteiro</p>
                  <p className="text-sm text-muted-foreground">
                    Informar peso total e distribuir entre os animais
                  </p>
                </div>
              </div>
              {modoPesagem === 'lote_inteiro' && (
                <div className="mt-3 pt-3 border-t border-primary/30">
                  <span className="text-xs text-primary font-semibold">SELECIONADO</span>
                </div>
              )}
            </button>

            {/* Opção Animais Individuais */}
            <button
              type="button"
              onClick={() => setModoPesagem('animais_individuais')}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                modoPesagem === 'animais_individuais'
                  ? 'bg-primary/10 border-primary shadow-lg'
                  : 'bg-background/50 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏷️</span>
                <div>
                  <p className="font-bold text-lg text-foreground">Animais Individuais</p>
                  <p className="text-sm text-muted-foreground">
                    Selecionar animais e informar peso de cada um
                  </p>
                </div>
              </div>
              {modoPesagem === 'animais_individuais' && (
                <div className="mt-3 pt-3 border-t border-primary/30">
                  <span className="text-xs text-primary font-semibold">SELECIONADO</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PESO TOTAL E CONVERSAO - MODO LOTE INTEIRO */}
      {loteId && modoPesagem === 'lote_inteiro' && (
        <div className="space-y-6 p-6 bg-card rounded-xl border border-border">
          <h3 className="text-xl font-display text-foreground">
            Peso Total do Lote
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Peso em KG */}
            <div>
              <label className="block text-lg font-medium text-foreground mb-3">
                Peso Total (kg) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={pesoTotalLote}
                onChange={(e) => setPesoTotalLote(e.target.value)}
                min="0"
                step="0.1"
                placeholder="Ex: 4500"
                className="w-full px-5 py-4 text-2xl font-mono bg-background/50 border border-border rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Quantidade de Animais */}
            <div>
              <label className="block text-lg font-medium text-foreground mb-3">
                Quantidade de Animais <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={qtdeAnimaisPesagem}
                  onChange={(e) => setQtdeAnimaisPesagem(e.target.value)}
                  min="1"
                  className={`flex-1 px-5 py-4 text-2xl font-mono bg-background/50 border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    ${!qtdeConfere && qtdeAnimaisNum > 0 ? 'border-yellow-500' : 'border-border'}`}
                />
                {qtdeDoLote > 0 && qtdeAnimaisNum > 0 && (
                  <span className={`flex items-center px-4 rounded-xl text-base font-medium ${
                    qtdeConfere
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {qtdeConfere ? 'Confere' : `Lote: ${qtdeDoLote}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CONVERSOR DE ARROBAS */}
          {pesoTotalNum > 0 && (
            <div className="mt-6 p-5 bg-primary/10 rounded-xl">
              <div className="text-base text-muted-foreground mb-3">Conversao em Arrobas (@)</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-foreground">
                    {pesoTotalNum.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">kg total</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-primary">
                    {arrobasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">@ total</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-foreground">
                    {pesoMedioCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">kg/animal</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-3xl font-bold font-mono text-primary">
                    {arrobasPorAnimal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">@/animal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO ANIMAIS INDIVIDUAIS */}
      {loteId && modoPesagem === 'animais_individuais' && (
        <div className="space-y-6 p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display text-foreground">
              Selecionar Animais
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selecionarTodos}
                className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={desselecionarTodos}
                className="px-4 py-2 text-sm bg-muted/20 text-muted-foreground rounded-lg hover:bg-muted/30 transition-colors"
              >
                Limpar
              </button>
              <Link
                href={`/dashboard/animais/novo?lote=${loteId}`}
                className="px-4 py-2 text-sm bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Cadastrar Animal
              </Link>
            </div>
          </div>

          {/* Busca */}
          <div>
            <input
              type="text"
              value={buscaAnimal}
              onChange={(e) => setBuscaAnimal(e.target.value)}
              placeholder="Buscar por brinco ou nome..."
              className="w-full px-5 py-3 text-lg bg-background/50 border border-border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          {/* Info de seleção */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <span className="text-foreground">
              <span className="font-mono font-bold text-xl text-primary">{animaisSelecionados.length}</span>
              <span className="text-muted-foreground"> de {animais.length} animais selecionados</span>
            </span>
            {animaisSelecionados.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Preencha o peso de cada animal selecionado abaixo
              </span>
            )}
          </div>

          {/* Lista de animais */}
          {loadingAnimais ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
            </div>
          ) : animaisFiltrados.length === 0 ? (
            <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
              <p className="text-4xl mb-3">🐄</p>
              <p className="text-muted-foreground mb-2">Nenhum animal encontrado</p>
              <Link
                href={`/dashboard/animais/novo?lote=${loteId}`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Cadastrar novo animal
              </Link>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {animaisFiltrados.map((animal) => {
                const isSelected = animaisSelecionados.includes(animal.id)
                return (
                  <div
                    key={animal.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background/50 border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleAnimal(animal.id)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {isSelected && <span>✓</span>}
                      </button>

                      {/* Info do animal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{animal.brinco}</span>
                          {animal.nome && (
                            <span className="text-muted-foreground">- {animal.nome}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Peso atual: {animal.peso_atual ? `${animal.peso_atual} kg` : 'Não informado'}
                        </div>
                      </div>

                      {/* Campo de peso (só aparece se selecionado) */}
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Novo peso (kg)</label>
                            <input
                              type="number"
                              value={animal.novo_peso}
                              onChange={(e) => atualizarPesoAnimal(animal.id, e.target.value)}
                              min="0"
                              step="0.1"
                              placeholder="kg"
                              className="w-28 px-3 py-2 text-lg font-mono bg-background border border-border rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            />
                          </div>
                          {animal.novo_peso && parseFloat(animal.novo_peso) > 0 && (
                            <div className="text-center">
                              <label className="text-xs text-muted-foreground">Arroba</label>
                              <p className="font-mono text-lg text-primary font-bold">
                                {(parseFloat(animal.novo_peso) / 30).toFixed(2)} @
                              </p>
                            </div>
                          )}
                          {/* Botão para copiar peso atual */}
                          {animal.peso_atual && (
                            <button
                              type="button"
                              onClick={() => atualizarPesoAnimal(animal.id, animal.peso_atual!.toString())}
                              className="px-2 py-1 text-xs bg-muted/20 text-muted-foreground rounded hover:bg-muted/30"
                              title="Copiar peso atual"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Resumo dos animais selecionados com peso */}
          {animaisSelecionados.length > 0 && (
            <div className="mt-4 p-4 bg-success/10 rounded-xl border border-success/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Animais com peso preenchido</p>
                  <p className="font-mono font-bold text-2xl text-success">
                    {animais.filter(a => animaisSelecionados.includes(a.id) && a.novo_peso && parseFloat(a.novo_peso) > 0).length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Peso total</p>
                  <p className="font-mono font-bold text-2xl text-foreground">
                    {animais
                      .filter(a => animaisSelecionados.includes(a.id) && a.novo_peso)
                      .reduce((sum, a) => sum + (parseFloat(a.novo_peso) || 0), 0)
                      .toFixed(1)} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Arroba total</p>
                  <p className="font-mono font-bold text-2xl text-primary">
                    {(animais
                      .filter(a => animaisSelecionados.includes(a.id) && a.novo_peso)
                      .reduce((sum, a) => sum + (parseFloat(a.novo_peso) || 0), 0) / 30)
                      .toFixed(2)} @
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OBSERVACOES */}
      {loteId && (
        <div>
          <label className="block text-lg font-medium text-foreground mb-3">
            Observacoes
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Observacoes sobre esta pesagem em lote..."
            className="w-full px-5 py-4 text-lg bg-background/50 border border-border rounded-xl
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>
      )}

      {/* MODAL DE CONFIRMACAO */}
      {showConfirmacaoQtde && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-display text-foreground mb-4">
              Quantidade Diferente
            </h3>
            <p className="text-lg text-muted-foreground mb-4">
              Voce informou <span className="font-mono font-bold text-foreground">{qtdeAnimaisPesagem}</span> animais,
              mas o lote possui <span className="font-mono font-bold text-foreground">{qtdeDoLote}</span> animais cadastrados.
            </p>
            <p className="text-base text-muted-foreground mb-6">
              Deseja continuar com a quantidade informada ou ajustar?
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmacaoQtde(false)}
                className="flex-1 px-5 py-3 text-lg border border-border rounded-xl hover:bg-background/50 transition-colors"
              >
                Ajustar
              </button>
              <button
                type="button"
                onClick={handleConfirmarQtdeDiferente}
                className="flex-1 px-5 py-3 text-lg bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTAO SUBMIT */}
      <button
        type="submit"
        disabled={
          loading ||
          !loteId ||
          (modoPesagem === 'lote_inteiro' && (!pesoTotalLote || !qtdeAnimaisPesagem)) ||
          (modoPesagem === 'animais_individuais' && animaisSelecionados.length === 0)
        }
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
            {modoPesagem === 'lote_inteiro' && qtdeAnimaisNum > 0 && pesoMedioCalculado > 0 && (
              <span className="ml-2 font-mono">
                ({qtdeAnimaisNum} animais - {pesoMedioCalculado.toFixed(1)} kg/cab)
              </span>
            )}
            {modoPesagem === 'animais_individuais' && animaisSelecionados.length > 0 && (
              <span className="ml-2 font-mono">
                ({animais.filter(a => animaisSelecionados.includes(a.id) && a.novo_peso && parseFloat(a.novo_peso) > 0).length} animais)
              </span>
            )}
          </>
        )}
      </button>
    </form>
  )
}
