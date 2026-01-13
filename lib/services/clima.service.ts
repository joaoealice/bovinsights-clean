import { createClient } from '@/lib/supabase/client'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface Coordenadas {
  latitude: number
  longitude: number
  cidade?: string
  estado?: string
}

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string // Estado
  admin2?: string // Município
}

export interface WeatherData {
  id?: string
  usuario_id?: string
  cidade: string | null
  estado: string | null
  latitude: number
  longitude: number
  temperatura_atual: number | null
  temperatura_maxima: number | null
  temperatura_minima: number | null
  sensacao_termica: number | null
  umidade_relativa: number | null
  precipitacao: number | null
  probabilidade_chuva: number | null
  velocidade_vento: number | null
  direcao_vento: number | null
  rajada_vento: number | null
  pressao_atmosferica: number | null
  indice_uv: number | null
  visibilidade: number | null
  cobertura_nuvens: number | null
  codigo_clima: number | null
  descricao_clima: string | null
  nascer_sol: string | null
  por_sol: string | null
  duracao_dia_horas: number | null
  indice_estresse_termico: number | null
  alerta_estresse: 'normal' | 'leve' | 'moderado' | 'severo' | null
  previsao_json: PrevisaoDia[] | null
  data_consulta: string
  fonte?: string
  created_at?: string
  updated_at?: string
}

export interface PrevisaoDia {
  data: string
  temperatura_maxima: number
  temperatura_minima: number
  precipitacao: number
  probabilidade_chuva: number
  codigo_clima: number
  descricao_clima: string
  nascer_sol: string
  por_sol: string
}

// Mapeamento de códigos WMO para descrições em português
export const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Névoa',
  48: 'Névoa com geada',
  51: 'Garoa leve',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante leve',
  57: 'Garoa congelante intensa',
  61: 'Chuva leve',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante leve',
  67: 'Chuva congelante forte',
  71: 'Neve leve',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Granizo fino',
  80: 'Pancadas leves',
  81: 'Pancadas moderadas',
  82: 'Pancadas violentas',
  85: 'Neve em pancadas leve',
  86: 'Neve em pancadas forte',
  95: 'Tempestade',
  96: 'Tempestade com granizo leve',
  99: 'Tempestade com granizo forte',
}

// Ícones para condições climáticas
export const WEATHER_ICONS: Record<string, string> = {
  'Céu limpo': '☀️',
  'Predominantemente limpo': '🌤️',
  'Parcialmente nublado': '⛅',
  'Nublado': '☁️',
  'Névoa': '🌫️',
  'Névoa com geada': '🌫️',
  'Garoa leve': '🌧️',
  'Garoa moderada': '🌧️',
  'Garoa intensa': '🌧️',
  'Garoa congelante leve': '🌧️',
  'Garoa congelante intensa': '🌧️',
  'Chuva leve': '🌧️',
  'Chuva moderada': '🌧️',
  'Chuva forte': '🌧️',
  'Chuva congelante leve': '🌧️',
  'Chuva congelante forte': '🌧️',
  'Neve leve': '🌨️',
  'Neve moderada': '🌨️',
  'Neve forte': '🌨️',
  'Granizo fino': '🌨️',
  'Pancadas leves': '🌦️',
  'Pancadas moderadas': '🌦️',
  'Pancadas violentas': '⛈️',
  'Neve em pancadas leve': '🌨️',
  'Neve em pancadas forte': '🌨️',
  'Tempestade': '⛈️',
  'Tempestade com granizo leve': '⛈️',
  'Tempestade com granizo forte': '⛈️',
}

// =====================================================
// FUNÇÕES DE GEOCODIFICAÇÃO (Open-Meteo Geocoding API)
// =====================================================

/**
 * Converte município e estado em coordenadas geográficas
 * Usa a API gratuita do Open-Meteo Geocoding
 */
