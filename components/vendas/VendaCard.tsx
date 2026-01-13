'use client'

import Link from 'next/link'
import { VendaWithLote, OBJETIVO_MARGEM } from '@/lib/services/vendas.service'

interface VendaCardProps {
  venda: VendaWithLote
}

export default function VendaCard({ venda }: VendaCardProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <Link href={`/dashboard/vendas/${venda.id}`}>
      <div className="bg-muted/20 hover:bg-muted/40 rounded-lg p-4 transition-all cursor-pointer border border-transparent hover:border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Info Principal */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              venda.atingiu_objetivo ? 'bg-success/20' : 'bg-warning/20'
            }`}>
              {venda.atingiu_objetivo ? '🎯' : '📊'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{formatDate(venda.data_venda)}</p>
                {venda.lote && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                    {venda.lote.nome}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {venda.quantidade_cabecas} cab. | {venda.peso_total_arrobas.toFixed(1)}@ | R$ {venda.preco_arroba_venda.toFixed(2)}/@
              </p>
              {venda.comprador && (
                <p className="text-xs text-muted-foreground mt-1">
                  Comprador: {venda.comprador}
                </p>
              )}
            </div>
          </div>

          {/* Valores */}
          <div className="flex items-center gap-6">
            {/* Valor Venda */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor Venda</p>
              <p className="font-mono font-bold text-primary">{formatCurrency(venda.valor_total_venda)}</p>
            </div>

            {/* Lucro */}
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Lucro</p>
              <p className={`font-mono font-bold ${venda.lucro_bruto >= 0 ? 'text-success' : 'text-error'}`}>
                {formatCurrency(venda.lucro_bruto)}
              </p>
            </div>

            {/* Margem */}
            <div className={`text-center px-4 py-2 rounded-lg ${
              venda.atingiu_objetivo
                ? 'bg-success/20 border border-success'
                : 'bg-warning/20 border border-warning'
            }`}>
              <p className="text-xs text-muted-foreground">Margem</p>
              <p className={`font-mono font-bold text-xl ${
                venda.atingiu_objetivo ? 'text-success' : 'text-warning'
              }`}>
                {venda.margem_percentual.toFixed(1)}%
              </p>
            </div>

            {/* Post Mortem Badge */}
            {venda.post_mortem_rendimento_carcaca && (
              <div className="text-center px-3 py-2 rounded-lg bg-muted/40">
                <p className="text-xs text-muted-foreground">Rend. Carcaça</p>
                <p className="font-mono font-bold">{venda.post_mortem_rendimento_carcaca.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
