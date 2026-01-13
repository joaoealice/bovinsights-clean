import { NextRequest, NextResponse } from 'next/server'

interface STACItem {
  id: string
  properties: {
    datetime: string
    'eo:cloud_cover'?: number
  }
  assets: {
    visual?: {
      href: string
    }
    rendered_preview?: {
      href: string
    }
  }
}

interface STACResponse {
  features: STACItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bbox } = body

    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return NextResponse.json(
        { error: 'bbox inválido. Deve ser um array [minLng, minLat, maxLng, maxLat]' },
        { status: 400 }
      )
    }

    // Buscar imagens Sentinel-2 via STAC público do Planetary Computer
    const stacUrl = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'

    const payload = {
      collections: ['sentinel-2-l2a'],
      bbox: bbox,
      datetime: '2024-01-01/2026-12-31',
      limit: 10,
      sortby: [{ field: 'properties.datetime', direction: 'desc' }]
    }

    const response = await fetch(stacUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('STAC API error:', errorText)
      return NextResponse.json(
        { error: 'Erro ao consultar API de satélite' },
        { status: 500 }
      )
    }

    const data: STACResponse = await response.json()

    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma imagem encontrada para esta área' },
        { status: 404 }
      )
    }

    // Filtrar imagens com baixa cobertura de nuvens (menos de 30%)
    const filteredImages = data.features.filter(
      (item) => (item.properties['eo:cloud_cover'] ?? 100) < 30
    )

    const imageToUse = filteredImages.length > 0 ? filteredImages[0] : data.features[0]

    // Pegar a URL da imagem preview ou visual
    const imageUrl =
      imageToUse.assets.rendered_preview?.href ||
      imageToUse.assets.visual?.href ||
      null

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Imagem não disponível para visualização' },
        { status: 404 }
      )
    }

    // Extrair a data da imagem
    const imageDate = imageToUse.properties.datetime
      ? imageToUse.properties.datetime.split('T')[0]
      : 'Data desconhecida'

    const cloudCover = imageToUse.properties['eo:cloud_cover'] ?? 0

    return NextResponse.json({
      imageUrl,
      date: imageDate,
      cloudCover: Math.round(cloudCover),
    })

  } catch (error) {
    console.error('Erro no endpoint satellite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
