'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { PastoGeometry } from '@/components/suporte-forrageiro/PastoMap'
import { getLotes, LoteWithStats } from '@/lib/services/lotes.service'
import {
  createAreaPastagem,
  getAreasPastagem,
  AreaPastagemWithLote,
  deleteAreaPastagem,
  TipoPasto,
  TIPOS_PASTO
} from '@/lib/services/areas-pastagem.service'

// Importar mapa dinamicamente (Leaflet precisa do window)
const PastoMap = dynamic(
  () => import('@/components/suporte-forrageiro/PastoMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] rounded-lg border border-border bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    )
  }
)

// Constantes para cálculo forrageiro
const MS_POR_HA_POR_CM = 50 // kg de MS por hectare por cm de altura
const UA_CONSUMO_DIARIO = 12 // kg de MS por dia por UA

export default function SuporteForrageiro() {
  // Estado do formulário
  const [pastoNome, setPastoNome] = useState('')
  const [pastoDescricao, setPastoDescricao] = useState('')
  const [loteId, setLoteId] = useState<string>('')
  const [tipoPasto, setTipoPasto] = useState<TipoPasto | ''>('')
  const [alturaEntrada, setAlturaEntrada] = useState<number | ''>('')
  const [alturaSaida, setAlturaSaida] = useState<number | ''>('')
  const [eficiencia, setEficiencia] = useState<number>(0.5) // 50% padrão

  // Estado do mapa e geometria
  const [geometry, setGeometry] = useState<PastoGeometry | null>(null)
  const [mapKey, setMapKey] = useState(0) // Para resetar o mapa

  // Estados de carregamento
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Dados carregados
  const [lotes, setLotes] = useState<LoteWithStats[]>([])
  const [areasSalvas, setAreasSalvas] = useState<AreaPastagemWithLote[]>([])

  // Carregar lotes e áreas salvas ao iniciar
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoadingData(true)
      const [lotesData, areasData] = await Promise.all([
        getLotes(),
        getAreasPastagem()
      ])
      setLotes(lotesData.filter(l => l.status === 'ativo'))
      setAreasSalvas(areasData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoadingData(false)
    }
  }

  // Atualizar alturas quando tipo de pasto mudar
  useEffect(() => {
    if (tipoPasto && TIPOS_PASTO[tipoPasto]) {
      const dados = TIPOS_PASTO[tipoPasto]
      // Usar média das alturas
      setAlturaEntrada(Math.round((dados.alturaEntradaMin + dados.alturaEntradaMax) / 2))
      setAlturaSaida(Math.round((dados.alturaSaidaMin + dados.alturaSaidaMax) / 2))
    }
  }, [tipoPasto])

  // Cálculos de capacidade forrageira
  const calcularCapacidadeForrageira = useCallback(() => {
    if (!geometry || !tipoPasto || alturaEntrada === '' || alturaSaida === '') {
      return null
    }

    const diferencaAltura = Number(alturaEntrada) - Number(alturaSaida)
    if (diferencaAltura <= 0) return null

    // MS disponível = área (ha) × diferença de altura (cm) × MS por ha por cm × eficiência
    const msTotal = geometry.areaHectares * diferencaAltura * MS_POR_HA_POR_CM * eficiencia

    // Capacidade em UA por dia = MS disponível / consumo diário por UA
    const capacidadeUA = msTotal / UA_CONSUMO_DIARIO

    return {
      msTotal: Math.round(msTotal),
      capacidadeUA: Math.round(capacidadeUA * 10) / 10
    }
  }, [geometry, tipoPasto, alturaEntrada, alturaSaida, eficiencia])

  const capacidade = calcularCapacidadeForrageira()

  const handlePolygonDrawn = (newGeometry: PastoGeometry) => {
    setGeometry(newGeometry)
  }

  const handleClearPolygon = () => {
    setGeometry(null)
  }

  // Limpar formulário completamente
  const limparFormulario = () => {
    setPastoNome('')
    setPastoDescricao('')
    setLoteId('')
    setTipoPasto('')
    setAlturaEntrada('')
    setAlturaSaida('')
    setEficiencia(0.5)
    setGeometry(null)
    setMapKey(prev => prev + 1) // Força o mapa a resetar
  }

  // Salvar área no banco de dados
  const handleSalvarArea = async (cadastrarOutra: boolean = false) => {
    if (!geometry) {
      toast.error('Desenhe a área do piquete primeiro')
      return
    }

    if (!pastoNome.trim()) {
      toast.error('Digite um nome para o piquete')
      return
    }

    if (!tipoPasto) {
      toast.error('Selecione o tipo de pasto')
      return
    }

    setSaving(true)

    try {
      await createAreaPastagem({
        nome: pastoNome.trim(),
        descricao: pastoDescricao.trim() || null,
        lote_id: loteId || null,
        area_hectares: geometry.areaHectares,
        perimetro_km: geometry.perimetroKm,
        centroid_lat: geometry.centroid[1],
        centroid_lng: geometry.centroid[0],
        bbox_json: geometry.bbox,
        geojson: geometry.geojson,
        pontos: geometry.pontos,
        // Novos campos
        tipo_pasto: tipoPasto,
        ms_total_kg: capacidade?.msTotal || null,
        altura_entrada_cm: alturaEntrada !== '' ? Number(alturaEntrada) : null,
        altura_saida_cm: alturaSaida !== '' ? Number(alturaSaida) : null,
        eficiencia: eficiencia,
        capacidade_ua: capacidade?.capacidadeUA || null
      })

      toast.success('Piquete salvo com sucesso!')

      // Recarregar áreas salvas
      const areasData = await getAreasPastagem()
      setAreasSalvas(areasData)

      if (cadastrarOutra) {
        // Limpar formulário e mapa para cadastrar outra
        limparFormulario()
        toast.success('Pronto para cadastrar novo piquete!')
      } else {
        // Apenas limpar o formulário
        limparFormulario()
      }
    } catch (err: any) {
      console.error('Erro ao salvar área:', err)
      toast.error(err.message || 'Erro ao salvar piquete')
    } finally {
      setSaving(false)
    }
  }

  // Deletar área salva
  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Tem certeza que deseja excluir este piquete?')) return

    try {
      await deleteAreaPastagem(areaId)
      toast.success('Piquete excluído!')
      const areasData = await getAreasPastagem()
      setAreasSalvas(areasData)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir piquete')
    }
  }

  // Validação para habilitar botões de salvar
  const podeSlavar = geometry && pastoNome.trim() && tipoPasto

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Cadastro de Piquetes</h1>
        <p className="text-muted-foreground text-lg">
          Suporte Forrageiro
        </p>
      </div>

      {/* Mensagem-guia da sessão */}
      <div className="card-leather p-6 bg-primary/5 border-primary/30">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🌾</span>
          <div>
            <h3 className="font-display text-xl mb-1 text-primary">Como funciona</h3>
            <p className="text-foreground">
              Cadastre seus piquetes uma única vez. O sistema usará essas informações para calcular automaticamente o tempo ideal de permanência dos lotes no futuro.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de Identificação */}
      <div className="card-leather p-6">
        <h3 className="font-display text-xl mb-4">Identificacao do Piquete</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome do Piquete */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Nome do Piquete *
            </label>
            <input
              type="text"
              value={pastoNome}
              onChange={(e) => setPastoNome(e.target.value)}
              placeholder="Ex: Piquete 1, Pasto da Nascente..."
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {!pastoNome.trim() && (
              <p className="text-xs text-warning mt-1">Obrigatório para salvar</p>
            )}
          </div>

          {/* Tipo de Pasto */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tipo de Pasto *
            </label>
            <select
              value={tipoPasto}
              onChange={(e) => setTipoPasto(e.target.value as TipoPasto | '')}
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Selecione o tipo de pasto</option>
              {Object.entries(TIPOS_PASTO).map(([key, dados]) => (
                <option key={key} value={key}>
                  {dados.nomeCompleto}
                </option>
              ))}
            </select>
            {tipoPasto && TIPOS_PASTO[tipoPasto] && (
              <p className="text-xs text-muted-foreground mt-1">
                Entrada: {TIPOS_PASTO[tipoPasto].alturaEntradaMin}-{TIPOS_PASTO[tipoPasto].alturaEntradaMax}cm |
                Saída: {TIPOS_PASTO[tipoPasto].alturaSaidaMin}-{TIPOS_PASTO[tipoPasto].alturaSaidaMax}cm
              </p>
            )}
          </div>
        </div>

        {/* Alturas e Eficiência */}
        {tipoPasto && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Altura de Entrada */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Altura de Entrada (cm)
              </label>
              <input
                type="number"
                value={alturaEntrada}
                onChange={(e) => setAlturaEntrada(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 35"
                min={0}
                max={200}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Altura para entrada dos animais
              </p>
            </div>

            {/* Altura de Saída */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Altura de Saída (cm)
              </label>
              <input
                type="number"
                value={alturaSaida}
                onChange={(e) => setAlturaSaida(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 15"
                min={0}
                max={200}
                className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Altura para retirada dos animais
              </p>
            </div>

            {/* Eficiência de Pastejo */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Eficiência de Pastejo: {Math.round(eficiencia * 100)}%
              </label>
              <input
                type="range"
                value={eficiencia}
                onChange={(e) => setEficiencia(Number(e.target.value))}
                min={0.3}
                max={0.8}
                step={0.05}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>30%</span>
                <span>50% (recomendado)</span>
                <span>80%</span>
              </div>
            </div>
          </div>
        )}

        {/* Vincular ao Lote e Descrição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Vincular ao Lote */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Vincular ao Lote (opcional)
            </label>
            <select
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
              disabled={loadingData}
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Sem vinculo (area geral)</option>
              {lotes.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.nome} ({lote.total_animais} animais)
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Descricao (opcional)
            </label>
            <input
              type="text"
              value={pastoDescricao}
              onChange={(e) => setPastoDescricao(e.target.value)}
              placeholder="Observacoes sobre este piquete..."
              className="w-full px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="card-leather p-6">
        <h3 className="font-display text-2xl mb-4">Desenhar Área do Piquete</h3>
        <PastoMap
          key={mapKey}
          onPolygonDrawn={handlePolygonDrawn}
          onClearPolygon={handleClearPolygon}
        />
      </div>

      {/* Resumo da Geometria e Capacidade Forrageira */}
      {geometry && (
        <div className="card-leather p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-2xl">{pastoNome || 'Piquete sem nome'}</h3>
              <p className="text-muted-foreground">
                {tipoPasto ? TIPOS_PASTO[tipoPasto]?.nomeCompleto : 'Tipo de pasto não definido'}
              </p>
            </div>
          </div>

          {/* Métricas de Área */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Área</p>
              <p className="font-display text-2xl text-primary">{geometry.areaHectares.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">hectares</p>
            </div>
            <div className="bg-accent/10 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Área</p>
              <p className="font-display text-2xl text-accent">{(geometry.areaHectares * 2.4).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">tarefas</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Perímetro</p>
              <p className="font-display text-2xl">{geometry.perimetroKm.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">km</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Pontos</p>
              <p className="font-display text-2xl">{geometry.pontos}</p>
              <p className="text-sm text-muted-foreground">vértices</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase mb-1">Centroide</p>
              <p className="font-mono text-xs">
                {geometry.centroid[0].toFixed(4)},<br/>
                {geometry.centroid[1].toFixed(4)}
              </p>
            </div>
          </div>

          {/* Capacidade Forrageira */}
          {capacidade && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-6 mb-6">
              <h4 className="font-display text-lg mb-4 flex items-center gap-2">
                <span>🌿</span>
                Potencial Forrageiro Estimado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Matéria Seca Disponível</p>
                  <p className="font-display text-3xl text-success">{capacidade.msTotal.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">kg de MS</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Capacidade de Suporte</p>
                  <p className="font-display text-3xl text-success">{capacidade.capacidadeUA}</p>
                  <p className="text-sm text-muted-foreground">UA por dia</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Aproveitamento</p>
                  <p className="font-display text-3xl">{alturaEntrada !== '' && alturaSaida !== '' ? Number(alturaEntrada) - Number(alturaSaida) : '-'}</p>
                  <p className="text-sm text-muted-foreground">cm de forragem</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                * Valores estimados com base em {MS_POR_HA_POR_CM} kg MS/ha/cm e consumo de {UA_CONSUMO_DIARIO} kg MS/UA/dia
              </p>
            </div>
          )}

          {/* Aviso se falta informação para cálculo */}
          {!capacidade && tipoPasto && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-warning flex items-center gap-2">
                <span>⚠️</span>
                Preencha as alturas de entrada e saída para calcular a capacidade forrageira
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Botão Salvar */}
            <button
              onClick={() => handleSalvarArea(false)}
              disabled={saving || !podeSlavar}
              className="bg-success hover:bg-success/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-3 text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="text-xl">💾</span>
                  Salvar
                </>
              )}
            </button>

            {/* Botão Salvar e Cadastrar Outra */}
            <button
              onClick={() => handleSalvarArea(true)}
              disabled={saving || !podeSlavar}
              className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-3 text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="text-xl">➕</span>
                  Salvar e Cadastrar Outra Área
                </>
              )}
            </button>
          </div>

          {!podeSlavar && (
            <p className="text-center text-sm text-warning mt-4">
              {!pastoNome.trim() && 'Digite um nome para o piquete. '}
              {!tipoPasto && 'Selecione o tipo de pasto. '}
              {!geometry && 'Desenhe a área no mapa.'}
            </p>
          )}
        </div>
      )}

      {/* Áreas Salvas */}
      <div className="card-leather p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl">PIQUETES CADASTRADOS</h3>
            <p className="text-muted-foreground text-sm">
              Seus piquetes com potencial forrageiro calculado
            </p>
          </div>
          <span className="text-2xl">🗺️</span>
        </div>

        {loadingData ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground">Carregando piquetes...</p>
          </div>
        ) : areasSalvas.length === 0 ? (
          <div className="text-center py-8 bg-muted/10 rounded-lg border border-border">
            <p className="text-4xl mb-3">🌾</p>
            <p className="text-muted-foreground mb-2">Nenhum piquete cadastrado ainda</p>
            <p className="text-sm text-muted-foreground">
              Desenhe uma área no mapa acima e clique em "Salvar"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {areasSalvas.map((area) => (
              <div
                key={area.id}
                className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border-2 border-border p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-display text-2xl text-foreground mb-1 tracking-wide">{area.nome}</h4>
                    {area.tipo_pasto && TIPOS_PASTO[area.tipo_pasto as TipoPasto] && (
                      <p className="text-sm text-primary font-medium">
                        {TIPOS_PASTO[area.tipo_pasto as TipoPasto].nome}
                      </p>
                    )}
                    {area.lote && (
                      <Link
                        href={`/dashboard/lotes/${area.lote.id}`}
                        className="text-sm text-accent hover:underline flex items-center gap-1 mt-1 font-medium"
                      >
                        <span>📍</span>
                        {area.lote.nome}
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteArea(area.id)}
                    className="text-error/50 hover:text-error text-lg p-2 rounded-lg hover:bg-error/10 transition-all"
                    title="Excluir piquete"
                  >
                    🗑️
                  </button>
                </div>

                {/* Métricas de Área */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-primary/15 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Área</p>
                    <p className="font-display text-2xl text-primary">{area.area_hectares.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">hectares</p>
                  </div>
                  <div className="bg-accent/15 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Área</p>
                    <p className="font-display text-2xl text-accent">{(area.area_hectares * 2.4).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">tarefas</p>
                  </div>
                </div>

                {/* Capacidade */}
                <div className="bg-success/10 rounded-lg p-3 text-center mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capacidade de Suporte</p>
                  <p className="font-display text-3xl text-success">
                    {area.capacidade_ua ? area.capacidade_ua : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">UA por dia</p>
                </div>

                {/* Detalhes do Pasto */}
                {area.tipo_pasto && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-muted/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground mb-1">Entrada</p>
                      <p className="font-display text-lg">{area.altura_entrada_cm || '-'}</p>
                      <p className="text-muted-foreground">cm</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground mb-1">Saída</p>
                      <p className="font-display text-lg">{area.altura_saida_cm || '-'}</p>
                      <p className="text-muted-foreground">cm</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground mb-1">MS Total</p>
                      <p className="font-display text-lg">{area.ms_total_kg ? (area.ms_total_kg / 1000).toFixed(1) : '-'}</p>
                      <p className="text-muted-foreground">ton</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4 text-center border-t border-border/50 pt-3">
                  Cadastrado em {new Date(area.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
