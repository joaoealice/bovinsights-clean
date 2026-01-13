'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getCustoCabecaMesGeral } from '@/lib/services/financeiro.service'

interface KPIData {
  totalAnimais: number
  totalLotes: number
  lotesAtivos: number
  pesoMedio: number
  totalArrobas: number
  custoCabecaMes: number
  custoTotalMes: number
  variacaoCusto: number
}

export default function KPIsCard() {
  const [data, setData] = useState<KPIData>({
    totalAnimais: 0,
    totalLotes: 0,
    lotesAtivos: 0,
    pesoMedio: 0,
    totalArrobas: 0,
    custoCabecaMes: 0,
    custoTotalMes: 0,
    variacaoCusto: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar lotes com peso_total_entrada
      const { data: lotes } = await supabase
        .from('lotes')
        .select('id, status, quantidade_total, peso_total_entrada')
        .eq('usuario_id', user.id)

      // Buscar animais
      const { data: animais } = await supabase
        .from('animais')
        .select('peso_atual, status')
        .eq('usuario_id', user.id)

      const totalLotes = lotes?.length || 0
      const lotesAtivos = lotes?.filter(l => l.status === 'ativo').length || 0

      // Total de animais dos lotes
      const totalAnimaisLotes = lotes?.reduce((sum, l) => sum + (l.quantidade_total || 0), 0) || 0

      // Total de animais cadastrados individualmente
      const animaisAtivos = animais?.filter(a => a.status === 'Ativo') || []
      const totalAnimaisCadastrados = animaisAtivos.length

      // Usar o maior valor (lotes ou cadastrados)
      const totalAnimais = Math.max(totalAnimaisLotes, totalAnimaisCadastrados)

      // Peso médio e arrobas
      let pesoMedio = 0
      let totalKg = 0

      // Se há animais cadastrados, usar os pesos deles
      if (animaisAtivos.length > 0) {
        const pesos = animaisAtivos.map(a => a.peso_atual || 0).filter(p => p > 0)
        pesoMedio = pesos.length > 0 ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 0
        totalKg = pesos.reduce((a, b) => a + b, 0)
      } else if (lotes && lotes.length > 0) {
        // Se não há animais cadastrados, usar peso_total_entrada dos lotes
        const lotesAtivosData = lotes.filter(l => l.status === 'ativo')
        totalKg = lotesAtivosData.reduce((sum, l) => sum + (l.peso_total_entrada || 0), 0)
        const totalAnimaisLotesAtivos = lotesAtivosData.reduce((sum, l) => sum + (l.quantidade_total || 0), 0)
        pesoMedio = totalAnimaisLotesAtivos > 0 ? totalKg / totalAnimaisLotesAtivos : 0
      }

      const totalArrobas = totalKg / 30

      // Buscar custo/cabeça/mês
      let custoCabecaMes = 0
      let custoTotalMes = 0
      let variacaoCusto = 0
      try {
        const custosData = await getCustoCabecaMesGeral()
        custoCabecaMes = custosData.custoCabecaMesAtual
        custoTotalMes = custosData.custoMesAtual
        variacaoCusto = custosData.variacao
      } catch (e) {
        console.error('Erro ao carregar custos:', e)
      }

      setData({
        totalAnimais,
        totalLotes,
        lotesAtivos,
        pesoMedio: Math.round(pesoMedio * 10) / 10,
        totalArrobas: Math.round(totalArrobas * 100) / 100,
        custoCabecaMes,
        custoTotalMes,
        variacaoCusto
      })
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const kpis = [
    {
      icon: 'boi',
      label: 'Total de Animais',
      value: data.totalAnimais.toLocaleString('pt-BR'),
      subtext: `${data.lotesAtivos} lotes ativos`,
      trend: 'neutral'
    },
    {
      icon: '📦',
      label: 'Total de Lotes',
      value: data.totalLotes.toString(),
      subtext: `${data.lotesAtivos} ativos`,
      trend: 'neutral'
    },
    {
      icon: '⚖️',
      label: 'Peso Medio',
      value: data.pesoMedio > 0 ? `${data.pesoMedio} kg` : '-',
      subtext: data.pesoMedio > 0 ? `${(data.pesoMedio / 30).toFixed(2)} @` : 'Sem dados',
      trend: 'neutral'
    },
    {
      icon: '💰',
      label: 'Custo/Cabeca/Mes',
      value: data.custoCabecaMes > 0 ? formatCurrency(data.custoCabecaMes) : '-',
      subtext: data.custoTotalMes > 0
        ? `Total: ${formatCurrency(data.custoTotalMes)}`
        : 'Sem despesas',
      trend: data.variacaoCusto > 0 ? 'up' : data.variacaoCusto < 0 ? 'down' : 'neutral',
      trendValue: data.variacaoCusto !== 0 ? `${data.variacaoCusto > 0 ? '+' : ''}${data.variacaoCusto}%` : null
    }
  ]

  if (loading) {
    return (
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card-leather p-4 md:p-6 animate-pulse">
            <div className="h-10 bg-muted/30 rounded mb-4"></div>
            <div className="h-6 bg-muted/30 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted/30 rounded"></div>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="card-leather p-4 md:p-6 space-y-3 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-3xl md:text-4xl">
              {kpi.icon === 'boi' ? (
                <Image
                  src="https://vwlawfsvfnibduovqtjh.supabase.co/storage/v1/object/public/imagens/boi_cor.png"
                  alt="Boi"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : kpi.icon === '@' ? (
                <span className="font-display text-primary">@</span>
              ) : (
                kpi.icon
              )}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
            <p className="font-display text-2xl md:text-3xl">{kpi.value}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{kpi.subtext}</p>
              {(kpi as any).trendValue && (
                <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                  kpi.trend === 'up' ? 'bg-error/20 text-error' :
                  kpi.trend === 'down' ? 'bg-success/20 text-success' :
                  'bg-muted/20 text-muted-foreground'
                }`}>
                  {(kpi as any).trendValue}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
