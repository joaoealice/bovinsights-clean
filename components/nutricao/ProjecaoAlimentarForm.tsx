'use client'

import { useState, useEffect } from 'react'
import {
  ProjecaoInput,
  Dieta,
  getDietas,
  createProjecao,
  calcularProjecao,
  TIPOS_DIETA,
  DIETAS_PADRAO,
  createDietasPadrao
} from '@/lib/services/nutricao.service'
import toast from 'react-hot-toast'

// Sistemas produtivos com parâmetros padrão
const SISTEMAS_PRODUTIVOS = {
  confinamento: {
    label: 'Confinamento',
    descricao: 'Alto concentrado, máxima eficiência',
    consumo_ms_pv: 2.2,
    percentual_volumoso: 15,
    percentual_concentrado: 85,
    gmd_esperado: 1.5,
    ingestao_hidrica_litros_kg_ms: 3.5
  },
  semiconfinamento: {
    label: 'Semi-Confinamento',
    descricao: 'Balanceado entre pasto e cocho',
    consumo_ms_pv: 2.4,
    percentual_volumoso: 40,
    percentual_concentrado: 60,
    gmd_esperado: 1.0,
    ingestao_hidrica_litros_kg_ms: 4.0
  },
  pastagem: {
    label: 'Pastagem + Suplementação',
    descricao: 'Base pasto com suplemento proteico',
    consumo_ms_pv: 2.5,
    percentual_volumoso: 70,
    percentual_concentrado: 30,
    gmd_esperado: 0.7,
    ingestao_hidrica_litros_kg_ms: 4.5
  }
}

type SistemaProdutivo = keyof typeof SISTEMAS_PRODUTIVOS

interface ProjecaoAlimentarFormProps {
  loteId: string
  pesoMedio: number
  quantidadeAnimais: number
  onProjecaoCriada: () => void
  onCancel?: () => void
}

