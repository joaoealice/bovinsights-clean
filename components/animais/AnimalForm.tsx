'use client'

import { useState, useEffect, useCallback } from 'react'
import { RACAS, TIPOS_ANIMAL, RacaAnimal, TipoAnimal, SexoAnimal } from '@/lib/services/animais.service'
import { getLotes, getLoteById, LoteWithStats, Lote } from '@/lib/services/lotes.service'
import { createClient } from '@/lib/supabase/client'

interface AnimalFormProps {
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
  initialData?: any
  preSelectedLoteId?: string // Para quando vier da página do lote
}

export default function AnimalForm({ onSubmit, submitLabel = 'Identificar Animal', initialData, preSelectedLoteId }: AnimalFormProps) {
  const [formData, setFormData] = useState({
    brinco: initialData?.brinco || '',
    nome: initialData?.nome || '',
    sexo: initialData?.sexo || '',
    raca: initialData?.raca || '',
    tipo: initialData?.tipo || '',
    lote_id: initialData?.lote_id || preSelectedLoteId || '',
    data_entrada: initialData?.data_entrada || '',
    data_nascimento: initialData?.data_nascimento || '',
    idade_meses: initialData?.idade_meses || '',
    peso_entrada: initialData?.peso_entrada || '',
    mae_id: initialData?.mae_id || '',
    pai_id: initialData?.pai_id || '',
    observacoes: initialData?.observacoes || '',
  })

  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [selectedLote, setSelectedLote] = useState<LoteWithStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(true)
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [brincoError, setBrincoError] = useState<string | null>(null)
  const [checkingBrinco, setCheckingBrinco] = useState(false)

  // Carregar lotes
  useEffect(() => {
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
  }, [])

  // Carregar dados do lote selecionado e herdar valores
  useEffect(() => {
    async function loadLoteData() {
      if (formData.lote_id) {
        try {
          const lote = await getLoteById(formData.lote_id)
          if (lote) {
            setSelectedLote(lote)

            // Herdar dados do lote (apenas se não estiver editando)
            if (!initialData) {
              setFormData(prev => ({
                ...prev,
                data_entrada: lote.data_entrada || prev.data_entrada || new Date().toISOString().split('T')[0],
                peso_entrada: lote.peso_medio ? lote.peso_medio.toString() : prev.peso_entrada,
                tipo: mapTipoLoteToAnimal(lote.tipo_lote) || prev.tipo,
              }))
            }
          }
        } catch (error) {
          console.error('Erro ao carregar lote:', error)
        }
      } else {
        setSelectedLote(null)
      }
    }
    loadLoteData()
  }, [formData.lote_id, initialData])

  // Verificar duplicidade de brinco
  const checkBrincoDuplicado = useCallback(async (brinco: string, loteId: string) => {
    if (!brinco || !loteId) return

    setCheckingBrinco(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('animais')
        .select('id, brinco')
        .eq('lote_id', loteId)
        .eq('brinco', brinco)
        .maybeSingle()

      if (error) throw error

      if (data && (!initialData || data.id !== initialData.id)) {
        setBrincoError('Ja existe um animal com este brinco neste lote')
      } else {
        setBrincoError(null)
      }
    } catch (error) {
      console.error('Erro ao verificar brinco:', error)
    } finally {
      setCheckingBrinco(false)
    }
  }, [initialData])

  // Debounce para verificacao de brinco
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.brinco && formData.lote_id) {
        checkBrincoDuplicado(formData.brinco, formData.lote_id)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.brinco, formData.lote_id, checkBrincoDuplicado])

  // Mapear tipo do lote para tipo do animal
  function mapTipoLoteToAnimal(tipoLote?: string): TipoAnimal | '' {
    if (!tipoLote) return ''
    const mapping: Record<string, TipoAnimal> = {
      'engorda': 'Engorda',
      'terminacao': 'Terminação',
      'recria': 'Recria',
      'cria': 'Cria',
    }
    return mapping[tipoLote.toLowerCase()] || ''
  }

  // Calcular idade baseado na data de nascimento
  useEffect(() => {
    if (formData.data_nascimento && !formData.idade_meses) {
      const nascimento = new Date(formData.data_nascimento)
      const hoje = new Date()
      const diffTime = hoje.getTime() - nascimento.getTime()
      const meses = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44))
      setFormData(prev => ({ ...prev, idade_meses: meses.toString() }))
    }
  }, [formData.data_nascimento])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (brincoError) {
      alert('Corrija os erros antes de continuar.')
      return
    }

    setLoading(true)

    try {
      // Validar lote obrigatorio
      if (!formData.lote_id) {
        alert('Selecione um lote para vincular o animal.')
        return
      }

      await onSubmit({
        brinco: formData.brinco,
        nome: formData.nome || null,
        sexo: formData.sexo as SexoAnimal,
        raca: (formData.raca || 'Nelore') as RacaAnimal,
        tipo: (formData.tipo || 'Engorda') as TipoAnimal,
        lote_id: formData.lote_id,
        data_entrada: formData.data_entrada || selectedLote?.data_entrada || new Date().toISOString().split('T')[0],
        data_nascimento: formData.data_nascimento || null,
        idade_meses: parseInt(formData.idade_meses) || null,
        peso_entrada: parseFloat(formData.peso_entrada) || selectedLote?.peso_medio || 0,
        mae_id: formData.mae_id || null,
        pai_id: formData.pai_id || null,
        observacoes: formData.observacoes || null,
        status: 'Ativo'
      })
    } finally {
      setLoading(false)
    }
  }

  const pesoArrobas = formData.peso_entrada ? parseFloat(formData.peso_entrada) / 30 : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Aviso Explicativo */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">i</span>
          <div>
            <p className="font-semibold text-primary mb-1">Identificacao Individual de Animais</p>
            <p className="text-sm text-muted-foreground">
              Esta funcao serve para <strong>detalhar animais que ja existem no lote</strong>.
              A identificacao individual permite rastreabilidade e acompanhamento de performance,
              mas <strong>nao altera o financeiro do lote</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Secao 1: Lote (Obrigatorio) */}
      <div>
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</span>
          <span>Selecione o Lote</span>
        </h3>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Lote <span className="text-error">*</span>
          </label>
          <select
            name="lote_id"
            value={formData.lote_id}
            onChange={handleChange}
            required
            disabled={loadingLotes || lotes.length === 0 || !!preSelectedLoteId}
            className={`w-full px-4 py-3 rounded-lg border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 ${
              formData.lote_id
                ? 'bg-success/10 border-success/50'
                : 'bg-muted/30 border-border'
            }`}
          >
            <option value="">Selecione o lote...</option>
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>
                {lote.nome} ({lote.total_animais || 0} animais - {lote.peso_medio || 0} kg medio)
              </option>
            ))}
          </select>
          {loadingLotes && <p className="text-xs text-muted-foreground mt-1">Carregando lotes...</p>}
          {!loadingLotes && lotes.length === 0 && (
            <p className="text-xs text-error mt-1">
              Nenhum lote ativo encontrado. Crie um lote primeiro.
            </p>
          )}
        </div>

        {/* Dados Herdados do Lote */}
        {selectedLote && (
          <div className="mt-4 bg-muted/20 rounded-lg p-4 border border-border">
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Dados herdados do lote:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Data de entrada:</span>
                <p className="font-mono font-bold">{selectedLote.data_entrada || 'Nao informada'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Peso medio:</span>
                <p className="font-mono font-bold">{selectedLote.peso_medio || 0} kg</p>
              </div>
              <div>
                <span className="text-muted-foreground">Categoria:</span>
                <p className="font-mono font-bold">{selectedLote.tipo_lote || 'Nao informada'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Animais no lote:</span>
                <p className="font-mono font-bold">{selectedLote.total_animais || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secao 2: Identificacao Minima (Obrigatorio) */}
      <div>
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</span>
          <span>Identificacao do Animal</span>
        </h3>

        <div className="space-y-4">
          {/* Brinco */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Brinco / Identificador <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="brinco"
                value={formData.brinco}
                onChange={handleChange}
                required
                placeholder="Ex: 001, A-123, BR001"
                className={`w-full px-4 py-3 rounded-lg border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                  brincoError
                    ? 'bg-error/10 border-error'
                    : 'bg-muted/30 border-border'
                }`}
              />
              {checkingBrinco && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Verificando...
                </span>
              )}
            </div>
            {brincoError && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <span>!</span> {brincoError}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Numero do brinco, chip ou qualquer identificador unico do animal
            </p>
          </div>

          {/* Sexo e Raca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Sexo <span className="text-error">*</span>
              </label>
              <select
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecione...</option>
                <option value="Macho">Macho</option>
                <option value="Femea">Femea</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Raca
              </label>
              <select
                name="raca"
                value={formData.raca}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Herdar do lote (Nelore)</option>
                {RACAS.map(raca => (
                  <option key={raca.value} value={raca.value}>{raca.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Se nao informada, assume a raca padrao do lote
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo dos Dados que serao Salvos */}
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
        <p className="text-sm font-semibold mb-2">O animal sera criado com:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-success">ok</span>
            <span>Peso inicial: <strong>{formData.peso_entrada || selectedLote?.peso_medio || 0} kg</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">ok</span>
            <span>Data entrada: <strong>{formData.data_entrada || selectedLote?.data_entrada || 'Hoje'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">ok</span>
            <span>Vinculado ao: <strong>{selectedLote?.nome || 'Lote'}</strong></span>
          </div>
        </div>
      </div>

      {/* Secao 3: Detalhes Opcionais (Expansivel) */}
      <div>
        <button
          type="button"
          onClick={() => setShowDetalhes(!showDetalhes)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 border border-border rounded-lg hover:bg-muted/30 transition-all"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl">{showDetalhes ? '-' : '+'}</span>
            <span className="font-semibold">Detalhar mais informacoes</span>
            <span className="text-xs text-muted-foreground">(opcional)</span>
          </span>
          <span className="text-muted-foreground">
            {showDetalhes ? 'Recolher' : 'Expandir'}
          </span>
        </button>

        {showDetalhes && (
          <div className="mt-4 p-4 border border-border rounded-lg space-y-4 bg-muted/10">
            {/* Nome / Apelido */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Nome / Apelido
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Mimosa, Trovao"
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Categoria e Idade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Categoria
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">Herdar do lote</option>
                  {TIPOS_ANIMAL.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="data_nascimento"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Idade (meses)
                </label>
                <input
                  type="number"
                  name="idade_meses"
                  value={formData.idade_meses}
                  onChange={handleChange}
                  min="0"
                  placeholder="Ex: 24"
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
                {formData.idade_meses && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Aproximadamente {(parseInt(formData.idade_meses) / 12).toFixed(1)} anos
                  </p>
                )}
              </div>
            </div>

            {/* Peso Individual (se diferente do lote) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Peso de Entrada Individual (kg)
              </label>
              <input
                type="number"
                name="peso_entrada"
                value={formData.peso_entrada}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder={`Padrao: ${selectedLote?.peso_medio || 0} kg (media do lote)`}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {formData.peso_entrada && (
                <p className="text-sm text-muted-foreground mt-1">
                  = <span className="font-mono font-bold text-primary">{pesoArrobas.toFixed(2)}</span> arrobas (@)
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco para usar o peso medio do lote
              </p>
            </div>

            {/* Filiacao */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Mae (ID ou Brinco)
                </label>
                <input
                  type="text"
                  name="mae_id"
                  value={formData.mae_id}
                  onChange={handleChange}
                  placeholder="Identificacao da mae"
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Pai (ID ou Brinco)
                </label>
                <input
                  type="text"
                  name="pai_id"
                  value={formData.pai_id}
                  onChange={handleChange}
                  placeholder="Identificacao do pai"
                  className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Observacoes */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Observacoes
              </label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                placeholder="Informacoes adicionais sobre o animal..."
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Botao Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || !!brincoError || !formData.lote_id || !formData.brinco || !formData.sexo}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>

      {/* Dica Final */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Apos identificar, o animal herdara automaticamente o historico de pesagens e manejos do lote.</p>
      </div>
    </form>
  )
}