export async function geocodificarMunicipio(
  cidade: string,
  estado: string
): Promise<Coordenadas | null> {
  try {
    // Limpar espaços extras
    const cidadeLimpa = cidade.trim()
    const estadoLimpo = estado.trim()

    // Formatar busca: "Cidade, Estado, Brazil"
    const searchQuery = encodeURIComponent(`${cidadeLimpa}, ${estadoLimpo}, Brazil`)

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=pt&format=json`
    )

    if (!response.ok) {
      throw new Error(`Erro na geocodificação: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      // Tentar busca alternativa apenas com a cidade
      const altResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidadeLimpa)}&count=10&language=pt&format=json`
      )

      if (altResponse.ok) {
        const altData = await altResponse.json()
        // Filtrar por Brasil
        const brasilResults = altData.results?.filter(
          (r: GeocodingResult) => r.country === 'Brasil' || r.country === 'Brazil'
        )

        if (brasilResults && brasilResults.length > 0) {
          const result = brasilResults[0]
          return {
            latitude: result.latitude,
            longitude: result.longitude,
            cidade: result.name,
            estado: result.admin1 || estadoLimpo,
          }
        }
      }

      return null
    }

    // Filtrar resultados do Brasil
    const brasilResults = data.results.filter(
      (r: GeocodingResult) => r.country === 'Brasil' || r.country === 'Brazil'
    )

    if (brasilResults.length === 0) {
      return null
    }

    const result = brasilResults[0]
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      cidade: result.name,
      estado: result.admin1 || estadoLimpo,
    }
  } catch (error) {
    console.error('Erro ao geocodificar:', error)
    return null
  }
}

/**
 * Atualiza as coordenadas no perfil do usuário
 */
export async function atualizarCoordenadasPerfil(
  coordenadas: Coordenadas
): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { error } = await supabase
    .from('perfil_usuario')
    .update({
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      coordenadas_atualizadas_em: new Date().toISOString(),
    })
    .eq('usuario_id', user.id)

  if (error) throw error
}

/**
 * Obtém as coordenadas do perfil do usuário
 */
export async function obterCoordenadasPerfil(): Promise<Coordenadas | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: perfil, error } = await supabase
    .from('perfil_usuario')
    .select('latitude, longitude, cidade, estado')
    .eq('usuario_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  if (!perfil || !perfil.latitude || !perfil.longitude) {
    return null
  }

  return {
    latitude: perfil.latitude,
    longitude: perfil.longitude,
    cidade: perfil.cidade,
    estado: perfil.estado,
  }
}

// =====================================================
// FUNÇÕES DE CLIMA (Open-Meteo Weather API)
// =====================================================

/**
 * Busca dados climáticos atuais e previsão usando Open-Meteo
 */
export async function buscarDadosClimaticos(
  latitude: number,
  longitude: number
): Promise<Omit<WeatherData, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    timezone: 'America/Sao_Paulo',
    forecast_days: '7',
  })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Erro ao buscar dados climáticos: ${response.status}`)
  }

  const data = await response.json()

  // Processar dados atuais
  const current = data.current
  const daily = data.daily

  // Calcular índice de estresse térmico (ITU)
  const itu = calcularITU(
    current.temperature_2m,
    current.relative_humidity_2m
  )

  // Calcular duração do dia
  const nascer = daily.sunrise?.[0]
  const por = daily.sunset?.[0]
  const duracaoDia = calcularDuracaoDia(nascer, por)

  // Montar previsão dos próximos dias
  const previsao: PrevisaoDia[] = []
  for (let i = 0; i < 7; i++) {
    if (daily.time?.[i]) {
      previsao.push({
        data: daily.time[i],
        temperatura_maxima: daily.temperature_2m_max?.[i] ?? 0,
        temperatura_minima: daily.temperature_2m_min?.[i] ?? 0,
        precipitacao: daily.precipitation_sum?.[i] ?? 0,
        probabilidade_chuva: daily.precipitation_probability_max?.[i] ?? 0,
        codigo_clima: daily.weather_code?.[i] ?? 0,
        descricao_clima: WMO_WEATHER_CODES[daily.weather_code?.[i] ?? 0] || 'Desconhecido',
        nascer_sol: daily.sunrise?.[i]?.split('T')[1] || '',
        por_sol: daily.sunset?.[i]?.split('T')[1] || '',
      })
    }
  }

  return {
    cidade: null, // Será preenchido pelo caller
    estado: null,
    latitude,
    longitude,
    temperatura_atual: current.temperature_2m ?? null,
    temperatura_maxima: daily.temperature_2m_max?.[0] ?? null,
    temperatura_minima: daily.temperature_2m_min?.[0] ?? null,
    sensacao_termica: current.apparent_temperature ?? null,
    umidade_relativa: current.relative_humidity_2m ?? null,
    precipitacao: current.precipitation ?? null,
    probabilidade_chuva: daily.precipitation_probability_max?.[0] ?? null,
    velocidade_vento: current.wind_speed_10m ?? null,
    direcao_vento: current.wind_direction_10m ?? null,
    rajada_vento: current.wind_gusts_10m ?? null,
    pressao_atmosferica: current.pressure_msl ?? null,
    indice_uv: daily.uv_index_max?.[0] ?? null,
    visibilidade: null, // Open-Meteo não fornece visibilidade na API gratuita
    cobertura_nuvens: current.cloud_cover ?? null,
    codigo_clima: current.weather_code ?? null,
    descricao_clima: WMO_WEATHER_CODES[current.weather_code ?? 0] || 'Desconhecido',
    nascer_sol: nascer?.split('T')[1] || null,
    por_sol: por?.split('T')[1] || null,
    duracao_dia_horas: duracaoDia,
    indice_estresse_termico: itu.valor,
    alerta_estresse: itu.alerta,
    previsao_json: previsao,
    data_consulta: new Date().toISOString().split('T')[0],
    fonte: 'open-meteo',
  }
}

