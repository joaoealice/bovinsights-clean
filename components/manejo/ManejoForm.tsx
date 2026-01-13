'use client'

import { useState, useEffect } from 'react'
import { TIPOS_MANEJO, VACINAS, TipoManejo, TipoAplicacao } from '@/lib/services/manejo.service'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import { getAnimaisParaSelecao } from '@/lib/services/animais.service'

interface ManejoFormProps {
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
  initialData?: any
  loteId?: string
  loteName?: string
}

interface AnimalOption {
  id: string
  brinco: string
  nome: string | null
}

export default function ManejoForm({
  onSubmit,
  submitLabel = 'Registrar Manejo',
  initialData,
  loteId,
  loteName
}: ManejoFormProps) {
  const [formData, setFormData] = useState({
    data_manejo: initialData?.data_manejo || new Date().toISOString().split('T')[0],
    tipo_aplicacao: (initialData?.tipo_aplicacao || 'lote_inteiro') as TipoAplicacao,
    tipo_manejo: (initialData?.tipo_manejo || '') as TipoManejo | '',
    descricao: initialData?.descricao || '',
    vincular_lote: loteId ? true : (initialData?.lote_id ? true : false),
    lote_id: loteId || initialData?.lote_id || '',
    animais_ids: initialData?.animais_ids || [] as string[],
    vacinas: initialData?.vacinas || [] as string[],
    observacoes: initialData?.observacoes || '',
  })

  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [animais, setAnimais] = useState<AnimalOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(!loteId)
  const [loadingAnimais, setLoadingAnimais] = useState(false)

  // Carregar lotes
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

  // Carregar animais quando selecionar tipo individual e lote
  useEffect(() => {
    if (formData.tipo_aplicacao === 'animais_individuais') {
      const loteParaBuscar = loteId || formData.lote_id
      if (loteParaBuscar) {
        setLoadingAnimais(true)
        getAnimaisParaSelecao(loteParaBuscar)
          .then(data => setAnimais(data))
          .catch(console.error)
          .finally(() => setLoadingAnimais(false))
      } else {
        // Carregar todos os animais se não tiver lote
        setLoadingAnimais(true)
        getAnimaisParaSelecao()
          .then(data => setAnimais(data))
          .catch(console.error)
          .finally(() => setLoadingAnimais(false))
      }
    }
  }, [formData.tipo_aplicacao, formData.lote_id, loteId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        ...(name === 'vincular_lote' && !checked ? { lote_id: '', animais_ids: [] } : {})
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Limpar animais selecionados se mudar o lote
        ...(name === 'lote_id' ? { animais_ids: [] } : {}),
        // Limpar vacinas se mudar tipo de manejo para algo diferente de vacinação
        ...(name === 'tipo_manejo' && value !== 'vacinacao' ? { vacinas: [] } : {})
      }))
    }
  }

  const handleVacinaChange = (vacina: string) => {
    setFormData(prev => ({
      ...prev,
      vacinas: prev.vacinas.includes(vacina)
        ? prev.vacinas.filter((v: string) => v !== vacina)
        : [...prev.vacinas, vacina]
    }))
  }

  const handleAnimalChange = (animalId: string) => {
    setFormData(prev => ({
      ...prev,
      animais_ids: prev.animais_ids.includes(animalId)
        ? prev.animais_ids.filter((id: string) => id !== animalId)
        : [...prev.animais_ids, animalId]
    }))
  }

  const selectAllAnimais = () => {
    setFormData(prev => ({
      ...prev,
      animais_ids: animais.map(a => a.id)
    }))
  }

  const deselectAllAnimais = () => {
    setFormData(prev => ({
      ...prev,
      animais_ids: []
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        data_manejo: formData.data_manejo,
        tipo_aplicacao: formData.tipo_aplicacao,
        tipo_manejo: formData.tipo_manejo as TipoManejo,
        descricao: formData.descricao,
        lote_id: (formData.vincular_lote || formData.tipo_aplicacao === 'lote_inteiro') && formData.lote_id ? formData.lote_id : (loteId || null),
        animais_ids: formData.tipo_aplicacao === 'animais_individuais' ? formData.animais_ids : null,
        vacinas: formData.tipo_manejo === 'vacinacao' ? formData.vacinas : null,
        observacoes: formData.observacoes || null,
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    if (!formData.tipo_manejo || !formData.descricao) return false
    if (formData.tipo_aplicacao === 'animais_individuais' && formData.animais_ids.length === 0) return false
    if (formData.tipo_manejo === 'vacinacao' && formData.vacinas.length === 0) return false
    return true
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Se veio de um lote, mostrar badge */}
      {loteId && loteName && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-2xl">📍</span>
          <div>
            <p className="text-xs text-muted-foreground">Manejo vinculado ao lote</p>
            <p className="font-semibold text-primary">{loteName}</p>
          </div>
        </div>
      )}

      {/* Linha 1: Data e Tipo de Aplicação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Data do Manejo <span className="text-error">*</span>
          </label>
          <input
            type="date"
            name="data_manejo"
            value={formData.data_manejo}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Aplicação <span className="text-error">*</span>
          </label>
          <select
            name="tipo_aplicacao"
            value={formData.tipo_aplicacao}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="lote_inteiro">Lote Inteiro</option>
            <option value="animais_individuais">Animais Individuais</option>
          </select>
        </div>
      </div>

      {/* Vincular a Lote - só mostra se não veio de um lote e for lote_inteiro */}
      {!loteId && formData.tipo_aplicacao === 'lote_inteiro' && (
        <div className="border border-border rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="vincular_lote"
              checked={formData.vincular_lote}
              onChange={handleChange}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-semibold">Vincular manejo a um lote específico?</span>
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

      {/* Seleção de Animais Individuais */}
      {formData.tipo_aplicacao === 'animais_individuais' && (
        <div className="border border-border rounded-lg p-4">
          {/* Seleção de Lote para filtrar animais */}
          {!loteId && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Filtrar por Lote <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <select
                name="lote_id"
                value={formData.lote_id}
                onChange={handleChange}
                disabled={loadingLotes}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
              >
                <option value="">Todos os animais</option>
                {lotes.map(lote => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nome} ({lote.total_animais} animais)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold">
              Selecionar Animais <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllAnimais}
                className="text-xs text-primary hover:underline"
              >
                Selecionar todos
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={deselectAllAnimais}
                className="text-xs text-muted-foreground hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>

          {loadingAnimais ? (
            <p className="text-center text-muted-foreground py-4">Carregando animais...</p>
          ) : animais.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhum animal encontrado</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-muted/10 rounded-lg">
              {animais.map(animal => (
                <label
                  key={animal.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    formData.animais_ids.includes(animal.id)
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.animais_ids.includes(animal.id)}
                    onChange={() => handleAnimalChange(animal.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-mono">{animal.brinco}</span>
                  {animal.nome && <span className="text-xs text-muted-foreground truncate">({animal.nome})</span>}
                </label>
              ))}
            </div>
          )}

          {formData.animais_ids.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {formData.animais_ids.length} animal(is) selecionado(s)
            </p>
          )}
        </div>
      )}

      {/* Tipo de Manejo */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Tipo de Manejo <span className="text-error">*</span>
        </label>
        <select
          name="tipo_manejo"
          value={formData.tipo_manejo}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        >
          <option value="">Selecione...</option>
          {TIPOS_MANEJO.map(tipo => (
            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
          ))}
        </select>
      </div>

      {/* Seleção de Vacinas - aparece quando tipo_manejo = vacinacao */}
      {formData.tipo_manejo === 'vacinacao' && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
          <label className="block text-sm font-semibold mb-3">
            Vacinas Aplicadas <span className="text-error">*</span>
          </label>

          <div className="space-y-2">
            {VACINAS.map(vacina => (
              <label
                key={vacina.value}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  formData.vacinas.includes(vacina.value)
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.vacinas.includes(vacina.value)}
                  onChange={() => handleVacinaChange(vacina.value)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="flex-1 font-medium">{vacina.label}</span>
                {vacina.obrigatoria && (
                  <span className="px-2 py-1 text-xs bg-warning/20 text-warning rounded-full font-semibold">
                    Obrigatoria
                  </span>
                )}
              </label>
            ))}
          </div>

          {formData.vacinas.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {formData.vacinas.length} vacina(s) selecionada(s)
            </p>
          )}
        </div>
      )}

      {/* Descrição */}
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
          placeholder="Ex: Aplicação de vermífugo Ivermectina 1%"
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

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
          placeholder="Informações adicionais sobre o manejo..."
          className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* Resumo */}
      {formData.tipo_manejo && (
        <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
          <p className="text-xs text-muted-foreground mb-2">RESUMO DO MANEJO</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
              {TIPOS_MANEJO.find(t => t.value === formData.tipo_manejo)?.label}
            </span>
            <span className="px-3 py-1 bg-muted/30 rounded-full text-sm">
              {formData.tipo_aplicacao === 'lote_inteiro' ? 'Lote Inteiro' : `${formData.animais_ids.length} Animal(is)`}
            </span>
            {formData.tipo_manejo === 'vacinacao' && formData.vacinas.length > 0 && (
              <span className="px-3 py-1 bg-success/20 text-success rounded-full text-sm">
                {formData.vacinas.length} vacina(s)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Botão Submit */}
      <button
        type="submit"
        disabled={loading || !isFormValid()}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}
