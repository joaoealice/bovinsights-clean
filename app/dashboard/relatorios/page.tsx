'use client'

import Link from 'next/link'

interface Relatorio {
  id: string
  titulo: string
  descricao: string
  icon: string
  href: string
  categoria: string
  status: 'disponivel' | 'em_breve'
}

const relatorios: Relatorio[] = [
  {
    id: 'credito-rural',
    titulo: 'Capacidade Produtiva e Pagamento',
    descricao: 'Relatório para apresentação a bancos e instituições financeiras. Demonstra capacidade produtiva, receita estimada e capacidade de pagamento.',
    icon: '🏦',
    href: '/dashboard/relatorios/credito-rural',
    categoria: 'Crédito Rural',
    status: 'disponivel',
  },
  {
    id: 'desempenho-lotes',
    titulo: 'Desempenho de Lotes',
    descricao: 'Análise comparativa de desempenho entre lotes, incluindo GMD, conversão alimentar e custos.',
    icon: '📊',
    href: '/dashboard/relatorios/desempenho-lotes',
    categoria: 'Produção',
    status: 'em_breve',
  },
  {
    id: 'custo-producao',
    titulo: 'Custo de Produção por Arroba',
    descricao: 'Detalhamento dos custos de produção por arroba produzida, incluindo alimentação, sanidade e mão de obra.',
    icon: '💰',
    href: '/dashboard/relatorios/custo-producao',
    categoria: 'Financeiro',
    status: 'em_breve',
  },
  {
    id: 'historico-sanitario',
    titulo: 'Histórico Sanitário',
    descricao: 'Registro completo de vacinações, vermifugações e tratamentos realizados no rebanho.',
    icon: '💉',
    href: '/dashboard/relatorios/historico-sanitario',
    categoria: 'Sanidade',
    status: 'em_breve',
  },
]

export default function RelatoriosPage() {
  const relatoriosDisponiveis = relatorios.filter(r => r.status === 'disponivel')
  const relatoriosEmBreve = relatorios.filter(r => r.status === 'em_breve')

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl md:text-5xl mb-2">RELATÓRIOS</h1>
        <p className="text-muted-foreground">
          Documentos e análises para gestão e apresentação a terceiros
        </p>
      </div>

      {/* Relatórios Disponíveis */}
      <div>
        <h2 className="font-display text-2xl mb-4">Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {relatoriosDisponiveis.map((relatorio) => (
            <Link key={relatorio.id} href={relatorio.href}>
              <div className="card-leather p-6 hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{relatorio.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-semibold">
                        {relatorio.categoria}
                      </span>
                    </div>
                    <h3 className="font-display text-xl mb-2 group-hover:text-primary transition-colors">
                      {relatorio.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {relatorio.descricao}
                    </p>
                  </div>
                  <span className="text-2xl text-muted-foreground group-hover:text-primary transition-colors">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Em Breve */}
      {relatoriosEmBreve.length > 0 && (
        <div>
          <h2 className="font-display text-2xl mb-4 text-muted-foreground">Em Breve</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatoriosEmBreve.map((relatorio) => (
              <div
                key={relatorio.id}
                className="card-leather p-6 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl grayscale">{relatorio.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full font-semibold">
                        {relatorio.categoria}
                      </span>
                      <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full font-semibold">
                        Em breve
                      </span>
                    </div>
                    <h3 className="font-display text-xl mb-2">
                      {relatorio.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {relatorio.descricao}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informação */}
      <div className="card-leather p-6 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">📋</span>
          <div>
            <h3 className="font-display text-xl mb-2">Sobre os Relatórios</h3>
            <p className="text-muted-foreground text-sm">
              Os relatórios são gerados com base nos dados cadastrados no sistema.
              Para relatórios mais precisos, mantenha as informações de lotes, pesagens,
              manejos e despesas sempre atualizadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
