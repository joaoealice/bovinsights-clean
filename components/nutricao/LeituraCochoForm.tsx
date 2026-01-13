'use client'

import { useState, useEffect } from 'react'
import {
  LeituraCocho,
  LeituraCochoInput,
  getLeiturasCocho,
  createLeituraCocho,
  ESCORES_COCHO,
  formatarPeso,
} from '@/lib/services/nutricao.service'

interface LeituraCochoFormProps {
  loteId: string
  msVolumoso?: number
  msConcentrado?: number
  onLeituraCriada?: (leitura: LeituraCocho) => void
}

export default function LeituraCochoForm({
  loteId,
  msVolumoso = 35,
  msConcentrado = 88,
  onLeituraCriada,
}: LeituraCochoFormProps) {
  const [leituras, setLeituras] = useState<LeituraCocho[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  // Form state
  const [form, setForm] = useState<Partial<LeituraCochoInput>>({
    data_leitura: new Date().toISOString().split('T')[0],
    numero_trato: 1,
    volumoso_fornecido_kg: 0,
    concentrado_fornecido_kg: 0,
    sobra_percentual: 0,
    escore_cocho: 2,
  })

  useEffect(() => {
    loadLeituras()
  }, [loteId])

  const loadLeituras = async () => {
    try {
      setLoading(true)
      const data = await getLeiturasCocho(loteId, 10)
      setLeituras(data)
    } catch (error) {
      console.error('Erro ao carregar leituras:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSalvando(true)
      const input: LeituraCochoInput = {
        lote_id: loteId,
        data_leitura: form.data_leitura || new Date().toISOString().split('T')[0],
        numero_trato: form.numero_trato || 1,
        volumoso_fornecido_kg: form.volumoso_fornecido_kg || 0,
        concentrado_fornecido_kg: form.concentrado_fornecido_kg || 0,
        sobra_percentual: form.sobra_percentual,
        escore_cocho: form.escore_cocho,
        observacoes: form.observacoes,
      }

      const novaLeitura = await createLeituraCocho(input, msVolumoso, msConcentrado)
      setLeituras([novaLeitura, ...leituras])
      setMostrarForm(false)
      resetForm()
      onLeituraCriada?.(novaLeitura)
    } catch (error) {
      console.error('Erro ao salvar leitura:', error)
    } finally {
      setSalvando(false)
    }
  }

  const resetForm = () => {
    setForm({
      data_leitura: new Date().toISOString().split('T')[0],
      numero_trato: 1,
      volumoso_fornecido_kg: 0,
      concentrado_fornecido_kg: 0,
      sobra_percentual: 0,
      escore_cocho: 2,
    })
  }

  const getEscoreColor = (escore: number | null) => {
    if (escore === null) return 'bg-gray-100'
    if (escore === 2) return 'bg-green-100 text-green-700'
    if (escore === 1 || escore === 3) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="card-leather p-6 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-1/2 mb-4"></div>
        <div className="h-24 bg-muted/30 rounded"></div>
      </div>
    )
  }

  return (
    <div className="card-leather p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          LEITURA DE COCHO
        </h3>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo Trato'}
        </button>
      </div>

      {/* Formulário de Nova Leitura */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-muted/20 rounded-lg p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data</label>
              <input
                type="date"
                value={form.data_leitura || ''}
                onChange={(e) => setForm({ ...form, data_leitura: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trato N</label>
              <select
                value={form.numero_trato || 1}
                onChange={(e) => setForm({ ...form, numero_trato: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              >
                <option value={1}>1o Trato</option>
                <option value={2}>2o Trato</option>
                <option value={3}>3o Trato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Volumoso Fornecido (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.volumoso_fornecido_kg || ''}
                onChange={(e) => setForm({ ...form, volumoso_fornecido_kg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
                min="0"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Concentrado Fornecido (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.concentrado_fornecido_kg || ''}
                onChange={(e) => setForm({ ...form, concentrado_fornecido_kg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
                min="0"
                placeholder="0.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sobra Estimada (%)</label>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={form.sobra_percentual || 0}
              onChange={(e) => setForm({ ...form, sobra_percentual: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-semibold text-foreground">{form.sobra_percentual || 0}%</span>
              <span>50%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Escore de Cocho</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {ESCORES_COCHO.map((escore) => (
                <button
                  key={escore.valor}
                  type="button"
                  onClick={() => setForm({ ...form, escore_cocho: escore.valor })}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    form.escore_cocho === escore.valor
                      ? 'border-primary bg-primary/10 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="text-lg font-bold">{escore.valor}</p>
                  <p className="text-[10px] text-muted-foreground">{escore.label}</p>
                </button>
              ))}
            </div>
            {form.escore_cocho !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                <strong>Acao:</strong> {ESCORES_COCHO[form.escore_cocho].acao}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observacoes</label>
            <textarea
              value={form.observacoes || ''}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary"
              rows={2}
              placeholder="Observacoes sobre o trato..."
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Registrar Leitura'}
          </button>
        </form>
      )}

      {/* Lista de Leituras Recentes */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Ultimas leituras:</p>
        {leituras.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Nenhuma leitura registrada
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leituras.map((leitura) => (
              <div
                key={leitura.id}
                className="flex items-center justify-between bg-muted/20 rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {new Date(leitura.data_leitura + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {leitura.numero_trato}o trato
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vol: {formatarPeso(leitura.volumoso_fornecido_kg)} |
                    Conc: {formatarPeso(leitura.concentrado_fornecido_kg)} |
                    Consumo MS: {formatarPeso(leitura.consumo_total_ms_kg || 0)}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${getEscoreColor(leitura.escore_cocho)}`}>
                  E{leitura.escore_cocho}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