export default function ProjecaoAlimentarForm({
  loteId,
  pesoMedio,
  quantidadeAnimais,
  onProjecaoCriada,
  onCancel
}: ProjecaoAlimentarFormProps) {
  const [dietas, setDietas] = useState<Dieta[]>([])
  const [loadingDietas, setLoadingDietas] = useState(true)
  const [saving, setSaving] = useState(false)

  // Estados do formulário
  const [sistemaProduivo, setSistemaProduivo] = useState<SistemaProdutivo>('confinamento')
  const [dietaSelecionada, setDietaSelecionada] = useState<string>('')
  const [usarDietaPersonalizada, setUsarDietaPersonalizada] = useState(false)

  // Parâmetros editáveis
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [diasConfinamento, setDiasConfinamento] = useState(90)
  const [gmdAlvo, setGmdAlvo] = useState(1.5)
  const [consumoMsPv, setConsumoMsPv] = useState(2.2)
  const [percentualVolumoso, setPercentualVolumoso] = useState(15)
  const [percentualConcentrado, setPercentualConcentrado] = useState(85)
  const [msVolumoso, setMsVolumoso] = useState(35)
  const [msConcentrado, setMsConcentrado] = useState(88)
  const [custoVolumoso, setCustoVolumoso] = useState(0.18)
  const [custoConcentrado, setCustoConcentrado] = useState(1.85)

  // Resultados da projeção (preview)
  const [resultadoPreview, setResultadoPreview] = useState<ReturnType<typeof calcularProjecao> | null>(null)

  useEffect(() => {
    loadDietas()
  }, [])

  // Atualizar parâmetros quando mudar sistema produtivo
  useEffect(() => {
    const sistema = SISTEMAS_PRODUTIVOS[sistemaProduivo]
    setConsumoMsPv(sistema.consumo_ms_pv)
    setPercentualVolumoso(sistema.percentual_volumoso)
    setPercentualConcentrado(sistema.percentual_concentrado)
    setGmdAlvo(sistema.gmd_esperado)
  }, [sistemaProduivo])

  // Calcular preview da projeção quando parâmetros mudarem
  useEffect(() => {
    if (pesoMedio > 0 && quantidadeAnimais > 0) {
      const input: ProjecaoInput = {
        lote_id: loteId,
        data_inicio: dataInicio,
        dias_confinamento: diasConfinamento,
        gmd_alvo: gmdAlvo,
        peso_inicial: pesoMedio,
        quantidade_animais: quantidadeAnimais,
        consumo_ms_percentual_pv: consumoMsPv,
        percentual_volumoso: percentualVolumoso,
        percentual_concentrado: percentualConcentrado,
        ms_volumoso: msVolumoso,
        ms_concentrado: msConcentrado,
        custo_volumoso_kg: custoVolumoso,
        custo_concentrado_kg: custoConcentrado
      }
      const resultado = calcularProjecao(input)
      setResultadoPreview(resultado)
    }
  }, [
    pesoMedio, quantidadeAnimais, dataInicio, diasConfinamento, gmdAlvo,
    consumoMsPv, percentualVolumoso, percentualConcentrado,
    msVolumoso, msConcentrado, custoVolumoso, custoConcentrado
  ])

  const loadDietas = async () => {
    try {
      setLoadingDietas(true)
      let dietasData = await getDietas()

      // Se não tem dietas, criar as padrão
      if (dietasData.length === 0) {
        dietasData = await createDietasPadrao()
        toast.success('Dietas padrão criadas!')
      }

      setDietas(dietasData)
    } catch (error) {
      console.error('Erro ao carregar dietas:', error)
    } finally {
      setLoadingDietas(false)
    }
  }

  // Quando selecionar uma dieta, preencher os parâmetros
  const handleSelecionarDieta = (dietaId: string) => {
    setDietaSelecionada(dietaId)
    const dieta = dietas.find(d => d.id === dietaId)
    if (dieta) {
      setConsumoMsPv(dieta.consumo_ms_percentual_pv)
      setPercentualVolumoso(dieta.percentual_volumoso)
      setPercentualConcentrado(dieta.percentual_concentrado)
      setMsVolumoso(dieta.ms_volumoso)
      setMsConcentrado(dieta.ms_concentrado)
      setCustoVolumoso(dieta.custo_volumoso_kg)
      setCustoConcentrado(dieta.custo_concentrado_kg)
      if (dieta.gmd_esperado) setGmdAlvo(dieta.gmd_esperado)
    }
  }

  // Calcular ingestão hídrica estimada
  const ingestaoHidricaAnimal = resultadoPreview
    ? resultadoPreview.consumo_ms_diario_animal * SISTEMAS_PRODUTIVOS[sistemaProduivo].ingestao_hidrica_litros_kg_ms
    : 0
  const ingestaoHidricaLote = ingestaoHidricaAnimal * quantidadeAnimais

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pesoMedio <= 0) {
      toast.error('Peso médio inválido')
      return
    }

    try {
      setSaving(true)

      const input: ProjecaoInput = {
        lote_id: loteId,
        dieta_id: dietaSelecionada || undefined,
        data_inicio: dataInicio,
        dias_confinamento: diasConfinamento,
        gmd_alvo: gmdAlvo,
        peso_inicial: pesoMedio,
        quantidade_animais: quantidadeAnimais,
        consumo_ms_percentual_pv: consumoMsPv,
        percentual_volumoso: percentualVolumoso,
        percentual_concentrado: percentualConcentrado,
        ms_volumoso: msVolumoso,
        ms_concentrado: msConcentrado,
        custo_volumoso_kg: custoVolumoso,
        custo_concentrado_kg: custoConcentrado
      }

      await createProjecao(input)
      toast.success('Projeção alimentar criada com sucesso!')
      onProjecaoCriada()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar projeção')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sistema Produtivo */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Sistema Produtivo
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.entries(SISTEMAS_PRODUTIVOS) as [SistemaProdutivo, typeof SISTEMAS_PRODUTIVOS[SistemaProdutivo]][]).map(([key, sistema]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSistemaProduivo(key)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                sistemaProduivo === key
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-semibold">{sistema.label}</p>
              <p className="text-xs text-muted-foreground">{sistema.descricao}</p>
              <p className="text-xs text-primary mt-1">
                GMD esperado: {sistema.gmd_esperado} kg/dia
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Dieta Cadastrada (Opcional) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Dieta Cadastrada (Opcional)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={usarDietaPersonalizada}
              onChange={(e) => {
                setUsarDietaPersonalizada(e.target.checked)
                if (!e.target.checked) setDietaSelecionada('')
              }}
              className="rounded border-border"
            />
            Usar dieta personalizada
          </label>
        </div>

        {usarDietaPersonalizada && (
          <select
            value={dietaSelecionada}
            onChange={(e) => handleSelecionarDieta(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-3"
            disabled={loadingDietas}
          >
            <option value="">Selecione uma dieta...</option>
            {dietas.map(dieta => (
              <option key={dieta.id} value={dieta.id}>
                {dieta.nome} ({TIPOS_DIETA.find(t => t.value === dieta.tipo)?.label})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Parâmetros de Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Data de Início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Dias de Confinamento
          </label>
          <input
            type="number"
            value={diasConfinamento}
            onChange={(e) => setDiasConfinamento(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-lg px-4 py-3"
            min={1}
            max={365}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            GMD Alvo (kg/dia)
          </label>
          <input
            type="number"
            value={gmdAlvo}
            onChange={(e) => setGmdAlvo(Number(e.target.value))}
            className="w-full bg-background border border-border rounded-lg px-4 py-3"
            min={0.1}
            max={3}
            step={0.1}
            required
          />
        </div>
      </div>

      {/* Parâmetros de Consumo */}
      <div className="bg-muted/20 rounded-lg p-4 border border-border">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <span>🥩</span>
          Parâmetros de Consumo (Matéria Seca)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Consumo MS (% PV)
            </label>
            <input
              type="number"
              value={consumoMsPv}
              onChange={(e) => setConsumoMsPv(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              min={1}
              max={4}
              step={0.1}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              % Volumoso
            </label>
            <input
              type="number"
              value={percentualVolumoso}
              onChange={(e) => {
                const val = Number(e.target.value)
                setPercentualVolumoso(val)
                setPercentualConcentrado(100 - val)
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              % Concentrado
            </label>
            <input
              type="number"
              value={percentualConcentrado}
              onChange={(e) => {
                const val = Number(e.target.value)
                setPercentualConcentrado(val)
                setPercentualVolumoso(100 - val)
              }}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              min={0}
              max={100}
            />
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-sm font-mono ${
              percentualVolumoso + percentualConcentrado === 100
                ? 'text-success'
                : 'text-error'
            }`}>
              Total: {percentualVolumoso + percentualConcentrado}%
            </span>
          </div>
        </div>
      </div>

      {/* Parâmetros de MS e Custos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volumoso */}
        <div className="bg-success/10 rounded-lg p-4 border border-success/30">
          <h4 className="font-semibold mb-3 text-success">Volumoso</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                MS do Volumoso (%)
              </label>
              <input
                type="number"
                value={msVolumoso}
                onChange={(e) => setMsVolumoso(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                min={10}
                max={95}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Custo (R$/kg MN)
              </label>
              <input
                type="number"
                value={custoVolumoso}
                onChange={(e) => setCustoVolumoso(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>

        {/* Concentrado */}
        <div className="bg-warning/10 rounded-lg p-4 border border-warning/30">
          <h4 className="font-semibold mb-3 text-warning">Concentrado</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                MS do Concentrado (%)
              </label>
              <input
                type="number"
                value={msConcentrado}
                onChange={(e) => setMsConcentrado(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                min={10}
                max={95}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Custo (R$/kg MN)
              </label>
              <input
                type="number"
                value={custoConcentrado}
                onChange={(e) => setCustoConcentrado(Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview dos Resultados */}
      {resultadoPreview && (
        <div className="bg-primary/5 rounded-xl p-6 border-2 border-primary/20">
          <h4 className="font-display text-xl mb-4 flex items-center gap-2">
            <span>📊</span>
            Projeção Calculada
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Por Animal */}
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Consumo MS/Animal/Dia</p>
              <p className="font-mono font-bold text-lg text-primary">
                {resultadoPreview.consumo_ms_diario_animal.toFixed(2)} kg
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Volumoso MN/Animal</p>
              <p className="font-mono font-bold text-lg text-success">
                {resultadoPreview.consumo_volumoso_mn_animal.toFixed(2)} kg
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Concentrado MN/Animal</p>
              <p className="font-mono font-bold text-lg text-warning">
                {resultadoPreview.consumo_concentrado_mn_animal.toFixed(2)} kg
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo/Animal/Dia</p>
              <p className="font-mono font-bold text-lg">
                R$ {resultadoPreview.custo_alimentar_diario_animal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {/* Por Lote */}
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Consumo MS/Lote/Dia</p>
              <p className="font-mono font-bold text-lg text-primary">
                {resultadoPreview.consumo_ms_diario_lote.toFixed(0)} kg
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo/Lote/Dia</p>
              <p className="font-mono font-bold text-lg text-primary">
                R$ {resultadoPreview.custo_alimentar_diario_lote.toFixed(2)}
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo Total Período</p>
              <p className="font-mono font-bold text-lg text-primary">
                R$ {resultadoPreview.custo_alimentar_total.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">CA Projetado</p>
              <p className="font-mono font-bold text-lg text-accent">
                {resultadoPreview.ca_projetado.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">kg MS/kg ganho</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
            {/* Projeções de Saída */}
            <div className="bg-success/10 rounded-lg p-3 border border-success/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Peso Final Projetado</p>
              <p className="font-mono font-bold text-lg text-success">
                {resultadoPreview.peso_final_projetado.toFixed(1)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                {(resultadoPreview.peso_final_projetado / 30).toFixed(2)} @
              </p>
            </div>
            <div className="bg-success/10 rounded-lg p-3 border border-success/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">@ Total Projetadas</p>
              <p className="font-mono font-bold text-lg text-success">
                {resultadoPreview.arrobas_projetadas.toFixed(1)} @
              </p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-1">Data Saída Projetada</p>
              <p className="font-mono font-bold text-lg">
                {new Date(resultadoPreview.data_saida_projetada).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 border border-accent/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">Água Estimada/Lote/Dia</p>
              <p className="font-mono font-bold text-lg text-accent">
                {ingestaoHidricaLote.toFixed(0)} L
              </p>
              <p className="text-xs text-muted-foreground">
                {ingestaoHidricaAnimal.toFixed(1)} L/animal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-lg transition-all"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving || pesoMedio <= 0}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
        >
          {saving ? 'Salvando...' : 'Criar Projeção Alimentar'}
        </button>
      </div>
    </form>
  )
}
