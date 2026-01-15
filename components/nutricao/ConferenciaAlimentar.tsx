'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LeituraCocho,
  ConsumoDiario,
  getLeiturasCocho,
  getConsumoDiario,
  calcularProjecaoAutomatica,
  analisarConsumo,
  analisarGMD,
  SISTEMAS_PRODUCAO,
  TipoSistema,
  normalizarTipoSistema,
  MS_PADRAO,
  createLeituraCocho
} from '@/lib/services/nutricao.service'
import toast from 'react-hot-toast'

interface ConferenciaAlimentarProps {
  loteId: string
  pesoMedio: number
  quantidadeAnimais: number
  gmdReal: number | null
  tipoLote?: string
  isReadOnly?: boolean
}

type ViewMode = 'resumo' | 'entrada' | 'historico'

export default function ConferenciaAlimentar({
  loteId,
  pesoMedio,
  quantidadeAnimais,
  gmdReal,
  tipoLote,
  isReadOnly = false
}: ConferenciaAlimentarProps) {
  const [leituras, setLeituras] = useState<LeituraCocho[]>([])
  const [consumoDiario, setConsumoDiario] = useState<ConsumoDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('resumo')
  const [salvando, setSalvando] = useState(false)
  const [mostrarAvancado, setMostrarAvancado] = useState(false)

  // Form de entrada de dados
  const [fornecidoKg, setFornecidoKg] = useState('')
  const [sobraKg, setSobraKg] = useState('')

  // Normalizar tipo de sistema
  const sistema = useMemo(() => normalizarTipoSistema(tipoLote), [tipoLote])
  const configSistema = SISTEMAS_PRODUCAO[sistema]

  // Projeção automática calculada
  const projecao = useMemo(() => {
    if (pesoMedio <= 0 || quantidadeAnimais <= 0) return null
    return calcularProjecaoAutomatica(sistema, pesoMedio, quantidadeAnimais)
  }, [sistema, pesoMedio, quantidadeAnimais])

  // Consumo MS médio real dos últimos 7 dias
  const consumoMedioReal = useMemo(() => {
    if (consumoDiario.length === 0) return null
    const ultimos7 = consumoDiario.slice(0, 7)
    const total = ultimos7.reduce((sum, c) => sum + c.consumo_ms_total, 0)
    return total / ultimos7.length
  }, [consumoDiario])

  // Análises automáticas
  const analiseConsumo = useMemo(() => {
    if (!projecao) return null
    return analisarConsumo(consumoMedioReal, projecao.consumo_ms_lote_dia)
  }, [consumoMedioReal, projecao])

  const analiseGMD = useMemo(() => {
    return analisarGMD(gmdReal, configSistema.gmd_minimo, configSistema.gmd_maximo)
  }, [gmdReal, configSistema])

  useEffect(() => {
    loadData()
  }, [loteId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [leiturasData, consumoData] = await Promise.all([
        getLeiturasCocho(loteId, 30),
        getConsumoDiario(loteId, 30)
      ])
      setLeituras(leiturasData)
      setConsumoDiario(consumoData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Salvar leitura de cocho (entrada simplificada)
  const handleSalvarLeitura = async () => {
    const fornecido = parseFloat(fornecidoKg)
    const sobra = parseFloat(sobraKg) || 0

    if (isNaN(fornecido) || fornecido <= 0) {
      toast.error('Informe o total fornecido (kg)')
      return
    }

    if (sobra > fornecido) {
      toast.error('Sobra não pode ser maior que o fornecido')
      return
    }

    setSalvando(true)
    try {
      // Calcular proporção baseada na dieta do sistema
      const propConcentrado = configSistema.percentual_concentrado / 100
      const propVolumoso = configSistema.percentual_volumoso / 100

      // Distribuir fornecido conforme dieta
      const concentradoFornecido = fornecido * propConcentrado
      const volumosoFornecido = fornecido * propVolumoso

      // Calcular sobra percentual
      const sobraPercentual = (sobra / fornecido) * 100

      await createLeituraCocho({
        lote_id: loteId,
        data_leitura: new Date().toISOString().split('T')[0],
        numero_trato: 1,
        volumoso_fornecido_kg: volumosoFornecido,
        concentrado_fornecido_kg: concentradoFornecido,
        sobra_percentual: sobraPercentual,
        sobra_kg: sobra
      }, MS_PADRAO.volumoso, MS_PADRAO.concentrado)

      toast.success('Leitura registrada!')
      setFornecidoKg('')
      setSobraKg('')
      loadData()
      setViewMode('resumo')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar leitura')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 bg-muted/30 rounded"></div>
          <div className="h-24 bg-muted/30 rounded"></div>
          <div className="h-24 bg-muted/30 rounded"></div>
          <div className="h-24 bg-muted/30 rounded"></div>
        </div>
      </div>
    )
  }

  if (!projecao) {
    return (
      <div className="card-leather p-6 text-center">
        <p className="text-muted-foreground">Dados insuficientes para projeção</p>
      </div>
    )
  }

  return (
    <div className="card-leather p-6 border-2 border-primary/20">
      {/* Header simplificado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg">NUTRIÇÃO</h3>
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
            {projecao.sistema_label}
          </span>
        </div>

        {!isReadOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('resumo')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'resumo' ? 'bg-primary text-white' : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              Resumo
            </button>
            <button
              onClick={() => setViewMode('entrada')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'entrada' ? 'bg-primary text-white' : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              Registrar
            </button>
          </div>
        )}
      </div>

      {/* VIEW: RESUMO - Cards principais */}
      {viewMode === 'resumo' && (
        <div className="space-y-4">
          {/* Cards de projeção automática */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* MS/animal/dia */}
            <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">MS/animal/dia</p>
              <p className="font-mono font-bold text-2xl text-primary">
                {projecao.consumo_ms_animal_dia.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">kg</p>
            </div>

            {/* MS/lote/dia */}
            <div className="bg-success/10 rounded-lg p-4 text-center border border-success/30">
              <p className="text-xs text-muted-foreground mb-1">MS/lote/dia</p>
              <p className="font-mono font-bold text-2xl text-success">
                {projecao.consumo_ms_lote_dia.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">kg</p>
            </div>

            {/* MS/lote/mês */}
            <div className="bg-accent/10 rounded-lg p-4 text-center border border-accent/30">
              <p className="text-xs text-muted-foreground mb-1">MS/lote/mês</p>
              <p className="font-mono font-bold text-2xl text-accent">
                {(projecao.consumo_ms_lote_mes / 1000).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">ton</p>
            </div>

            {/* GMD esperado */}
            <div className="bg-warning/10 rounded-lg p-4 text-center border border-warning/30">
              <p className="text-xs text-muted-foreground mb-1">GMD esperado</p>
              <p className="font-mono font-bold text-2xl text-warning">
                {projecao.gmd_range}
              </p>
              <p className="text-xs text-muted-foreground">kg/dia</p>
            </div>
          </div>

          {/* Cards de Projeção de Ganho - Quadrados lado a lado */}
          <div className="grid grid-cols-3 gap-3">
            {/* p-GMDL - Ganho Médio Diário Lote */}
            {(() => {
              const gmdMedio = (configSistema.gmd_minimo + configSistema.gmd_maximo) / 2
              const gmdlKg = gmdMedio * quantidadeAnimais
              const gmdlArroba = gmdlKg / 30
              return (
                <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-lg p-3 border border-success/30 aspect-square flex flex-col justify-center text-center">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">p-GMDL</p>
                  <p className="font-mono font-bold text-xl md:text-2xl text-success">
                    {gmdlKg.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">kg/dia</p>
                  <p className="text-xs text-success font-medium mt-1">
                    {gmdlArroba.toFixed(2)} @
                  </p>
                </div>
              )
            })()}

            {/* p-GMUM - Ganho Médio Unidade Mês */}
            {(() => {
              const gmdMedio = (configSistema.gmd_minimo + configSistema.gmd_maximo) / 2
              const gmumKg = gmdMedio * 31
              const gmumArroba = gmumKg / 30
              return (
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/30 aspect-square flex flex-col justify-center text-center">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">p-GMUM</p>
                  <p className="font-mono font-bold text-xl md:text-2xl text-primary">
                    {gmumKg.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">kg/mês</p>
                  <p className="text-xs text-primary font-medium mt-1">
                    {gmumArroba.toFixed(2)} @
                  </p>
                </div>
              )
            })()}

            {/* p-GLT - Ganho Lote Total (mês) */}
            {(() => {
              const gmdMedio = (configSistema.gmd_minimo + configSistema.gmd_maximo) / 2
              const gmumKg = gmdMedio * 31
              const gltKg = gmumKg * quantidadeAnimais
              const gltArroba = gltKg / 30
              return (
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-3 border border-accent/30 aspect-square flex flex-col justify-center text-center">
                  <p className="text-xs text-muted-foreground font-semibold mb-1">p-GLT</p>
                  <p className="font-mono font-bold text-xl md:text-2xl text-accent">
                    {(gltKg / 1000).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">ton/mês</p>
                  <p className="text-xs text-accent font-medium mt-1">
                    {gltArroba.toFixed(1)} @
                  </p>
                </div>
              )
            })()}
          </div>

          {/* Análises automáticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Status do consumo */}
            {analiseConsumo && (
              <div className={`rounded-lg p-3 border flex items-center gap-3 ${
                analiseConsumo.status === 'otimo' ? 'bg-success/10 border-success/30' :
                analiseConsumo.status === 'atencao' ? 'bg-warning/10 border-warning/30' :
                analiseConsumo.status === 'alerta' ? 'bg-error/10 border-error/30' :
                'bg-muted/10 border-border'
              }`}>
                <span className={`text-2xl ${analiseConsumo.cor}`}>{analiseConsumo.icone}</span>
                <div>
                  <p className="text-xs text-muted-foreground">Consumo</p>
                  <p className={`font-medium ${analiseConsumo.cor}`}>{analiseConsumo.mensagem}</p>
                  {consumoMedioReal !== null && (
                    <p className="text-xs text-muted-foreground">
                      Real: {consumoMedioReal.toFixed(0)} kg/dia (média 7d)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status do GMD */}
            <div className={`rounded-lg p-3 border flex items-center gap-3 ${
              analiseGMD.status === 'otimo' ? 'bg-success/10 border-success/30' :
              analiseGMD.status === 'atencao' ? 'bg-warning/10 border-warning/30' :
              analiseGMD.status === 'alerta' ? 'bg-error/10 border-error/30' :
              'bg-muted/10 border-border'
            }`}>
              <span className={`text-2xl ${analiseGMD.cor}`}>{analiseGMD.icone}</span>
              <div>
                <p className="text-xs text-muted-foreground">Desempenho</p>
                <p className={`font-medium ${analiseGMD.cor}`}>{analiseGMD.mensagem}</p>
                {gmdReal !== null && (
                  <p className="text-xs text-muted-foreground">
                    GMD real: {gmdReal.toFixed(3)} kg/dia
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botão para expandir detalhes */}
          <button
            onClick={() => setMostrarAvancado(!mostrarAvancado)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {mostrarAvancado ? '▲' : '▼'} {mostrarAvancado ? 'Ocultar' : 'Ver'} detalhes
          </button>

          {/* Detalhes avançados (ocultos por padrão) */}
          {mostrarAvancado && (
            <div className="bg-muted/10 rounded-lg p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Concentrado</p>
                  <p className="font-mono">{projecao.percentual_concentrado}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volumoso</p>
                  <p className="font-mono">{projecao.percentual_volumoso}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Consumo % PV</p>
                  <p className="font-mono">{configSistema.consumo_ms_percentual_pv}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peso médio</p>
                  <p className="font-mono">{pesoMedio.toFixed(0)} kg</p>
                </div>
              </div>

              {/* Histórico recente */}
              {consumoDiario.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Últimas leituras (MS kg/dia)</p>
                  <div className="flex gap-2 flex-wrap">
                    {consumoDiario.slice(0, 7).map((c, i) => (
                      <div key={i} className="bg-background rounded px-2 py-1 text-xs font-mono">
                        {new Date(c.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: {c.consumo_ms_total.toFixed(0)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: ENTRADA DE DADOS */}
      {viewMode === 'entrada' && !isReadOnly && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Registre o total fornecido e a sobra para calcular o consumo real.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Total fornecido (kg)
              </label>
              <input
                type="number"
                value={fornecidoKg}
                onChange={(e) => setFornecidoKg(e.target.value)}
                placeholder={`Ex: ${projecao.consumo_ms_lote_dia.toFixed(0)}`}
                className="w-full px-3 py-2 border rounded-lg bg-background"
                min="0"
                step="10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Projetado: {projecao.consumo_ms_lote_dia.toFixed(0)} kg MS
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sobra no cocho (kg)
              </label>
              <input
                type="number"
                value={sobraKg}
                onChange={(e) => setSobraKg(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg bg-background"
                min="0"
                step="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe 0 se não houve sobra
              </p>
            </div>
          </div>

          {/* Preview do consumo */}
          {fornecidoKg && (
            <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
              <p className="text-sm font-medium">Consumo calculado:</p>
              <p className="font-mono text-xl text-primary">
                {(parseFloat(fornecidoKg) - (parseFloat(sobraKg) || 0)).toFixed(0)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                ({((parseFloat(fornecidoKg) - (parseFloat(sobraKg) || 0)) / quantidadeAnimais).toFixed(2)} kg/animal)
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSalvarLeitura}
              disabled={salvando || !fornecidoKg}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted text-white font-medium px-4 py-2 rounded-lg"
            >
              {salvando ? 'Salvando...' : 'Salvar leitura'}
            </button>
            <button
              onClick={() => setViewMode('resumo')}
              className="px-4 py-2 border rounded-lg hover:bg-muted/30"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
