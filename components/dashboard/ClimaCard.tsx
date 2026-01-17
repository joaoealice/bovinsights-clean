'use client'

import { useEffect, useState } from 'react'
import {
  obterClimaAtualizado,
  forcarAtualizacaoClima,
  WeatherData,
  iconeClima,
  formatarTemperatura,
  formatarUmidade,
  formatarVento,
  corAlertaEstresse,
  direcaoVentoTexto,
  PrevisaoDia,
} from '@/lib/services/clima.service'

export default function ClimaCard() {
  const [dados, setDados] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const clima = await obterClimaAtualizado()
      setDados(clima)
    } catch (err) {
      console.error('Erro ao carregar clima:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados climáticos')
    } finally {
      setLoading(false)
    }
  }

  const handleAtualizar = async () => {
    try {
      setAtualizando(true)
      setError(null)
      const clima = await forcarAtualizacaoClima()
      setDados(clima)
    } catch (err) {
      console.error('Erro ao atualizar clima:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados climáticos')
    } finally {
      setAtualizando(false)
    }
  }

  // Estado de loading
  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-muted/30 rounded mb-2"></div>
        <div className="h-4 bg-muted/30 rounded w-2/3"></div>
      </div>
    )
  }

  // Estado sem localização configurada
  if (!dados && !error) {
    return (
      <div className="card-leather p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌤️</span>
          <h3 className="font-display text-lg">CLIMA & TEMPO</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm mb-2">
            Configure sua localização para ver o clima
          </p>
          <a
            href="/dashboard/configuracoes"
            className="text-primary hover:underline text-sm font-medium"
          >
            Ir para Configuracoes
          </a>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <div className="card-leather p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-2 border-red-500/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-display text-lg">CLIMA & TEMPO</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <button
            onClick={loadData}
            className="text-primary hover:underline text-sm font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!dados) return null

  return (
    <div className="card-leather p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl flex items-center gap-2">
          <span className="text-3xl">{iconeClima(dados.codigo_clima)}</span>
          CLIMA
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAtualizar}
            disabled={atualizando}
            className="p-2 hover:bg-muted/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <svg
              className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <div className="bg-blue-500/20 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold text-blue-400">
              {dados.cidade}, {dados.estado}
            </span>
          </div>
        </div>
      </div>

      {/* Temperatura Principal */}
      <div className="text-center mb-4">
        <p className="font-display text-6xl md:text-7xl text-blue-500 font-bold tracking-tight">
          {formatarTemperatura(dados.temperatura_atual)}
        </p>
        <p className="text-base text-muted-foreground capitalize font-semibold mt-1">
          {dados.descricao_clima}
        </p>
        {dados.sensacao_termica !== null && dados.sensacao_termica !== dados.temperatura_atual && (
          <p className="text-sm text-muted-foreground mt-1">
            Sensacao: {formatarTemperatura(dados.sensacao_termica)}
          </p>
        )}
      </div>

      {/* Min/Max do dia */}
      <div className="flex justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-blue-400">↓</span>
          <span>{formatarTemperatura(dados.temperatura_minima)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400">↑</span>
          <span>{formatarTemperatura(dados.temperatura_maxima)}</span>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Umidade */}
        <div className="bg-background/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <span>💧</span>
            <span>Umidade</span>
          </div>
          <p className="font-mono font-semibold">
            {formatarUmidade(dados.umidade_relativa)}
          </p>
        </div>

        {/* Vento */}
        <div className="bg-background/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <span>💨</span>
            <span>Vento</span>
          </div>
          <p className="font-mono font-semibold text-sm">
            {formatarVento(dados.velocidade_vento, dados.direcao_vento)}
          </p>
        </div>

        {/* Chuva */}
        <div className="bg-background/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <span>🌧️</span>
            <span>Precipitacao</span>
          </div>
          <p className="font-mono font-semibold">
            {dados.precipitacao !== null ? `${dados.precipitacao} mm` : '--'}
          </p>
        </div>

        {/* Probabilidade de chuva */}
        <div className="bg-background/50 rounded-lg p-2">
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <span>☔</span>
            <span>Prob. Chuva</span>
          </div>
          <p className="font-mono font-semibold">
            {dados.probabilidade_chuva !== null ? `${dados.probabilidade_chuva}%` : '--'}
          </p>
        </div>
      </div>

      {/* Alerta de Estresse Térmico */}
      {dados.indice_estresse_termico !== null && dados.alerta_estresse && (
        <div
          className={`rounded-xl p-3 border mb-4 ${corAlertaEstresse(dados.alerta_estresse)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium mb-0.5">Estresse Termico (ITU)</p>
              <p className="text-[10px] opacity-75">
                {dados.alerta_estresse === 'normal' && 'Conforto termico para bovinos'}
                {dados.alerta_estresse === 'leve' && 'Atencao: reducao no consumo'}
                {dados.alerta_estresse === 'moderado' && 'Alerta: impacto na producao'}
                {dados.alerta_estresse === 'severo' && 'Critico: risco a saude animal'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-lg">
                {dados.indice_estresse_termico.toFixed(1)}
              </p>
              <p className="text-[10px] uppercase font-semibold">
                {dados.alerta_estresse}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Previsão dos próximos dias (mini) */}
      {dados.previsao_json && dados.previsao_json.length > 1 && (
        <div className="border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground mb-2">Proximos dias</p>
          <div className="flex justify-between">
            {(dados.previsao_json as PrevisaoDia[]).slice(1, 5).map((dia, index) => (
              <div key={index} className="text-center">
                <p className="text-[10px] text-muted-foreground">
                  {formatarDiaSemana(dia.data)}
                </p>
                <span className="text-lg">{iconeClima(dia.codigo_clima)}</span>
                <p className="text-xs font-mono">
                  <span className="text-blue-400">{Math.round(dia.temperatura_minima)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-red-400">{Math.round(dia.temperatura_maxima)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/30">
        <span>
          {dados.nascer_sol && `☀️ ${dados.nascer_sol.substring(0, 5)}`}
          {dados.por_sol && ` - 🌙 ${dados.por_sol.substring(0, 5)}`}
        </span>
        <span>Open-Meteo API</span>
      </div>
    </div>
  )
}

// Função auxiliar para formatar dia da semana
function formatarDiaSemana(dataStr: string): string {
  const data = new Date(dataStr + 'T00:00:00')
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  return dias[data.getDay()]
}
