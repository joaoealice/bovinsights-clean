'use client'

import { useState, useEffect } from 'react'
import {
  ProjecaoLote,
  ProjecaoInput,
  ResultadoProjecao,
  Dieta,
  getDietas,
  getProjecaoAtiva,
  createProjecao,
  calcularProjecao,
  formatarMoeda,
  formatarPeso,
  calcularDiasRestantes,
  TIPOS_DIETA,
  createDietasPadrao,
} from '@/lib/services/nutricao.service'

interface ProjecaoAlimentarCardProps {
  loteId: string
  pesoMedioAtual: number
  quantidadeAnimais: number
  onProjecaoCriada?: (projecao: ProjecaoLote) => void
}

export default function ProjecaoAlimentarCard({
  loteId,
  pesoMedioAtual,
  quantidadeAnimais,
  onProjecaoCriada,
}: ProjecaoAlimentarCardProps) {
  const [projecaoAtiva, setProjecaoAtiva] = useState<ProjecaoLote | null>(null)
  const [dietas, setDietas] = useState<Dieta[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [previewResultado, setPreviewResultado] = useState<ResultadoProjecao | null>(null)

  // Form state
  const [form, setForm] = useState<Partial<ProjecaoInput>>({
    dias_confinamento: 90,
    gmd_alvo: 1.4,
    consumo_ms_percentual_pv: 2.2,
    percentual_volumoso: 15,
    percentual_concentrado: 85,
    ms_volumoso: 35,
    ms_concentrado: 88,
    custo_volumoso_kg: 0.18,
    custo_concentrado_kg: 1.85,
  })

  useEffect(() => {
    loadData()
  }, [loteId])

  useEffect(() => {
    // Atualizar preview quando form mudar
    if (modoEdicao && pesoMedioAtual > 0 && quantidadeAnimais > 0) {
      const input: ProjecaoInput = {
        lote_id: loteId,
        data_inicio: new Date().toISOString().split('T')[0],
        peso_inicial: pesoMedioAtual,
        quantidade_animais: quantidadeAnimais,
        dias_confinamento: form.dias_confinamento || 90,
        gmd_alvo: form.gmd_alvo || 1.4,
        consumo_ms_percentual_pv: form.consumo_ms_percentual_pv || 2.2,
        percentual_volumoso: form.percentual_volumoso || 15,
        percentual_concentrado: form.percentual_concentrado || 85,
        ms_volumoso: form.ms_volumoso || 35,
        ms_concentrado: form.ms_concentrado || 88,
        custo_volumoso_kg: form.custo_volumoso_kg || 0.18,
        custo_concentrado_kg: form.custo_concentrado_kg || 1.85,
      }
      setPreviewResultado(calcularProjecao(input))
    }
  }, [form, modoEdicao, pesoMedioAtual, quantidadeAnimais, loteId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projecao, dietasData] = await Promise.all([
        getProjecaoAtiva(loteId),
        getDietas(),
      ])
      setProjecaoAtiva(projecao)
      setDietas(dietasData)

      // Se não tem dietas, criar as padrão
      if (dietasData.length === 0) {
        const novasDietas = await createDietasPadrao()
        setDietas(novasDietas)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDietaChange = (dietaId: string) => {
    const dieta = dietas.find(d => d.id === dietaId)
    if (dieta) {
      setForm({
        ...form,
        dieta_id: dietaId,
        consumo_ms_percentual_pv: dieta.consumo_ms_percentual_pv,
        percentual_volumoso: dieta.percentual_volumoso,
        percentual_concentrado: dieta.percentual_concentrado,
        ms_volumoso: dieta.ms_volumoso,
        ms_concentrado: dieta.ms_concentrado,
        custo_volumoso_kg: dieta.custo_volumoso_kg,
        custo_concentrado_kg: dieta.custo_concentrado_kg,
        gmd_alvo: dieta.gmd_esperado || form.gmd_alvo,
      })
    }
  }

  const handleSalvar = async () => {
    try {
      setSalvando(true)
      const input: ProjecaoInput = {
        lote_id: loteId,
        dieta_id: form.dieta_id,
        data_inicio: new Date().toISOString().split('T')[0],
        peso_inicial: pesoMedioAtual,
        quantidade_animais: quantidadeAnimais,
        dias_confinamento: form.dias_confinamento || 90,
        gmd_alvo: form.gmd_alvo || 1.4,
        consumo_ms_percentual_pv: form.consumo_ms_percentual_pv || 2.2,
        percentual_volumoso: form.percentual_volumoso || 15,
        percentual_concentrado: form.percentual_concentrado || 85,
        ms_volumoso: form.ms_volumoso || 35,
        ms_concentrado: form.ms_concentrado || 88,
        custo_volumoso_kg: form.custo_volumoso_kg || 0.18,
        custo_concentrado_kg: form.custo_concentrado_kg || 1.85,
      }

      const novaProjecao = await createProjecao(input)
      setProjecaoAtiva(novaProjecao)
      setModoEdicao(false)
      onProjecaoCriada?.(novaProjecao)
    } catch (error) {
      console.error('Erro ao salvar projecao:', error)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-muted/30 rounded"></div>
      </div>
    )
  }

  // Modo visualização da projeção ativa
  if (projecaoAtiva && !modoEdicao) {
    const diasRestantes = calcularDiasRestantes(projecaoAtiva.data_saida_projetada)

    return (
      <div className="card-leather p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg flex items-center gap-2">
            <span className="text-2xl">📊</span>
            PROJECAO ALIMENTAR
          </h3>
          <button
            onClick={() => setModoEdicao(true)}
            className="text-xs text-primary hover:underline"
          >
            Editar
          </button>
        </div>

        {/* Resumo Principal */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {projecaoAtiva.dias_confinamento}
            </p>
            <p className="text-xs text-muted-foreground">dias de cocho</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {projecaoAtiva.gmd_alvo?.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">GMD alvo (kg/dia)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {projecaoAtiva.peso_final_projetado?.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">peso final (kg)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {projecaoAtiva.arrobas_projetadas?.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">@ projetadas</p>
          </div>
        </div>

        {/* Detalhes de Custo */}
        <div className="bg-background/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Consumo MS/animal/dia</p>
              <p className="font-mono font-semibold">
                {formatarPeso(projecaoAtiva.consumo_ms_diario_animal || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Custo/animal/dia</p>
              <p className="font-mono font-semibold">
                {formatarMoeda(projecaoAtiva.custo_alimentar_diario_animal || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Custo/lote/dia</p>
              <p className="font-mono font-semibold">
                {formatarMoeda(projecaoAtiva.custo_alimentar_diario_lote || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">CA projetado</p>
              <p className="font-mono font-semibold">
                {projecaoAtiva.ca_projetado?.toFixed(2)}:1
              </p>
            </div>
          </div>
        </div>

        {/* Custo Total e Data Saída */}
        <div className="flex items-center justify-between bg-success/10 rounded-lg p-4 border border-success/30">
          <div>
            <p className="text-xs text-muted-foreground">Custo Alimentar Total</p>
            <p className="text-2xl font-bold text-success">
              {formatarMoeda(projecaoAtiva.custo_alimentar_total || 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Data Saída Prevista</p>
            <p className="font-semibold">
              {projecaoAtiva.data_saida_projetada
                ? new Date(projecaoAtiva.data_saida_projetada + 'T00:00:00').toLocaleDateString('pt-BR')
                : '--'}
            </p>
            {diasRestantes !== null && diasRestantes > 0 && (
              <p className="text-xs text-primary">{diasRestantes} dias restantes</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Modo edição/criação
  return (
    <div className="card-leather p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {projecaoAtiva ? 'EDITAR PROJECAO' : 'NOVA PROJECAO ALIMENTAR'}
        </h3>
        {projecaoAtiva && (
          <button
            onClick={() => setModoEdicao(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Informações do Lote */}
      <div className="bg-muted/20 rounded-lg p-3 mb-4 text-sm">
        <div className="flex justify-between">
          <span>Peso medio atual: <strong>{formatarPeso(pesoMedioAtual)}</strong></span>
          <span>Quantidade: <strong>{quantidadeAnimais} cab</strong></span>
        </div>
      </div>

      {/* Formulário */}
      <div className="space-y-4">
        {/* Seleção de Dieta */}
        <div>
          <label className="block text-sm font-medium mb-1">Dieta Base</label>
          <select
            value={form.dieta_id || ''}
            onChange={(e) => handleDietaChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Selecione uma dieta...</option>
            {dietas.map(dieta => (
              <option key={dieta.id} value={dieta.id}>
                {dieta.nome} ({TIPOS_DIETA.find(t => t.value === dieta.tipo)?.label})
              </option>
            ))}
          </select>
        </div>

        {/* Parâmetros Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Dias de Cocho</label>
            <input
              type="number"
              value={form.dias_confinamento || ''}
              onChange={(e) => setForm({ ...form, dias_confinamento: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              min="1"
              max="365"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GMD Alvo (kg/dia)</label>
            <input
              type="number"
              step="0.1"
              value={form.gmd_alvo || ''}
              onChange={(e) => setForm({ ...form, gmd_alvo: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              min="0.1"
              max="3"
            />
          </div>
        </div>

        {/* Composição da Dieta */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Consumo MS (% PV)</label>
            <input
              type="number"
              step="0.1"
              value={form.consumo_ms_percentual_pv || ''}
              onChange={(e) => setForm({ ...form, consumo_ms_percentual_pv: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              min="1"
              max="4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">% Volumoso / Concentrado</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.percentual_volumoso || ''}
                onChange={(e) => setForm({
                  ...form,
                  percentual_volumoso: Number(e.target.value),
                  percentual_concentrado: 100 - Number(e.target.value)
                })}
                className="w-1/2 px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
                min="0"
                max="100"
              />
              <input
                type="number"
                value={form.percentual_concentrado || ''}
                disabled
                className="w-1/2 px-3 py-2 rounded-lg bg-muted/30 border border-border"
              />
            </div>
          </div>
        </div>

        {/* Custos */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Custo Volumoso (R$/kg MN)</label>
            <input
              type="number"
              step="0.01"
              value={form.custo_volumoso_kg || ''}
              onChange={(e) => setForm({ ...form, custo_volumoso_kg: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custo Concentrado (R$/kg MN)</label>
            <input
              type="number"
              step="0.01"
              value={form.custo_concentrado_kg || ''}
              onChange={(e) => setForm({ ...form, custo_concentrado_kg: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              min="0"
            />
          </div>
        </div>

        {/* Preview dos Resultados */}
        {previewResultado && (
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
            <p className="text-sm font-medium mb-2">Preview da Projecao:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Consumo MS/dia</p>
                <p className="font-mono font-semibold">{formatarPeso(previewResultado.consumo_ms_diario_animal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Custo/dia/animal</p>
                <p className="font-mono font-semibold">{formatarMoeda(previewResultado.custo_alimentar_diario_animal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Custo Total</p>
                <p className="font-mono font-semibold text-success">{formatarMoeda(previewResultado.custo_alimentar_total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Peso Final</p>
                <p className="font-mono font-semibold">{formatarPeso(previewResultado.peso_final_projetado, 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Projecao'}
        </button>
      </div>
    </div>
  )
}
