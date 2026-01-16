'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Interface para geometria do pasto (preparada para uso futuro)
export interface PastoGeometry {
  coordinates: [number, number][] // [lat, lng]
  bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
  centroid: [number, number] // [lat, lng]
  areaHectares: number
  perimetroKm: number
  pontos: number
  // Preparado para uso futuro
  geojson: {
    type: 'Polygon'
    coordinates: [number, number][][] // GeoJSON format [lng, lat]
  }
}

interface PastoMapProps {
  onPolygonDrawn: (geometry: PastoGeometry) => void
  onClearPolygon: () => void
  fullscreenOnDraw?: boolean // Ativa modo fullscreen ao desenhar
}

// Definição das camadas disponíveis
const MAP_LAYERS = {
  mapa: {
    name: 'Mapa',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satelite: {
    name: 'Satélite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  terreno: {
    name: 'Terreno',
    icon: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  hibrido: {
    name: 'Híbrido',
    icon: '🏷️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    overlay: {
      url: 'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
      attribution: '&copy; Stamen Design',
    }
  },
}

type MapLayerKey = keyof typeof MAP_LAYERS
type InputMode = 'desenho' | 'coordenadas'

// Funções utilitárias de geometria
function calcularAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0

  // Fórmula de Shoelace com correção para latitude
  let area = 0
  const n = coords.length

  // Usar a latitude média para correção
  const latMedia = coords.reduce((sum, c) => sum + c[0], 0) / n
  const correcaoLat = Math.cos(latMedia * Math.PI / 180)

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    // coords[i] = [lat, lng]
    const x1 = coords[i][1] * correcaoLat * 111.32 // lng em km
    const y1 = coords[i][0] * 111.32 // lat em km
    const x2 = coords[j][1] * correcaoLat * 111.32
    const y2 = coords[j][0] * 111.32

    area += x1 * y2 - x2 * y1
  }

  area = Math.abs(area) / 2
  return area * 100 // km² para hectares
}

function calcularPerimetro(coords: [number, number][]): number {
  if (coords.length < 2) return 0

  let perimetro = 0
  const n = coords.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const lat1 = coords[i][0] * Math.PI / 180
    const lat2 = coords[j][0] * Math.PI / 180
    const dLat = lat2 - lat1
    const dLng = (coords[j][1] - coords[i][1]) * Math.PI / 180

    // Fórmula de Haversine
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    perimetro += 6371 * c // Raio da Terra em km
  }

  return perimetro
}

function calcularCentroide(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [0, 0]

  const sumLat = coords.reduce((sum, c) => sum + c[0], 0)
  const sumLng = coords.reduce((sum, c) => sum + c[1], 0)

  return [sumLat / coords.length, sumLng / coords.length]
}

function calcularBbox(coords: [number, number][]): [number, number, number, number] {
  if (coords.length === 0) return [0, 0, 0, 0]

  const lats = coords.map(c => c[0])
  const lngs = coords.map(c => c[1])

  return [
    Math.min(...lngs), // minLng (west)
    Math.min(...lats), // minLat (south)
    Math.max(...lngs), // maxLng (east)
    Math.max(...lats), // maxLat (north)
  ]
}

// Verificar se duas linhas se intersectam
function linhasIntersectam(
  p1: [number, number], p2: [number, number],
  p3: [number, number], p4: [number, number]
): boolean {
  const ccw = (A: [number, number], B: [number, number], C: [number, number]) => {
    return (C[0] - A[0]) * (B[1] - A[1]) > (B[0] - A[0]) * (C[1] - A[1])
  }

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4)
}

// Verificar autointerseção do polígono
function temAutoIntersecao(coords: [number, number][]): boolean {
  const n = coords.length
  if (n < 4) return false

  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      // Não verificar linhas adjacentes
      if (i === 0 && j === n - 1) continue

      const p1 = coords[i]
      const p2 = coords[(i + 1) % n]
      const p3 = coords[j]
      const p4 = coords[(j + 1) % n]

      if (linhasIntersectam(p1, p2, p3, p4)) {
        return true
      }
    }
  }

  return false
}

