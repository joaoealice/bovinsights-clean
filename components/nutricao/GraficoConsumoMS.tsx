'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts'
import { ProjecaoLote, LeituraCocho, ConsumoDiario } from '@/lib/services/nutricao.service'

interface GraficoConsumoMSProps {
  projecao: ProjecaoLote | null
  leiturasCocho: LeituraCocho[]
  consumoDiario: ConsumoDiario[]
  quantidadeAnimais: number
  diasExibir?: number
}

interface DadoGrafico {
  data: string
  dataFormatada: string
  consumo_projetado: number
  faixa_minima: number
  faixa_maxima: number
  consumo_real?: number
  dentro_faixa?: boolean
}

export default function GraficoConsumoMS({
  projecao,
  leiturasCocho,
  consumoDiario,
  quantidadeAnimais,
  diasExibir = 30
}: GraficoConsumoMSProps) {
  // Processar dados para o gráfico
  const dadosGrafico = useMemo(() => {
    if (!projecao) return []

    const dados: DadoGrafico[] = []
    const dataInicio = new Date(projecao.data_inicio)
    const consumoProjetadoDia = projecao.consumo_ms_diario_lote || 0

    // Faixa zootécnica: +/- 10% do projetado
    const faixaMinima = consumoProjetadoDia * 0.90
    const faixaMaxima = consumoProjetadoDia * 1.10

    // Criar mapa de consumo real por data
    const consumoRealPorData = new Map<string, number>()
    consumoDiario.forEach(c => {
      consumoRealPorData.set(c.data, c.consumo_ms_total)
    })

    // Também usar leituras diretas se não tiver consumoDiario processado
    if (consumoDiario.length === 0 && leiturasCocho.length > 0) {
      const leiturasPorData = new Map<string, number>()
      leiturasCocho.forEach(l => {
        const atual = leiturasPorData.get(l.data_leitura) || 0
        leiturasPorData.set(l.data_leitura, atual + (l.consumo_total_ms_kg || 0))
      })
      leiturasPorData.forEach((valor, data) => {
        consumoRealPorData.set(data, valor)
      })
    }

    // Gerar dados para cada dia
    const hoje = new Date()
    for (let i = 0; i < diasExibir; i++) {
      const data = new Date(dataInicio)
      data.setDate(data.getDate() + i)

      // Não projetar além de hoje + 7 dias
      if (data > new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)) break

      // Não projetar além do período de confinamento
      if (i >= projecao.dias_confinamento) break

      const dataStr = data.toISOString().split('T')[0]
      const consumoReal = consumoRealPorData.get(dataStr)

      const dentroFaixa = consumoReal
        ? consumoReal >= faixaMinima && consumoReal <= faixaMaxima
        : undefined

      dados.push({
        data: dataStr,
        dataFormatada: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        consumo_projetado: Math.round(consumoProjetadoDia),
        faixa_minima: Math.round(faixaMinima),
        faixa_maxima: Math.round(faixaMaxima),
        consumo_real: consumoReal ? Math.round(consumoReal) : undefined,
        dentro_faixa: dentroFaixa
      })
    }

    return dados
  }, [projecao, consumoDiario, leiturasCocho, diasExibir])

  // Estatísticas
  const estatisticas = useMemo(() => {
    const diasComDados = dadosGrafico.filter(d => d.consumo_real !== undefined)
    const totalDias = diasComDados.length
    const diasDentroFaixa = diasComDados.filter(d => d.dentro_faixa).length
    const consumoMedioReal = totalDias > 0
      ? diasComDados.reduce((sum, d) => sum + (d.consumo_real || 0), 0) / totalDias
      : 0
    const consumoProjetado = projecao?.consumo_ms_diario_lote || 0
    const desvioPercentual = consumoProjetado > 0
      ? ((consumoMedioReal - consumoProjetado) / consumoProjetado) * 100
      : 0

    return {
      totalDias,
      diasDentroFaixa,
      percentualConformidade: totalDias > 0 ? (diasDentroFaixa / totalDias) * 100 : 0,
      consumoMedioReal,
      consumoProjetado,
      desvioPercentual
    }
  }, [dadosGrafico, projecao])

  if (!projecao) {
    return (
      <div className="bg-muted/20 rounded-lg p-8 border border-border text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-muted-foreground">
          Crie uma projeção alimentar para visualizar o gráfico de consumo MS
        </p>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dado = payload[0]?.payload as DadoGrafico
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">
              Projetado: <span className="font-mono">{dado.consumo_projetado} kg MS</span>
            </p>
            <p className="text-muted-foreground">
              Faixa: <span className="font-mono">{dado.faixa_minima} - {dado.faixa_maxima} kg</span>
            </p>
            {dado.consumo_real !== undefined && (
              <p className={dado.dentro_faixa ? 'text-success' : 'text-error'}>
                Real: <span className="font-mono">{dado.consumo_real} kg MS</span>
                {dado.dentro_faixa ? ' ✓' : ' ⚠'}
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Legenda e estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/30 text-center">
          <p className="text-xs text-muted-foreground">Consumo Projetado/Dia</p>
          <p className="font-mono font-bold text-lg text-primary">
            {estatisticas.consumoProjetado.toFixed(0)} kg
          </p>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border text-center">
          <p className="text-xs text-muted-foreground">Consumo Médio Real</p>
          <p className="font-mono font-bold text-lg">
            {estatisticas.consumoMedioReal > 0 ? `${estatisticas.consumoMedioReal.toFixed(0)} kg` : '-'}
          </p>
          {estatisticas.consumoMedioReal > 0 && (
            <p className={`text-xs ${
              Math.abs(estatisticas.desvioPercentual) <= 10
                ? 'text-success'
                : Math.abs(estatisticas.desvioPercentual) <= 20
                  ? 'text-warning'
                  : 'text-error'
            }`}>
              {estatisticas.desvioPercentual > 0 ? '+' : ''}{estatisticas.desvioPercentual.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="bg-background rounded-lg p-3 border border-border text-center">
          <p className="text-xs text-muted-foreground">Dias com Dados</p>
          <p className="font-mono font-bold text-lg">
            {estatisticas.totalDias}
          </p>
        </div>
        <div className={`rounded-lg p-3 border text-center ${
          estatisticas.percentualConformidade >= 80
            ? 'bg-success/10 border-success/30'
            : estatisticas.percentualConformidade >= 60
              ? 'bg-warning/10 border-warning/30'
              : 'bg-error/10 border-error/30'
        }`}>
          <p className="text-xs text-muted-foreground">Conformidade</p>
          <p className={`font-mono font-bold text-lg ${
            estatisticas.percentualConformidade >= 80
              ? 'text-success'
              : estatisticas.percentualConformidade >= 60
                ? 'text-warning'
                : 'text-error'
          }`}>
            {estatisticas.totalDias > 0 ? `${estatisticas.percentualConformidade.toFixed(0)}%` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">
            {estatisticas.diasDentroFaixa}/{estatisticas.totalDias} dias
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-card rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dadosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="dataFormatada"
              tick={{ fontSize: 11 }}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              className="text-muted-foreground"
              label={{ value: 'kg MS', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  faixa_minima: 'Faixa Mínima (-10%)',
                  faixa_maxima: 'Faixa Máxima (+10%)',
                  consumo_projetado: 'Consumo Projetado',
                  consumo_real: 'Consumo Real'
                }
                return labels[value] || value
              }}
            />

            {/* Área da faixa zootécnica */}
            <Area
              type="monotone"
              dataKey="faixa_maxima"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.1}
              name="faixa_maxima"
            />
            <Area
              type="monotone"
              dataKey="faixa_minima"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
              name="faixa_minima"
            />

            {/* Linha de consumo projetado */}
            <Line
              type="monotone"
              dataKey="consumo_projetado"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="consumo_projetado"
            />

            {/* Linha de consumo real */}
            <Line
              type="monotone"
              dataKey="consumo_real"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              name="consumo_real"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda explicativa */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary" style={{ borderStyle: 'dashed' }}></div>
          <span>Consumo Projetado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary/10 border border-primary/30 rounded"></div>
          <span>Faixa Zootécnica (±10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-success"></div>
          <span>Consumo Real</span>
        </div>
      </div>
    </div>
  )
}
