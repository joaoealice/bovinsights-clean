'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'

interface PesagemResumo {
  data: string
  qtdAnimais: number
  pesoMedio: number
  pesoTotal: number
}

interface GraficoEvolucaoPesoProps {
  pesagens: PesagemResumo[]
  pesoMedioInicial?: number
  dataEntrada?: string
}

export default function GraficoEvolucaoPeso({
  pesagens,
  pesoMedioInicial,
  dataEntrada
}: GraficoEvolucaoPesoProps) {
  // Preparar dados do grafico (ordenados do mais antigo para o mais recente)
  const dadosGrafico = useMemo(() => {
    const dados: {
      data: string
      dataFormatada: string
      pesoMedio: number
      pesoTotal: number
      arrobas: number
      ganho: number
      gmd: number
    }[] = []

    // Adicionar peso inicial se disponivel
    if (pesoMedioInicial && dataEntrada) {
      dados.push({
        data: dataEntrada,
        dataFormatada: formatarData(dataEntrada),
        pesoMedio: pesoMedioInicial,
        pesoTotal: 0,
        arrobas: pesoMedioInicial / 30,
        ganho: 0,
        gmd: 0
      })
    }

    // Ordenar pesagens do mais antigo para o mais recente
    const pesagensOrdenadas = [...pesagens].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    )

    // Adicionar pesagens
    pesagensOrdenadas.forEach((pesagem, index) => {
      const pesoAnterior = index === 0
        ? (pesoMedioInicial || pesagem.pesoMedio)
        : dados[dados.length - 1].pesoMedio

      const dataAnterior = index === 0
        ? (dataEntrada || pesagem.data)
        : dados[dados.length - 1].data

      const ganho = pesagem.pesoMedio - pesoAnterior
      const diasEntrePesagens = Math.max(1, Math.floor(
        (new Date(pesagem.data).getTime() - new Date(dataAnterior).getTime()) / (1000 * 60 * 60 * 24)
      ))
      const gmd = ganho / diasEntrePesagens

      dados.push({
        data: pesagem.data,
        dataFormatada: formatarData(pesagem.data),
        pesoMedio: pesagem.pesoMedio,
        pesoTotal: pesagem.pesoTotal,
        arrobas: pesagem.pesoMedio / 30,
        ganho: Math.round(ganho * 10) / 10,
        gmd: Math.round(gmd * 100) / 100
      })
    })

    return dados
  }, [pesagens, pesoMedioInicial, dataEntrada])

  // Calcular estatisticas
  const estatisticas = useMemo(() => {
    if (dadosGrafico.length < 2) return null

    const primeiro = dadosGrafico[0]
    const ultimo = dadosGrafico[dadosGrafico.length - 1]
    const ganhoTotal = ultimo.pesoMedio - primeiro.pesoMedio
    const diasTotal = Math.max(1, Math.floor(
      (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / (1000 * 60 * 60 * 24)
    ))
    const gmdGeral = ganhoTotal / diasTotal

    // Encontrar maior e menor GMD
    const gmds = dadosGrafico.slice(1).map(d => d.gmd).filter(g => g > 0)
    const maiorGmd = gmds.length > 0 ? Math.max(...gmds) : 0
    const menorGmd = gmds.length > 0 ? Math.min(...gmds) : 0

    return {
      ganhoTotal: Math.round(ganhoTotal * 10) / 10,
      diasTotal,
      gmdGeral: Math.round(gmdGeral * 100) / 100,
      maiorGmd: Math.round(maiorGmd * 100) / 100,
      menorGmd: Math.round(menorGmd * 100) / 100,
      pesoInicial: primeiro.pesoMedio,
      pesoFinal: ultimo.pesoMedio
    }
  }, [dadosGrafico])

  if (dadosGrafico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sem dados para exibir o grafico</p>
      </div>
    )
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.dataFormatada}</p>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Peso Medio:</span>
              <span className="font-mono font-bold text-primary">{data.pesoMedio.toFixed(1)} kg</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Arrobas:</span>
              <span className="font-mono">{data.arrobas.toFixed(2)} @</span>
            </p>
            {data.ganho !== 0 && (
              <p className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ganho:</span>
                <span className={`font-mono ${data.ganho >= 0 ? 'text-success' : 'text-error'}`}>
                  {data.ganho >= 0 ? '+' : ''}{data.ganho.toFixed(1)} kg
                </span>
              </p>
            )}
            {data.gmd !== 0 && (
              <p className="flex justify-between gap-4">
                <span className="text-muted-foreground">GMD:</span>
                <span className={`font-mono font-bold ${
                  data.gmd >= 1 ? 'text-success' :
                  data.gmd >= 0.7 ? 'text-primary' :
                  data.gmd >= 0.5 ? 'text-warning' : 'text-error'
                }`}>
                  {data.gmd.toFixed(2)} kg/dia
                </span>
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Grafico */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dadosGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="dataFormatada"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={['dataMin - 20', 'dataMax + 20']}
              tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Area sob a linha */}
            <Area
              type="monotone"
              dataKey="pesoMedio"
              stroke="transparent"
              fill="url(#colorPeso)"
            />

            {/* Linha principal */}
            <Line
              type="monotone"
              dataKey="pesoMedio"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2,
                r: 6
              }}
              activeDot={{
                fill: 'hsl(var(--primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 3,
                r: 8
              }}
            />

            {/* Linha de referencia do peso inicial */}
            {pesoMedioInicial && (
              <ReferenceLine
                y={pesoMedioInicial}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: `Entrada: ${pesoMedioInicial}kg`,
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  position: 'right'
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Estatisticas do grafico */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Peso Inicial</p>
            <p className="font-mono font-bold text-lg">{estatisticas.pesoInicial.toFixed(1)} kg</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center border border-primary/30">
            <p className="text-xs text-muted-foreground">Peso Atual</p>
            <p className="font-mono font-bold text-lg text-primary">{estatisticas.pesoFinal.toFixed(1)} kg</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3 text-center border border-success/30">
            <p className="text-xs text-muted-foreground">Ganho Total</p>
            <p className="font-mono font-bold text-lg text-success">+{estatisticas.ganhoTotal} kg</p>
          </div>
          <div className={`rounded-lg p-3 text-center border ${
            estatisticas.gmdGeral >= 1 ? 'bg-success/10 border-success/30' :
            estatisticas.gmdGeral >= 0.7 ? 'bg-primary/10 border-primary/30' :
            estatisticas.gmdGeral >= 0.5 ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30'
          }`}>
            <p className="text-xs text-muted-foreground">GMD Geral</p>
            <p className={`font-mono font-bold text-lg ${
              estatisticas.gmdGeral >= 1 ? 'text-success' :
              estatisticas.gmdGeral >= 0.7 ? 'text-primary' :
              estatisticas.gmdGeral >= 0.5 ? 'text-warning' : 'text-error'
            }`}>
              {estatisticas.gmdGeral} kg/dia
            </p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Periodo</p>
            <p className="font-mono font-bold text-lg">{estatisticas.diasTotal} dias</p>
          </div>
        </div>
      )}

      {/* Legenda de GMD */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span className="text-muted-foreground">Excelente (&gt;1.0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-muted-foreground">Bom (0.7-1.0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <span className="text-muted-foreground">Regular (0.5-0.7)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span className="text-muted-foreground">Baixo (&lt;0.5)</span>
        </div>
      </div>
    </div>
  )
}

// Funcao auxiliar para formatar data
function formatarData(dataString: string): string {
  const date = new Date(dataString + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