// Converter para GeoJSON (formato [lng, lat])
function toGeoJSON(coords: [number, number][]): { type: 'Polygon'; coordinates: [number, number][][] } {
  // GeoJSON usa [lng, lat], nosso formato é [lat, lng]
  const geoCoords = coords.map(c => [c[1], c[0]] as [number, number])
  // Fechar o polígono se necessário
  if (geoCoords.length > 0 &&
      (geoCoords[0][0] !== geoCoords[geoCoords.length - 1][0] ||
       geoCoords[0][1] !== geoCoords[geoCoords.length - 1][1])) {
    geoCoords.push([...geoCoords[0]] as [number, number])
  }

  return {
    type: 'Polygon',
    coordinates: [geoCoords]
  }
}

export default function PastoMap({ onPolygonDrawn, onClearPolygon, fullscreenOnDraw = true }: PastoMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const baseLayerRef = useRef<L.TileLayer | null>(null)
  const overlayLayerRef = useRef<L.TileLayer | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)
  const pointsRef = useRef<L.LatLng[]>([])
  const markersRef = useRef<L.CircleMarker[]>([])
  const tempLineRef = useRef<L.Polyline | null>(null)
  const locationMarkerRef = useRef<L.Marker | null>(null)
  const areaLabelRef = useRef<L.Marker | null>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [hasPolygon, setHasPolygon] = useState(false)
  const [pointCount, setPointCount] = useState(0)
  const [activeLayer, setActiveLayer] = useState<MapLayerKey>('mapa')
  const [inputMode, setInputMode] = useState<InputMode>('desenho')
  const [currentGeometry, setCurrentGeometry] = useState<PastoGeometry | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Estados para busca de localização
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Estados para coordenadas manuais (busca)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  // Estados para entrada de coordenadas do polígono
  const [coordenadasTexto, setCoordenadasTexto] = useState('')
  const [coordenadasErro, setCoordenadasErro] = useState('')
  const [coordenadasLista, setCoordenadasLista] = useState<[number, number][]>([])
  const [editandoPonto, setEditandoPonto] = useState<number | null>(null)

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [-15.7801, -47.9292],
      zoom: 5,
      zoomControl: true,
    })

    const layer = MAP_LAYERS.mapa
    const tileLayer = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
    }).addTo(map)

    baseLayerRef.current = tileLayer
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Função para trocar camada do mapa
  const changeMapLayer = useCallback((layerKey: MapLayerKey) => {
    if (!mapRef.current) return

    const map = mapRef.current
    const layerConfig = MAP_LAYERS[layerKey]

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current)
    }

    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current)
      overlayLayerRef.current = null
    }

    const newBaseLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(map)

    baseLayerRef.current = newBaseLayer

    if ('overlay' in layerConfig && layerConfig.overlay) {
      const overlayLayer = L.tileLayer(layerConfig.overlay.url, {
        attribution: layerConfig.overlay.attribution,
        maxZoom: layerConfig.maxZoom,
      }).addTo(map)
      overlayLayerRef.current = overlayLayer
    }

    setActiveLayer(layerKey)
  }, [])

  // Criar geometria a partir das coordenadas
  const criarGeometria = useCallback((coords: [number, number][]): PastoGeometry | null => {
    if (coords.length < 4) return null

    const area = calcularAreaHectares(coords)
    const perimetro = calcularPerimetro(coords)
    const centroid = calcularCentroide(coords)
    const bbox = calcularBbox(coords)

    return {
      coordinates: coords,
      bbox,
      centroid,
      areaHectares: Math.round(area * 100) / 100,
      perimetroKm: Math.round(perimetro * 100) / 100,
      pontos: coords.length,
      geojson: toGeoJSON(coords)
    }
  }, [])

  // Desenhar polígono no mapa
  const desenharPoligono = useCallback((coords: [number, number][], centralizar: boolean = true) => {
    if (!mapRef.current || coords.length < 3) return

    const map = mapRef.current

    // Remover polígono anterior
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current)
    }

    // Remover marcadores anteriores
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    // Remover label de área anterior
    if (areaLabelRef.current) {
      map.removeLayer(areaLabelRef.current)
    }

    // Criar polígono
    const latLngs = coords.map(c => L.latLng(c[0], c[1]))
    const polygon = L.polygon(latLngs, {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.3,
      weight: 3,
    }).addTo(map)

    polygonRef.current = polygon

    // Adicionar marcadores editáveis nos vértices
    coords.forEach((coord, index) => {
      const marker = L.circleMarker([coord[0], coord[1]], {
        radius: 8,
        color: '#16a34a',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 3,
      }).addTo(map)

      // Adicionar número do ponto
      marker.bindTooltip(`P${index + 1}`, {
        permanent: false,
        direction: 'top',
        className: 'point-label'
      })

      markersRef.current.push(marker)
    })

    // Calcular e mostrar área no centro
    const geometry = criarGeometria(coords)
    if (geometry) {
      const areaLabel = L.marker(geometry.centroid, {
        icon: L.divIcon({
          className: 'area-label',
          html: `<div style="background: rgba(22, 163, 74, 0.9); color: white; padding: 8px 12px; border-radius: 8px; font-weight: bold; font-size: 14px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            📐 ${geometry.areaHectares.toFixed(2)} ha
          </div>`,
          iconSize: [100, 40],
          iconAnchor: [50, 20],
        })
      }).addTo(map)

      areaLabelRef.current = areaLabel
      setCurrentGeometry(geometry)
    }

    // Centralizar mapa no polígono
    if (centralizar) {
      try {
        const bounds = polygon.getBounds()
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
      } catch (e) {
        // Ignorar erros de zoom
        if (geometry) {
          map.setView(geometry.centroid, 14)
        }
      }
    }

    setHasPolygon(true)
  }, [criarGeometria])

  // Processar coordenadas inseridas manualmente
  const processarCoordenadas = useCallback(() => {
    setCoordenadasErro('')

    if (!coordenadasTexto.trim()) {
      setCoordenadasErro('Insira as coordenadas')
      return
    }

    try {
      // Tentar parsear como JSON primeiro
      let coords: [number, number][] = []

      // Limpar texto e tentar diferentes formatos
      const texto = coordenadasTexto.trim()

      // Formato 1: JSON array [[lat, lng], [lat, lng], ...]
      if (texto.startsWith('[')) {
        const parsed = JSON.parse(texto)
        if (Array.isArray(parsed)) {
          coords = parsed.map((p: any) => {
            if (Array.isArray(p) && p.length >= 2) {
              return [parseFloat(p[0]), parseFloat(p[1])] as [number, number]
            }
            throw new Error('Formato inválido')
          })
        }
      } else {
        // Formato 2: Linhas separadas (lat, lng ou lat lng)
        const linhas = texto.split('\n').filter(l => l.trim())
        coords = linhas.map((linha, idx) => {
          // Aceitar vírgula, espaço, tab ou ponto-e-vírgula como separador
          const partes = linha.trim().split(/[,\s\t;]+/).filter(p => p)

          if (partes.length < 2) {
            throw new Error(`Linha ${idx + 1}: formato inválido`)
          }

          const lat = parseFloat(partes[0].replace(',', '.'))
          const lng = parseFloat(partes[1].replace(',', '.'))

          if (isNaN(lat) || isNaN(lng)) {
            throw new Error(`Linha ${idx + 1}: coordenadas inválidas`)
          }

          if (lat < -90 || lat > 90) {
            throw new Error(`Linha ${idx + 1}: latitude deve estar entre -90 e 90`)
          }

          if (lng < -180 || lng > 180) {
            throw new Error(`Linha ${idx + 1}: longitude deve estar entre -180 e 180`)
          }

          return [lat, lng] as [number, number]
        })
      }

      // Validações
      if (coords.length < 4) {
        setCoordenadasErro(`Mínimo de 4 pontos necessários. Você inseriu ${coords.length}.`)
        return
      }

      // Verificar autointerseção
      if (temAutoIntersecao(coords)) {
        setCoordenadasErro('O polígono tem linhas que se cruzam. Verifique a ordem dos pontos.')
        return
      }

      // Sucesso - desenhar polígono
      setCoordenadasLista(coords)
      desenharPoligono(coords)

      const geometry = criarGeometria(coords)
      if (geometry) {
        onPolygonDrawn(geometry)
      }

    } catch (e: any) {
      setCoordenadasErro(e.message || 'Erro ao processar coordenadas')
    }
  }, [coordenadasTexto, desenharPoligono, criarGeometria, onPolygonDrawn])

  // Adicionar ponto manualmente
  const adicionarPonto = useCallback(() => {
    const lat = parseFloat(manualLat.replace(',', '.'))
    const lng = parseFloat(manualLng.replace(',', '.'))

    if (isNaN(lat) || isNaN(lng)) {
      setSearchError('Coordenadas inválidas')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSearchError('Coordenadas fora do intervalo válido')
      return
    }

    const novaLista = [...coordenadasLista, [lat, lng] as [number, number]]
    setCoordenadasLista(novaLista)
    setManualLat('')
    setManualLng('')
    setSearchError('')

    // Atualizar texto
    const novoTexto = novaLista.map(c => `${c[0]}, ${c[1]}`).join('\n')
    setCoordenadasTexto(novoTexto)

    // Se tiver 4+ pontos, desenhar
    if (novaLista.length >= 4) {
      if (!temAutoIntersecao(novaLista)) {
        desenharPoligono(novaLista)
        const geometry = criarGeometria(novaLista)
        if (geometry) {
          onPolygonDrawn(geometry)
        }
      }
    }
  }, [manualLat, manualLng, coordenadasLista, desenharPoligono, criarGeometria, onPolygonDrawn])

  // Remover ponto da lista
  const removerPonto = useCallback((index: number) => {
    const novaLista = coordenadasLista.filter((_, i) => i !== index)
    setCoordenadasLista(novaLista)

    const novoTexto = novaLista.map(c => `${c[0]}, ${c[1]}`).join('\n')
    setCoordenadasTexto(novoTexto)

    if (novaLista.length >= 4) {
      desenharPoligono(novaLista)
      const geometry = criarGeometria(novaLista)
      if (geometry) {
        onPolygonDrawn(geometry)
      }
    } else {
      clearDrawing()
    }
  }, [coordenadasLista, desenharPoligono, criarGeometria, onPolygonDrawn])

  // Função para ir até uma localização
  const goToLocation = useCallback((lat: number, lng: number, zoom: number = 15) => {
    if (!mapRef.current) return

    if (locationMarkerRef.current) {
      mapRef.current.removeLayer(locationMarkerRef.current)
    }

    const icon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })

    const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current)
    locationMarkerRef.current = marker

    mapRef.current.setView([lat, lng], zoom)
  }, [])

  // Buscar por endereço
  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchError('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=br`,
        { headers: { 'User-Agent': 'BovinsightsApp/1.0' } }
      )

      const data = await response.json()

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        goToLocation(parseFloat(lat), parseFloat(lon), 14)
        setSearchQuery(display_name.split(',')[0])
      } else {
        setSearchError('Local não encontrado. Tente outro termo.')
      }
    } catch (error) {
      setSearchError('Erro ao buscar localização. Tente novamente.')
    } finally {
      setSearching(false)
    }
  }

  // Ir para coordenadas manuais (busca)
  const goToManualCoordinates = () => {
    const lat = parseFloat(manualLat.replace(',', '.'))
    const lng = parseFloat(manualLng.replace(',', '.'))

    if (isNaN(lat) || isNaN(lng)) {
      setSearchError('Coordenadas inválidas')
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSearchError('Coordenadas fora do intervalo válido')
      return
    }

    setSearchError('')
    goToLocation(lat, lng, 16)
    setShowManualInput(false)
  }

  // Função para limpar o desenho
  const clearDrawing = useCallback(() => {
    if (!mapRef.current) return

    if (polygonRef.current) {
      mapRef.current.removeLayer(polygonRef.current)
      polygonRef.current = null
    }

    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker)
    })
    markersRef.current = []

    if (tempLineRef.current) {
      mapRef.current.removeLayer(tempLineRef.current)
      tempLineRef.current = null
    }

    if (areaLabelRef.current) {
      mapRef.current.removeLayer(areaLabelRef.current)
      areaLabelRef.current = null
    }

    pointsRef.current = []
    setPointCount(0)
    setHasPolygon(false)
    setIsDrawing(false)
    setCurrentGeometry(null)
    setCoordenadasLista([])
    setCoordenadasTexto('')
    setCoordenadasErro('')
    onClearPolygon()
  }, [onClearPolygon])

  // Iniciar modo de desenho
  const startDrawing = () => {
    clearDrawing()
    setIsDrawing(true)
    if (fullscreenOnDraw) {
      setIsFullscreen(true)
    }
  }

  // Sair do modo fullscreen
  const exitFullscreen = () => {
    setIsFullscreen(false)
  }

  // Finalizar polígono (modo desenho)
  const finishPolygon = useCallback(() => {
    if (!mapRef.current || pointsRef.current.length < 4) return

    const coords: [number, number][] = pointsRef.current.map(p => [p.lat, p.lng])

    // Verificar autointerseção
    if (temAutoIntersecao(coords)) {
      setSearchError('O polígono tem linhas que se cruzam. Limpe e desenhe novamente.')
      return
    }

    // Remover linha temporária
    if (tempLineRef.current) {
      mapRef.current.removeLayer(tempLineRef.current)
      tempLineRef.current = null
    }

    // Remover marcadores de desenho
    markersRef.current.forEach(m => mapRef.current?.removeLayer(m))
    markersRef.current = []

    setCoordenadasLista(coords)
    setCoordenadasTexto(coords.map(c => `${c[0]}, ${c[1]}`).join('\n'))

    desenharPoligono(coords, false)

    const geometry = criarGeometria(coords)
    if (geometry) {
      onPolygonDrawn(geometry)
    }

    setIsDrawing(false)
    setHasPolygon(true)
    setIsFullscreen(false) // Sair do fullscreen ao finalizar
  }, [desenharPoligono, criarGeometria, onPolygonDrawn])

  // Configurar eventos de clique no mapa
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return

      const point = e.latlng
      pointsRef.current.push(point)
      setPointCount(pointsRef.current.length)

      const marker = L.circleMarker(point, {
        radius: 6,
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map)

      marker.bindTooltip(`P${pointsRef.current.length}`, {
        permanent: false,
        direction: 'top'
      })

      markersRef.current.push(marker)

      if (tempLineRef.current) {
        map.removeLayer(tempLineRef.current)
      }

      if (pointsRef.current.length > 1) {
        tempLineRef.current = L.polyline(pointsRef.current, {
          color: '#16a34a',
          weight: 2,
          dashArray: '5, 10',
        }).addTo(map)
      }
    }

    const handleDoubleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawing) return
      L.DomEvent.stopPropagation(e)
      if (pointsRef.current.length >= 4) {
        finishPolygon()
      }
    }

    map.on('click', handleClick)
    map.on('dblclick', handleDoubleClick)

    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDoubleClick)
    }
  }, [isDrawing, finishPolygon])

  // Desabilitar zoom com double click durante desenho
  useEffect(() => {
    if (!mapRef.current) return

    if (isDrawing) {
      mapRef.current.doubleClickZoom.disable()
    } else {
      mapRef.current.doubleClickZoom.enable()
    }
  }, [isDrawing])

  // Invalidar tamanho do mapa quando fullscreen mudar
  useEffect(() => {
    if (!mapRef.current) return

    // Pequeno delay para garantir que o CSS foi aplicado
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize()
    }, 100)

    // Bloquear scroll do body quando em fullscreen
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [isFullscreen])

  // Conteúdo do mapa (reutilizado em modo normal e fullscreen)
  const mapContent = (
    <>
      {/* Seletor de camadas */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
            Tipo de Mapa
          </p>
          <div className="p-1">
            {(Object.keys(MAP_LAYERS) as MapLayerKey[]).map((layerKey) => {
              const layer = MAP_LAYERS[layerKey]
              const isActive = activeLayer === layerKey
              return (
                <button
                  key={layerKey}
                  onClick={() => changeMapLayer(layerKey)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>{layer.icon}</span>
                  <span>{layer.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Controles de desenho (botão Limpar) */}
      {inputMode === 'desenho' && hasPolygon && (
            <button
              onClick={clearDrawing}
              className="absolute top-4 right-4 z-[1000] bg-error hover:bg-error/90 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2"
            >
              <span>🗑️</span>
              Limpar
            </button>
          )}

      {/* Informações do polígono */}
      {currentGeometry && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-card/95 border border-border rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Área</p>
                <p className="font-display text-lg text-primary">{currentGeometry.areaHectares.toFixed(2)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Perímetro</p>
                <p className="font-display text-lg">{currentGeometry.perimetroKm.toFixed(2)} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="font-display text-lg">{currentGeometry.pontos}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              ✅ Geometria válida e pronta para análise
            </div>
          </div>
        </div>
      )}

      {/* Instrução inicial (somente no modo normal) */}
      {!isDrawing && !hasPolygon && inputMode === 'desenho' && !isFullscreen && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-card/95 border border-border rounded-lg p-3 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>1.</strong> Busque sua localização | <strong>2.</strong> Escolha o tipo de mapa | <strong>3.</strong> Clique em "Desenhar Pasto"
          </p>
        </div>
      )}
    </>
  )

  // Modal fullscreen para desenho
  if (isFullscreen) {
    return (
      <>
        {/* Placeholder para manter o espaço quando em fullscreen */}
        <div className="space-y-4">
          <div className="card-leather p-4 text-center">
            <p className="text-muted-foreground">
              Modo de desenho em tela cheia ativo...
            </p>
          </div>
        </div>

        {/* Modal Fullscreen */}
        <div className="fixed inset-0 z-[9999] bg-background">
          {/* Header do fullscreen */}
          <div className="absolute top-0 left-0 right-0 z-[10001] bg-card/95 backdrop-blur-sm border-b border-border p-4">
            <div className="flex items-center justify-between max-w-screen-xl mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h2 className="font-display text-xl">Desenhar Área do Piquete</h2>
                  <p className="text-sm text-muted-foreground">
                    Clique no mapa para marcar os pontos. Mínimo 4 pontos. Duplo clique para finalizar.
                  </p>
                </div>
              </div>
              {isDrawing && (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg flex flex-col gap-2">
                  <p className="text-sm text-foreground">
                    Clique para adicionar pontos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pointCount < 4
                      ? `Faltam ${4 - pointCount} pontos (mín. 4)`
                      : `${pointCount} pontos - pode finalizar`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={finishPolygon}
                      disabled={pointCount < 4}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                      Finalizar
                    </button>
                    <button
                      onClick={() => {
                        clearDrawing()
                        setIsFullscreen(false)
                      }}
                      className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm transition-all flex items-center gap-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  clearDrawing()
                  setIsFullscreen(false)
                }}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                <span>✕</span>
                Sair
              </button>
            </div>
          </div>

          {/* Mapa fullscreen */}
          <div
            ref={mapContainerRef}
            className="absolute inset-0 top-[72px]"
            style={{ cursor: isDrawing ? 'crosshair' : 'grab' }}
          />

          {mapContent}
        </div>
      </>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca de localização */}
      <div className="card-leather p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Buscar localização
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="Digite cidade, bairro ou endereço..."
                className="flex-1 px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button
                onClick={searchLocation}
                disabled={searching || !searchQuery.trim()}
                className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                {searching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <span>🔍</span>
                )}
                Buscar
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              <span>📍</span>
              {showManualInput ? 'Ocultar' : 'Ir para coordenada'}
            </button>
          </div>
        </div>

        {showManualInput && (
          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Ir para coordenada específica
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Latitude (ex: -23.5505)"
                className="flex-1 px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <input
                type="text"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                placeholder="Longitude (ex: -46.6333)"
                className="flex-1 px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button
                onClick={goToManualCoordinates}
                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg transition-all"
              >
                Ir
              </button>
            </div>
          </div>
        )}

        {searchError && (
          <p className="mt-2 text-sm text-error">{searchError}</p>
        )}
      </div>

      {/* Seletor de modo de entrada */}
      <div className="card-leather p-4">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-semibold text-foreground">Modo de entrada:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('desenho')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                inputMode === 'desenho'
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
            >
              <span>✏️</span>
              Desenhar no mapa
            </button>
            <button
              onClick={() => setInputMode('coordenadas')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                inputMode === 'coordenadas'
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
            >
              <span>📝</span>
              Inserir coordenadas
            </button>
          </div>
        </div>

        {/* Modo: Inserir coordenadas */}
        {inputMode === 'coordenadas' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Coordenadas do polígono (mínimo 4 pontos)
              </label>
              <textarea
                value={coordenadasTexto}
                onChange={(e) => setCoordenadasTexto(e.target.value)}
                placeholder={`Cole as coordenadas aqui, uma por linha:
-23.5505, -46.6333
-23.5510, -46.6340
-23.5520, -46.6335
-23.5515, -46.6325

Ou formato JSON: [[-23.5505, -46.6333], [-23.5510, -46.6340], ...]`}
                className="w-full h-40 px-4 py-3 rounded-lg bg-muted/30 border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: latitude, longitude (uma coordenada por linha) ou array JSON
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={processarCoordenadas}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <span>✅</span>
                Processar e Visualizar
              </button>
              {coordenadasLista.length > 0 && (
                <button
                  onClick={clearDrawing}
                  className="px-6 py-3 bg-error hover:bg-error/90 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                >
                  <span>🗑️</span>
                  Limpar
                </button>
              )}
            </div>

            {coordenadasErro && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                <p className="text-sm text-error">{coordenadasErro}</p>
              </div>
            )}

            {/* Lista de pontos */}
            {coordenadasLista.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Pontos do polígono ({coordenadasLista.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {coordenadasLista.map((coord, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-sm"
                    >
                      <span className="font-bold text-primary">P{idx + 1}</span>
                      <span className="font-mono text-xs flex-1">
                        {coord[0].toFixed(6)}, {coord[1].toFixed(6)}
                      </span>
                      <button
                        onClick={() => removerPonto(idx)}
                        className="text-error hover:bg-error/20 rounded p-1 transition-all"
                        title="Remover ponto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modo: Desenho */}
        {inputMode === 'desenho' && (
          <>
            {!isDrawing && !hasPolygon && (
              <button
                onClick={startDrawing}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 mt-4"
              >
                <span>✏️</span>
                Desenhar Pasto
              </button>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Use o botão "Desenhar Pasto" no mapa para marcar os pontos do perímetro.
              <strong> Mínimo 4 pontos.</strong> Duplo clique para finalizar.
            </p>
          </>
        )}
      </div>

      {/* Mapa */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[500px] rounded-lg border border-border overflow-hidden"
          style={{ cursor: isDrawing ? 'crosshair' : 'grab' }}
        />

        {mapContent}
      </div>
    </div>
  )
}
