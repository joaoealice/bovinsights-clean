'use client'

import Link from 'next/link'
import CotacaoBoiCard from '@/components/mercado/CotacaoBoiCard'
import IndicadoresMercadoCard from '@/components/mercado/IndicadoresMercadoCard'
import TotalArrobasCard from '@/components/dashboard/TotalArrobasCard'
import KPIsCard from '@/components/dashboard/KPIsCard'
import ClimaCard from '@/components/dashboard/ClimaCard'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Cards de Mercado e Estoque */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CotacaoBoiCard />
        <IndicadoresMercadoCard />
        <TotalArrobasCard />
      </section>

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
