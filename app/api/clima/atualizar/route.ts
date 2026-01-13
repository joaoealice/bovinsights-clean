import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Mapeamento de códigos WMO para descrições em português
const WMO_WEATHER_CODES: Record<number, string> = {
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

interface PerfilUsuario {
  usuario_id: string
  cidade: string
  estado: string
  latitude: number | null
  longitude: number | null
}

interface PrevisaoDia {
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

// Função para calcular ITU
function calcularITU(temperatura: number, umidade: number): { valor: number; alerta: string } {
  const itu = 0.8 * temperatura + (umidade / 100) * (temperatura - 14.4) + 46.4

  let alerta: string
  if (itu < 72) {
    alerta = 'normal'
  } else if (itu < 78) {
    alerta = 'leve'
  } else if (itu < 82) {
    alerta = 'moderado'
  } else {
    alerta = 'severo'
  }

  return { valor: Math.round(itu * 100) / 100, alerta }
}

// Função para geocodificar
async function geocodificar(cidade: string, estado: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const searchQuery = encodeURIComponent(`${cidade}, ${estado}, Brazil`)
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=5&language=pt&format=json`
    )

    if (!response.ok) return null

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      const altResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=10&language=pt&format=json`
      )

      if (altResponse.ok) {
        const altData = await altResponse.json()
        const brasilResults = altData.results?.filter(
          (r: { country: string }) => r.country === 'Brasil' || r.country === 'Brazil'
        )

        if (brasilResults && brasilResults.length > 0) {
          return {
            latitude: brasilResults[0].latitude,
            longitude: brasilResults[0].longitude,
          }
        }
      }
      return null
    }

    const brasilResults = data.results.filter(
      (r: { country: string }) => r.country === 'Brasil' || r.country === 'Brazil'
    )

    if (brasilResults.length === 0) return null

    return {
      latitude: brasilResults[0].latitude,
      longitude: brasilResults[0].longitude,
    }
  } catch (error) {
    console.error('Erro na geocodificação:', error)
    return null
  }
}

// Função para buscar dados climáticos
async function buscarClima(latitude: number, longitude: number) {
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

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Erro ao buscar clima: ${response.status}`)
  }

  return await response.json()
}

// Esta rota pode ser chamada via Vercel Cron Jobs
// Adicione ao vercel.json:
// {
//   "crons": [{
//     "path": "/api/clima/atualizar",
//     "schedule": "0 9 * * *"
//   }]
// }
export async function POST(request: Request) {
  // Verificar autorização
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Para Vercel Cron, verificar o header especial
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Verificar se é uma chamada autorizada
  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar todos os usuários com localização configurada
    const { data: perfis, error: perfilError } = await supabase
      .from('perfil_usuario')
      .select('usuario_id, cidade, estado, latitude, longitude')
      .not('cidade', 'is', null)
      .not('estado', 'is', null)

    if (perfilError) {
      throw new Error(`Erro ao buscar perfis: ${perfilError.message}`)
    }

    if (!perfis || perfis.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário com localização configurada',
        atualizados: 0
      })
    }

    const hoje = new Date().toISOString().split('T')[0]
    let atualizados = 0
    let erros = 0

    // Processar cada usuário
    for (const perfil of perfis as PerfilUsuario[]) {
      try {
        let latitude = perfil.latitude
        let longitude = perfil.longitude

        // Se não tem coordenadas, geocodificar
        if (!latitude || !longitude) {
          const coords = await geocodificar(perfil.cidade, perfil.estado)

          if (!coords) {
            erros++
            continue
          }

          // Atualizar coordenadas no perfil
          await supabase
            .from('perfil_usuario')
            .update({
              latitude: coords.latitude,
              longitude: coords.longitude,
              coordenadas_atualizadas_em: new Date().toISOString(),
            })
            .eq('usuario_id', perfil.usuario_id)

          latitude = coords.latitude
          longitude = coords.longitude
        }

        // Buscar dados climáticos
        const climaData = await buscarClima(latitude, longitude)

        const current = climaData.current
        const daily = climaData.daily

        // Calcular ITU
        const itu = calcularITU(current.temperature_2m, current.relative_humidity_2m)

        // Calcular duração do dia
        const nascer = daily.sunrise?.[0]
        const por = daily.sunset?.[0]
        let duracaoDia = null
        if (nascer && por) {
          const nascerDate = new Date(nascer)
          const porDate = new Date(por)
          duracaoDia = Math.round(((porDate.getTime() - nascerDate.getTime()) / (1000 * 60 * 60)) * 100) / 100
        }

        // Montar previsão
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

        // Upsert dados climáticos
        const { error: upsertError } = await supabase
          .from('weather_data')
          .upsert({
            usuario_id: perfil.usuario_id,
            cidade: perfil.cidade,
            estado: perfil.estado,
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
            cobertura_nuvens: current.cloud_cover ?? null,
            codigo_clima: current.weather_code ?? null,
            descricao_clima: WMO_WEATHER_CODES[current.weather_code ?? 0] || 'Desconhecido',
            nascer_sol: nascer?.split('T')[1] || null,
            por_sol: por?.split('T')[1] || null,
            duracao_dia_horas: duracaoDia,
            indice_estresse_termico: itu.valor,
            alerta_estresse: itu.alerta,
            previsao_json: previsao,
            data_consulta: hoje,
            fonte: 'open-meteo',
          }, {
            onConflict: 'usuario_id,data_consulta',
          })

        if (upsertError) {
          throw new Error(upsertError.message)
        }

        atualizados++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Erro ao processar usuário ${perfil.usuario_id}:`, error)
        erros++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Atualização concluída',
      total_usuarios: perfis.length,
      atualizados,
      erros,
      data: hoje,
    })

  } catch (error) {
    console.error('Erro na API de clima:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
    }, { status: 500 })
  }
}

// GET para verificar status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/clima/atualizar',
    method: 'POST',
    description: 'Atualiza dados climáticos de todos os usuários com localização configurada',
  })
}