// =====================================================
// FUNÇÕES DE CÁLCULO
// =====================================================

/**
 * Calcula o Índice de Temperatura e Umidade (ITU)
 * para avaliação de estresse térmico em bovinos
 */
export function calcularITU(
  temperatura: number,
  umidade: number
): { valor: number; alerta: 'normal' | 'leve' | 'moderado' | 'severo' } {
  // Fórmula: ITU = 0.8 * T + (UR/100) * (T - 14.4) + 46.4
  const itu = 0.8 * temperatura + (umidade / 100) * (temperatura - 14.4) + 46.4

  let alerta: 'normal' | 'leve' | 'moderado' | 'severo'
  if (itu < 72) {
    alerta = 'normal'
  } else if (itu < 78) {
    alerta = 'leve'
  } else if (itu < 82) {
    alerta = 'moderado'
  } else {
    alerta = 'severo'
  }

  return {
    valor: Math.round(itu * 100) / 100,
    alerta,
  }
}

/**
 * Calcula a duração do dia em horas
 */
function calcularDuracaoDia(nascer: string | null, por: string | null): number | null {
  if (!nascer || !por) return null

  const nascerDate = new Date(nascer)
  const porDate = new Date(por)
  const diffMs = porDate.getTime() - nascerDate.getTime()
  const diffHoras = diffMs / (1000 * 60 * 60)

  return Math.round(diffHoras * 100) / 100
}

/**
 * Retorna a direção do vento em texto
 */
export function direcaoVentoTexto(graus: number): string {
  const direcoes = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                    'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']
  const index = Math.round(graus / 22.5) % 16
  return direcoes[index]
}

// =====================================================
// FUNÇÕES DE PERSISTÊNCIA
// =====================================================

/**
 * Salva ou atualiza dados climáticos no banco
 */
export async function salvarDadosClimaticos(
  dados: Omit<WeatherData, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>
): Promise<WeatherData> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // Upsert: atualiza se existir, cria se não existir
  const { data, error } = await supabase
    .from('weather_data')
    .upsert(
      {
        usuario_id: user.id,
        ...dados,
        previsao_json: dados.previsao_json as unknown as Record<string, unknown>,
      },
      {
        onConflict: 'usuario_id,data_consulta',
      }
    )
    .select()
    .single()

  if (error) throw error
  return data as WeatherData
}

/**
 * Obtém os dados climáticos mais recentes do banco
 */
export async function obterDadosClimaticos(): Promise<WeatherData | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('usuario_id', user.id)
    .order('data_consulta', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return data as WeatherData | null
}

/**
 * Verifica se os dados climáticos estão desatualizados
 * (mais de 1 hora desde a última atualização)
 */
export function dadosDesatualizados(dados: WeatherData | null): boolean {
  if (!dados) return true

  const hoje = new Date().toISOString().split('T')[0]
  if (dados.data_consulta !== hoje) return true

  if (!dados.updated_at) return true

  const ultimaAtualizacao = new Date(dados.updated_at)
  const agora = new Date()
  const diffHoras = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60)

  return diffHoras > 1
}

// =====================================================
// FUNÇÃO PRINCIPAL: OBTER CLIMA ATUALIZADO
// =====================================================

/**
 * Obtém dados climáticos atualizados para o usuário
 * 1. Verifica se tem coordenadas salvas
 * 2. Se não tiver, busca município/estado e geocodifica
 * 3. Busca dados climáticos da API
 * 4. Salva no banco e retorna
 */
