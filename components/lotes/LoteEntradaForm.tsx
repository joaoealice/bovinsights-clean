'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAreasPastagem, AreaPastagemWithLote } from '@/lib/services/areas-pastagem.service'

interface LoteEntradaFormProps {
  onSubmit: (data: any) => Promise<void>
  submitLabel?: string
}

// Constantes para cálculo forrageiro
const CONSUMO_MS_PERCENTUAL = 0.023 // 2.3% do peso vivo por dia

export default function LoteEntradaForm({ onSubmit, submitLabel = 'Criar Lote' }: LoteEntradaFormProps) {
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    tipo_lote: '',
    status: 'ativo',
    observacoes: '',
    // Informações de entrada
    data_entrada: new Date().toISOString().split('T')[0],
    quantidade_total: '',
    peso_total_entrada: '',
    preco_arroba_compra: '',
    frete: '',
    comissao: '',
    fornecedor: '',
    // Sexo dos animais
    sexo_tipo: 'todos_machos',
    quantidade_machos: '',
    quantidade_femeas: '',
    // Manejo de pastagem
    piquete_id: '',
    peso_medio_animal: '',
  })
  const [loading, setLoading] = useState(false)
  const [piquetes, setPiquetes] = useState<AreaPastagemWithLote[]>([])
  const [loadingPiquetes, setLoadingPiquetes] = useState(false)

  // Carregar piquetes quando tipo for pasto ou semiconfinamento
  useEffect(() => {
    const deveCarregarPiquetes = formData.tipo_lote === 'pasto' || formData.tipo_lote === 'semiconfinamento'
    if (deveCarregarPiquetes && piquetes.length === 0) {
      loadPiquetes()
    }
  }, [formData.tipo_lote])

  const loadPiquetes = async () => {
    setLoadingPiquetes(true)
    try {
      const data = await getAreasPastagem()
      setPiquetes(data)
    } catch (err) {
      console.error('Erro ao carregar piquetes:', err)
    } finally {
      setLoadingPiquetes(false)
    }
  }

  // Verificar se é pastagem ou semi
  const isPastagem = formData.tipo_lote === 'pasto' || formData.tipo_lote === 'semiconfinamento'

  // Calcular peso médio automaticamente se tiver dados
  const pesoMedioCalculado = useMemo(() => {
    if (formData.peso_medio_animal) {
      return parseFloat(formData.peso_medio_animal)
    }
    if (formData.peso_total_entrada && formData.quantidade_total) {
      return parseFloat(formData.peso_total_entrada) / parseInt(formData.quantidade_total)
    }
    return 0
  }, [formData.peso_total_entrada, formData.quantidade_total, formData.peso_medio_animal])

  // Piquete selecionado
  const piqueteSelecionado = useMemo(() => {
    if (!formData.piquete_id || formData.piquete_id === 'avulso') return null
    return piquetes.find(p => p.id === formData.piquete_id)
  }, [formData.piquete_id, piquetes])

  // Cálculo de dias ideais de permanência
  const calculoPastagem = useMemo(() => {
    if (!isPastagem) return null

    const quantidade = parseInt(formData.quantidade_total) || 0
    const pesoMedio = pesoMedioCalculado

    if (quantidade <= 0 || pesoMedio <= 0) return null

    // Consumo diário do lote = N × PV × 2.3%
    const consumoDiaLote = quantidade * pesoMedio * CONSUMO_MS_PERCENTUAL

    // Se tem piquete selecionado, calcular dias ideais
    if (piqueteSelecionado && piqueteSelecionado.ms_total_kg) {
      const diasIdeais = Math.floor(piqueteSelecionado.ms_total_kg / consumoDiaLote)
      return {
        consumoDiaLote: Math.round(consumoDiaLote),
        diasIdeais,
        msDisponivel: piqueteSelecionado.ms_total_kg,
        capacidadeUA: piqueteSelecionado.capacidade_ua,
        alerta: diasIdeais < 3 ? 'critico' : diasIdeais < 7 ? 'atencao' : 'ok'
      }
    }

    // Sem piquete, apenas mostra consumo
    return {
      consumoDiaLote: Math.round(consumoDiaLote),
      diasIdeais: null,
      msDisponivel: null,
      capacidadeUA: null,
      alerta: null
    }
  }, [isPastagem, formData.quantidade_total, pesoMedioCalculado, piqueteSelecionado])

  // Calcular valores automaticamente
  const pesoArrobas = formData.peso_total_entrada ? parseFloat(formData.peso_total_entrada) / 30 : 0
  const valorAnimais = pesoArrobas * (parseFloat(formData.preco_arroba_compra) || 0)
  const custoTotal = valorAnimais + (parseFloat(formData.frete) || 0) + (parseFloat(formData.comissao) || 0)
  const custoPorCabeca = formData.quantidade_total ? custoTotal / parseInt(formData.quantidade_total) : 0
  const mediaArrobasPorAnimal = formData.quantidade_total && formData.peso_total_entrada
    ? (parseFloat(formData.peso_total_entrada) / 30) / parseInt(formData.quantidade_total)
    : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        nome: formData.nome,
        localizacao: formData.localizacao || null,
        tipo_lote: formData.tipo_lote || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
        data_entrada: formData.data_entrada || null,
        quantidade_total: parseInt(formData.quantidade_total) || null,
        peso_total_entrada: parseFloat(formData.peso_total_entrada) || null,
        preco_arroba_compra: parseFloat(formData.preco_arroba_compra),
        frete: parseFloat(formData.frete) || null,
        comissao: parseFloat(formData.comissao) || null,
        fornecedor: formData.fornecedor || null,
        // Sexo dos animais
        sexo_tipo: formData.sexo_tipo,
        quantidade_machos: parseInt(formData.quantidade_machos) || 0,
        quantidade_femeas: parseInt(formData.quantidade_femeas) || 0,
        // Manejo de pastagem
        piquete_id: formData.piquete_id && formData.piquete_id !== 'avulso' ? formData.piquete_id : null,
        peso_medio_animal: pesoMedioCalculado || null,
        dias_permanencia_ideal: calculoPastagem?.diasIdeais || null,
        data_entrada_piquete: isPastagem ? formData.data_entrada : null,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Informações do Lote */}
      <div>
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span>1</span>
          <span>Informações do Lote</span>
        </h3>

        <div className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Nome do Lote <span className="text-error">*</span>
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Digite um nome para identificar o lote"
              className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Sugestao: use um nome descritivo como "Nelore Recria Jan/25" ou "Lote Engorda 01"
            </p>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-base font-semibold mb-2">
              Localizacao na Fazenda
            </label>
            <input
              type="text"
              name="localizacao"
              value={formData.localizacao}
              onChange={handleChange}
              placeholder="Onde os animais estao alocados"
              className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Informe o local fisico: piquete, pasto, curral, etc.
            </p>
          </div>

          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold mb-2">
                Tipo de Lote <span className="text-error">*</span>
              </label>
              <select
                name="tipo_lote"
                value={formData.tipo_lote}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Selecione o tipo do lote</option>
                <option value="pasto">Pasto (pastagem extensiva)</option>
                <option value="semiconfinamento">Semi Confinamento</option>
                <option value="confinamento">Confinamento (cocho)</option>
                <option value="cria">Cria (bezerros)</option>
                <option value="recria">Recria (desenvolvimento)</option>
                <option value="engorda">Engorda (terminacao)</option>
                <option value="reproducao">Reproducao (matrizes/touros)</option>
                <option value="quarentena">Quarentena (isolamento)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Define como os animais serao manejados
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">
                Status <span className="text-error">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="ativo">Ativo (em producao)</option>
                <option value="inativo">Inativo (encerrado)</option>
                <option value="manutencao">Manutencao (pausado)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Lotes ativos aparecem no dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção: Entrada de Animais */}
      <div>
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span>2</span>
          <span>Entrada de Animais</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-6 -mt-2">
          Informe os dados da compra ou transferencia dos animais
        </p>

        <div className="space-y-6">
          {/* Data e Fornecedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold mb-2">
                Data de Entrada
              </label>
              <input
                type="date"
                name="data_entrada"
                value={formData.data_entrada}
                onChange={handleChange}
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Data em que os animais chegaram
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">
                Fornecedor / Origem
              </label>
              <input
                type="text"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="De onde vieram os animais"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Nome da fazenda, leilao ou proprietario anterior
              </p>
            </div>
          </div>

          {/* Quantidade e Peso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold mb-2">
                Quantidade de Animais <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="quantidade_total"
                value={formData.quantidade_total}
                onChange={handleChange}
                min="1"
                required
                placeholder="Quantas cabecas"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Total de cabecas que entraram no lote
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">
                Peso Total de Entrada (kg)
              </label>
              <input
                type="number"
                name="peso_total_entrada"
                value={formData.peso_total_entrada}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="Soma do peso de todos os animais"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {formData.peso_total_entrada ? (
                <p className="text-xs text-success mt-1.5 font-medium">
                  = {pesoArrobas.toFixed(2)} arrobas totais
                  {formData.quantidade_total && ` | ${(parseFloat(formData.peso_total_entrada) / parseInt(formData.quantidade_total)).toFixed(1)} kg/animal`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Se nao souber o peso total, deixe em branco
                </p>
              )}
            </div>
          </div>

          {/* Sexo dos Animais */}
          {formData.quantidade_total && parseInt(formData.quantidade_total) > 0 && (
            <div className="bg-muted/20 rounded-lg p-4 border border-border">
              <label className="block text-sm font-semibold mb-3">
                Sexo dos Animais
              </label>

              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sexo_tipo: 'todos_machos', quantidade_machos: prev.quantidade_total, quantidade_femeas: '0' }))}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    formData.sexo_tipo === 'todos_machos'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Todos Machos
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sexo_tipo: 'todas_femeas', quantidade_machos: '0', quantidade_femeas: prev.quantidade_total }))}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    formData.sexo_tipo === 'todas_femeas'
                      ? 'bg-pink-500 text-white'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Todas Femeas
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, sexo_tipo: 'especificar', quantidade_machos: '', quantidade_femeas: '' }))}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    formData.sexo_tipo === 'especificar'
                      ? 'bg-primary text-white'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Especificar Quantidade
                </button>
              </div>

              {formData.sexo_tipo === 'especificar' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Machos</label>
                    <input
                      type="number"
                      name="quantidade_machos"
                      value={formData.quantidade_machos}
                      onChange={handleChange}
                      min="0"
                      max={formData.quantidade_total}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Femeas</label>
                    <input
                      type="number"
                      name="quantidade_femeas"
                      value={formData.quantidade_femeas}
                      onChange={handleChange}
                      min="0"
                      max={formData.quantidade_total}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                    />
                  </div>
                  {formData.quantidade_machos && formData.quantidade_femeas && (
                    parseInt(formData.quantidade_machos) + parseInt(formData.quantidade_femeas) !== parseInt(formData.quantidade_total)
                  ) && (
                    <p className="col-span-2 text-xs text-error">
                      Total deve ser igual a {formData.quantidade_total} animais (atual: {parseInt(formData.quantidade_machos || '0') + parseInt(formData.quantidade_femeas || '0')})
                    </p>
                  )}
                </div>
              )}

              {formData.sexo_tipo !== 'especificar' && (
                <p className="text-xs text-muted-foreground">
                  {formData.sexo_tipo === 'todos_machos' ? `${formData.quantidade_total} machos` : `${formData.quantidade_total} femeas`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Seção: Manejo de Pastagem - Só aparece para pasto ou semiconfinamento */}
      {isPastagem && (
        <div>
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <span>3</span>
            <span>Manejo de Pastagem</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-6 -mt-2">
            Vincule o lote a um piquete para calcular o tempo ideal de permanencia
          </p>

          <div className="bg-success/5 border border-success/30 rounded-lg p-6 space-y-6">
            {/* Peso Médio do Animal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold mb-2">
                  Peso Medio por Animal (kg)
                </label>
                <input
                  type="number"
                  name="peso_medio_animal"
                  value={formData.peso_medio_animal}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder={pesoMedioCalculado > 0 ? `Auto: ${pesoMedioCalculado.toFixed(0)} kg` : 'Peso medio individual'}
                  className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-success transition-all"
                />
                {pesoMedioCalculado > 0 && !formData.peso_medio_animal ? (
                  <p className="text-xs text-success mt-1.5 font-medium">
                    Calculado automaticamente: {pesoMedioCalculado.toFixed(1)} kg/animal
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Deixe em branco para calcular automaticamente
                  </p>
                )}
              </div>

              {/* Seleção de Piquete */}
              <div>
                <label className="block text-base font-semibold mb-2">
                  Piquete / Area de Pastagem
                </label>
                <select
                  name="piquete_id"
                  value={formData.piquete_id}
                  onChange={handleChange}
                  disabled={loadingPiquetes}
                  className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-success transition-all"
                >
                  <option value="">Selecione onde o lote ficara</option>
                  <option value="avulso">Pasto Avulso (sem piquete cadastrado)</option>
                  {piquetes.map((piquete) => (
                    <option key={piquete.id} value={piquete.id}>
                      {piquete.nome} - {piquete.area_hectares.toFixed(2)} ha
                      {piquete.capacidade_ua ? ` (${piquete.capacidade_ua} UA)` : ''}
                    </option>
                  ))}
                </select>
                {loadingPiquetes && (
                  <p className="text-xs text-muted-foreground mt-1.5">Carregando piquetes...</p>
                )}
                {piquetes.length === 0 && !loadingPiquetes && (
                  <p className="text-xs text-warning mt-1.5">
                    Nenhum piquete cadastrado. Va em "Suporte Forrageiro" para cadastrar.
                  </p>
                )}
              </div>
            </div>

            {/* Informações do Piquete Selecionado */}
            {piqueteSelecionado && (
              <div className="bg-muted/20 rounded-lg p-4 border border-border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📍</span>
                  {piqueteSelecionado.nome}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Área</p>
                    <p className="font-mono font-bold">{piqueteSelecionado.area_hectares.toFixed(2)} ha</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">MS Disponível</p>
                    <p className="font-mono font-bold text-success">
                      {piqueteSelecionado.ms_total_kg ? `${(piqueteSelecionado.ms_total_kg / 1000).toFixed(1)} t` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Capacidade</p>
                    <p className="font-mono font-bold">
                      {piqueteSelecionado.capacidade_ua ? `${piqueteSelecionado.capacidade_ua} UA/dia` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Altura Entrada/Saída</p>
                    <p className="font-mono font-bold">
                      {piqueteSelecionado.altura_entrada_cm || '-'} / {piqueteSelecionado.altura_saida_cm || '-'} cm
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cálculo de Dias Ideais */}
            {calculoPastagem && (
              <div className={`rounded-xl p-6 border-2 ${
                calculoPastagem.alerta === 'critico' ? 'bg-error/10 border-error' :
                calculoPastagem.alerta === 'atencao' ? 'bg-warning/10 border-warning' :
                'bg-success/10 border-success'
              }`}>
                <h4 className="font-display text-lg mb-4 flex items-center gap-2">
                  <span>{calculoPastagem.alerta === 'critico' ? '🚨' : calculoPastagem.alerta === 'atencao' ? '⚠️' : '✅'}</span>
                  Cálculo de Permanência
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Consumo Diário */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Consumo Diário do Lote</p>
                    <p className="font-display text-3xl">{calculoPastagem.consumoDiaLote.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-muted-foreground">kg de MS/dia</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({formData.quantidade_total} animais × {pesoMedioCalculado.toFixed(0)} kg × 2,3%)
                    </p>
                  </div>

                  {/* Dias Ideais */}
                  {calculoPastagem.diasIdeais !== null && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Dias Ideais de Permanência</p>
                      <p className={`font-display text-5xl ${
                        calculoPastagem.alerta === 'critico' ? 'text-error' :
                        calculoPastagem.alerta === 'atencao' ? 'text-warning' :
                        'text-success'
                      }`}>
                        {calculoPastagem.diasIdeais}
                      </p>
                      <p className="text-sm text-muted-foreground">dias</p>
                    </div>
                  )}

                  {/* MS Disponível */}
                  {calculoPastagem.msDisponivel !== null && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase mb-1">MS Disponível no Piquete</p>
                      <p className="font-display text-3xl">{(calculoPastagem.msDisponivel / 1000).toFixed(1)}</p>
                      <p className="text-sm text-muted-foreground">toneladas</p>
                    </div>
                  )}
                </div>

                {/* Alerta */}
                {calculoPastagem.alerta === 'critico' && (
                  <div className="mt-4 p-3 bg-error/20 rounded-lg border border-error">
                    <p className="text-sm text-error font-semibold flex items-center gap-2">
                      <span>🚨</span>
                      ALERTA CRÍTICO: Capacidade insuficiente! O piquete suporta menos de 3 dias. Considere dividir o lote ou usar outro piquete.
                    </p>
                  </div>
                )}
                {calculoPastagem.alerta === 'atencao' && (
                  <div className="mt-4 p-3 bg-warning/20 rounded-lg border border-warning">
                    <p className="text-sm text-warning font-semibold flex items-center gap-2">
                      <span>⚠️</span>
                      ATENÇÃO: Permanência curta. Planeje a rotação para outro piquete em breve.
                    </p>
                  </div>
                )}
                {calculoPastagem.alerta === 'ok' && (
                  <div className="mt-4 p-3 bg-success/20 rounded-lg border border-success">
                    <p className="text-sm text-success font-semibold flex items-center gap-2">
                      <span>✅</span>
                      Capacidade adequada para o lote. Monitore a altura do pasto para rotação ideal.
                    </p>
                  </div>
                )}

                {/* Nota sobre pasto avulso */}
                {formData.piquete_id === 'avulso' && (
                  <div className="mt-4 p-3 bg-muted/20 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>ℹ️</span>
                      Pasto avulso selecionado. Cadastre o piquete em "Suporte Forrageiro" para cálculos automáticos de permanência.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aviso se faltam dados */}
            {isPastagem && !calculoPastagem && (
              <div className="p-4 bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>ℹ️</span>
                  Preencha a quantidade de animais e peso para calcular os dias ideais de permanência.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seção: Custos */}
      <div>
        <h3 className="font-display text-xl mb-4 flex items-center gap-2">
          <span>{isPastagem ? '4' : '3'}</span>
          <span>Custos da Operacao</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-6 -mt-2">
          Informe os valores para calcular o custo por cabeca
        </p>

        <div className="space-y-6">
          {/* Preço da Arroba */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-base font-semibold mb-2">
                Preco da @ na Compra (R$) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                name="preco_arroba_compra"
                value={formData.preco_arroba_compra}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Valor pago por arroba"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Preco da arroba no momento da compra
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">
                Frete Total (R$)
              </label>
              <input
                type="number"
                name="frete"
                value={formData.frete}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Custo do transporte"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Valor total gasto com transporte
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">
                Comissao / Outros (R$)
              </label>
              <input
                type="number"
                name="comissao"
                value={formData.comissao}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Comissoes e taxas"
                className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Comissao de corretor, leilao, etc.
              </p>
            </div>
          </div>

          {/* Resumo de Custos - Calculado Automaticamente */}
          {(valorAnimais > 0 || custoTotal > 0) && (
            <div className="bg-muted/20 rounded-lg p-6 border border-border">
              <h4 className="font-semibold mb-4 text-lg">Resumo Calculado:</h4>

              {/* Cards em destaque: Custo por Cabeça e Média @ por Animal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Custo por Cabeça em DESTAQUE */}
                <div className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl p-6 border-2 border-accent/50">
                  <p className="text-muted-foreground text-sm mb-1">CUSTO POR CABECA</p>
                  <p className="font-display text-4xl md:text-5xl text-accent">{formatCurrency(custoPorCabeca)}</p>
                </div>

                {/* Média @ por Animal em DESTAQUE */}
                <div className="bg-gradient-to-r from-success/20 to-primary/20 rounded-xl p-6 border-2 border-success/50">
                  <p className="text-muted-foreground text-sm mb-1">MEDIA @ POR ANIMAL</p>
                  <p className="font-display text-4xl md:text-5xl text-success">
                    {mediaArrobasPorAnimal.toFixed(2)} <span className="text-2xl">@</span>
                  </p>
                  {mediaArrobasPorAnimal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      = {(mediaArrobasPorAnimal * 30).toFixed(1)} kg/animal
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-muted-foreground text-base">Valor dos Animais</p>
                  <p className="font-mono font-bold text-2xl">{formatCurrency(valorAnimais)}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-muted-foreground text-base">Frete + Comissão</p>
                  <p className="font-mono font-bold text-2xl">
                    {formatCurrency((parseFloat(formData.frete) || 0) + (parseFloat(formData.comissao) || 0))}
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-muted-foreground text-base">Custo Total</p>
                  <p className="font-mono font-bold text-2xl text-primary">{formatCurrency(custoTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seção: Observações */}
      <div>
        <label className="block text-base font-semibold mb-2">
          Observacoes
        </label>
        <textarea
          name="observacoes"
          value={formData.observacoes}
          onChange={handleChange}
          rows={4}
          placeholder="Anotacoes importantes sobre este lote (opcional)"
          className="w-full px-4 py-4 rounded-lg bg-muted/30 border border-border text-foreground text-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Historico de saude, caracteristicas do lote, acordos com fornecedor, etc.
        </p>
      </div>

      {/* Botão Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
