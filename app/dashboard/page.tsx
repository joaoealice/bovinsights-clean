'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CotacaoBoiCard from '@/components/mercado/CotacaoBoiCard'
import IndicadoresMercadoCard from '@/components/mercado/IndicadoresMercadoCard'
import TotalArrobasCard from '@/components/dashboard/TotalArrobasCard'
import KPIsCard from '@/components/dashboard/KPIsCard'
import ClimaCard from '@/components/dashboard/ClimaCard'
import { getPerfilFazenda } from '@/lib/services/perfil.service'

export default function DashboardPage() {
  const router = useRouter()
  const [showConfigAlert, setShowConfigAlert] = useState(false)
  const [missingConfig, setMissingConfig] = useState<{ praca: boolean; localizacao: boolean }>({ praca: false, localizacao: false })

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const perfil = await getPerfilFazenda()
        if (perfil) {
          const faltaPraca = !perfil.praca_preferida
          const faltaLocalizacao = !perfil.cidade || !perfil.estado

          if (faltaPraca || faltaLocalizacao) {
            setMissingConfig({ praca: faltaPraca, localizacao: faltaLocalizacao })
            setShowConfigAlert(true)
          }
        }
      } catch {
        // Silently ignore
      }
    }
    checkConfig()
  }, [])

  const handleConfigClick = () => {
    router.push('/dashboard/configuracoes?section=fazenda')
  }

  return (
    <div className="space-y-8">
      {/* Alerta de Configuração Pendente */}
      {showConfigAlert && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Configuração pendente
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Para aproveitar todas as funcionalidades do sistema, configure:
                {missingConfig.localizacao && (
                  <span className="block">• <strong>Localização da fazenda</strong> — necessária para o monitoramento do clima</span>
                )}
                {missingConfig.praca && (
                  <span className="block">• <strong>Praça de atuação</strong> — necessária para cotação da @ e valor do estoque</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfigClick}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Configurar agora
                </button>
                <button
                  onClick={() => setShowConfigAlert(false)}
                  className="px-4 py-2 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/30 text-sm font-medium rounded-lg transition-colors"
                >
                  Lembrar depois
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cards de Mercado e Estoque */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CotacaoBoiCard />
        <IndicadoresMercadoCard />
        <TotalArrobasCard />
      </section>

      {/* Linha explicativa sobre Cotação vs Indicadores */}
      <p className="text-xs text-muted-foreground text-center -mt-4">
        💡 Entenda os valores: a Cotacao mostra o preco praticado hoje. O Indicador mostra a tendencia media do mercado.
      </p>

      {/* Card de Clima */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClimaCard />
      </section>

      {/* KPIs Dinâmicos */}
      <KPIsCard id="indicadores" />

      {/* Acesso Rapido */}
      <section id="historico">
        <h3 className="font-display text-2xl mb-4">ACESSO RAPIDO</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/lotes/novo" className="card-leather p-6 hover:scale-105 transition-all text-center group">
            <span className="text-4xl block mb-3">📍</span>
            <p className="font-display text-xl group-hover:text-primary transition-colors">NOVO LOTE</p>
          </Link>
          <Link href="/dashboard/pesagens/novo" className="card-leather p-6 hover:scale-105 transition-all text-center group">
            <span className="text-4xl block mb-3">⚖️</span>
            <p className="font-display text-xl group-hover:text-primary transition-colors">NOVA PESAGEM</p>
          </Link>
          <Link href="/dashboard/lotes" className="card-leather p-6 hover:scale-105 transition-all text-center group">
            <span className="text-4xl block mb-3">📋</span>
            <p className="font-display text-xl group-hover:text-primary transition-colors">VER LOTES</p>
          </Link>
          <Link href="/dashboard/pesagens" className="card-leather p-6 hover:scale-105 transition-all text-center group">
            <span className="text-4xl block mb-3">📊</span>
            <p className="font-display text-xl group-hover:text-primary transition-colors">VER PESAGENS</p>
          </Link>
        </div>
      </section>

      {/* Welcome Message */}
      <div className="card-leather p-8 text-center space-y-4">
        <h1 className="font-display text-4xl md:text-5xl text-foreground">
          BEM-VINDO AO BOVINSIGHTS!
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl font-body max-w-2xl mx-auto">
          Seu sistema de gestao pecuaria esta pronto! Use os menus para acessar as funcionalidades.
        </p>
        <div className="pt-4 space-y-2">
          <p className="text-base text-muted-foreground">Funcionalidades disponiveis:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-success/20 text-success rounded-full text-base font-mono font-semibold">
              Lotes
            </span>
            <span className="px-4 py-2 bg-success/20 text-success rounded-full text-base font-mono font-semibold">
              Pesagens
            </span>
            <span className="px-4 py-2 bg-success/20 text-success rounded-full text-base font-mono font-semibold">
              Financeiro
            </span>
            <span className="px-4 py-2 bg-success/20 text-success rounded-full text-base font-mono font-semibold">
              Cotacoes
            </span>
            <span className="px-4 py-2 bg-muted/30 text-muted-foreground rounded-full text-base font-mono">
              Animais (em breve)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