export async function obterClimaAtualizado(): Promise<WeatherData | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  // 1. Obter perfil do usuário
  const { data: perfil, error: perfilError } = await supabase
    .from('perfil_usuario')
    .select('cidade, estado, latitude, longitude')
    .eq('usuario_id', user.id)
    .single()

  if (perfilError && perfilError.code !== 'PGRST116') throw perfilError

  if (!perfil || !perfil.cidade || !perfil.estado) {
    // Usuário não tem localização configurada
    return null
  }

  let latitude = perfil.latitude
  let longitude = perfil.longitude

  // 2. Se não tem coordenadas, geocodificar
  if (!latitude || !longitude) {
    const coordenadas = await geocodificarMunicipio(perfil.cidade, perfil.estado)

    if (!coordenadas) {
      throw new Error(`Não foi possível encontrar as coordenadas para ${perfil.cidade}, ${perfil.estado}`)
    }

    // Salvar coordenadas no perfil
    await atualizarCoordenadasPerfil(coordenadas)

    latitude = coordenadas.latitude
    longitude = coordenadas.longitude
  }

  // 3. Verificar se já temos dados atualizados
  const dadosExistentes = await obterDadosClimaticos()

  if (!dadosDesatualizados(dadosExistentes)) {
    return dadosExistentes
  }

  // 4. Buscar novos dados da API
  const dadosClima = await buscarDadosClimaticos(latitude, longitude)
  dadosClima.cidade = perfil.cidade
  dadosClima.estado = perfil.estado

  // 5. Salvar e retornar
  return await salvarDadosClimaticos(dadosClima)
}

/**
 * Força atualização dos dados climáticos (ignora cache)
 */
export async function forcarAtualizacaoClima(): Promise<WeatherData | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data: perfil, error } = await supabase
    .from('perfil_usuario')
    .select('cidade, estado, latitude, longitude')
    .eq('usuario_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  if (!perfil || !perfil.cidade || !perfil.estado) {
    return null
  }

  let latitude = perfil.latitude
  let longitude = perfil.longitude

  if (!latitude || !longitude) {
    const coordenadas = await geocodificarMunicipio(perfil.cidade, perfil.estado)

    if (!coordenadas) {
      throw new Error(`Não foi possível encontrar as coordenadas para ${perfil.cidade}, ${perfil.estado}`)
    }

    await atualizarCoordenadasPerfil(coordenadas)
    latitude = coordenadas.latitude
    longitude = coordenadas.longitude
  }

  const dadosClima = await buscarDadosClimaticos(latitude, longitude)
  dadosClima.cidade = perfil.cidade
  dadosClima.estado = perfil.estado

  return await salvarDadosClimaticos(dadosClima)
}

// =====================================================
// FUNÇÕES AUXILIARES PARA UI
// =====================================================

/**
 * Retorna a cor do alerta de estresse térmico
 */
export function corAlertaEstresse(alerta: string | null): string {
  switch (alerta) {
    case 'normal':
      return 'text-green-600 bg-green-100'
    case 'leve':
      return 'text-yellow-600 bg-yellow-100'
    case 'moderado':
      return 'text-orange-600 bg-orange-100'
    case 'severo':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * Retorna o ícone do tempo baseado no código WMO
 */
export function iconeClima(codigoOuDescricao: number | string | null): string {
  if (codigoOuDescricao === null) return '🌡️'

  if (typeof codigoOuDescricao === 'number') {
    const descricao = WMO_WEATHER_CODES[codigoOuDescricao]
    return WEATHER_ICONS[descricao] || '🌡️'
  }

  return WEATHER_ICONS[codigoOuDescricao] || '🌡️'
}

/**
 * Formata temperatura para exibição
 */
export function formatarTemperatura(temp: number | null): string {
  if (temp === null) return '--'
  return `${Math.round(temp)}°C`
}

/**
 * Formata umidade para exibição
 */
export function formatarUmidade(umidade: number | null): string {
  if (umidade === null) return '--'
  return `${Math.round(umidade)}%`
}

/**
 * Formata velocidade do vento
 */
export function formatarVento(velocidade: number | null, direcao: number | null): string {
  if (velocidade === null) return '--'
  const dir = direcao !== null ? ` ${direcaoVentoTexto(direcao)}` : ''
  return `${Math.round(velocidade)} km/h${dir}`
}
