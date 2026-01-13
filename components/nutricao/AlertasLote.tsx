'use client'

import { useMemo } from 'react'
import {
  AlertaLote,
  gerarAlertasLote,
  corAlerta,
  iconeAlerta,
  calcularDiasRestantes,
} from '@/lib/services/nutricao.service'

interface AlertasLoteProps {
  gmdReal: number | null
  gmdAlvo: number | null
  consumoRealMs: number | null
  consumoProjetadoMs: number | null
  escoreCocho: number | null
  dataSaidaPrevista: string | null
  pesoAtual: number | null
  pesoAlvo: number | null
}

export default function AlertasLote({
  gmdReal,
  gmdAlvo,
  consumoRealMs,
  consumoProjetadoMs,
  escoreCocho,
  dataSaidaPrevista,
  pesoAtual,
  pesoAlvo,
}: AlertasLoteProps) {
  const diasRestantes = calcularDiasRestantes(dataSaidaPrevista)

  const alertas = useMemo(() => {
    return gerarAlertasLote(
      gmdReal,
      gmdAlvo,
      consumoRealMs,
      consumoProjetadoMs,
      escoreCocho,
      diasRestantes,
      pesoAtual,
      pesoAlvo
    )
  }, [gmdReal, gmdAlvo, consumoRealMs, consumoProjetadoMs, escoreCocho, diasRestantes, pesoAtual, pesoAlvo])

  if (alertas.length === 0) {
    return null
  }

  // Ordenar por severidade: error > warning > info
  const alertasOrdenados = [...alertas].sort((a, b) => {
    const ordem = { error: 0, warning: 1, info: 2 }
    return ordem[a.severidade] - ordem[b.severidade]
  })

  return (
    <div className="space-y-2">
      {alertasOrdenados.map((alerta, index) => (
        <AlertaItem key={index} alerta={alerta} />
      ))}
    </div>
  )
}

function AlertaItem({ alerta }: { alerta: AlertaLote }) {
  return (
    <div className={`rounded-lg p-3 border ${corAlerta(alerta.severidade)}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">{iconeAlerta(alerta.tipo)}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{alerta.titulo}</p>
          <p className="text-xs opacity-80">{alerta.mensagem}</p>
          {alerta.valor_atual !== undefined && alerta.valor_esperado !== undefined && (
            <div className="flex gap-4 mt-1 text-xs">
              <span>Atual: <strong>{formatarValor(alerta.valor_atual, alerta.tipo)}</strong></span>
              <span>Esperado: <strong>{formatarValor(alerta.valor_esperado, alerta.tipo)}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatarValor(valor: number, tipo: AlertaLote['tipo']): string {
  switch (tipo) {
    case 'gmd_baixo':
      return `${valor.toFixed(3)} kg/dia`
    case 'consumo_baixo':
    case 'consumo_alto':
      return `${valor.toFixed(2)} kg MS`
    case 'peso_alvo':
      return `${valor.toFixed(0)} kg`
    case 'saida_proxima':
      return `${valor} dias`
    case 'escore_critico':
      return `E${valor}`
    default:
      return valor.toString()
  }
}

// Componente simplificado para uso em cards pequenos
export function AlertaBadge({
  gmdReal,
  gmdAlvo,
}: {
  gmdReal: number | null
  gmdAlvo: number | null
}) {
  if (gmdReal === null || gmdAlvo === null || gmdAlvo === 0) {
    return null
  }

  const percentual = (gmdReal / gmdAlvo) * 100

  if (percentual >= 80) {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
        GMD OK
      </span>
    )
  }

  return (
    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 animate-pulse">
      GMD {(100 - percentual).toFixed(0)}% abaixo
    </span>
  )
}

// Card compacto de alertas para o header da página
export function AlertasCompacto({
  alertas,
}: {
  alertas: AlertaLote[]
}) {
  const erros = alertas.filter(a => a.severidade === 'error').length
  const avisos = alertas.filter(a => a.severidade === 'warning').length
  const infos = alertas.filter(a => a.severidade === 'info').length

  if (alertas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span>✓</span>
        <span>Lote dentro dos parametros</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {erros > 0 && (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
          {erros} alerta{erros > 1 ? 's' : ''} critico{erros > 1 ? 's' : ''}
        </span>
      )}
      {avisos > 0 && (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
          {avisos} aviso{avisos > 1 ? 's' : ''}
        </span>
      )}
      {infos > 0 && (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
          {infos} info{infos > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
