import Link from 'next/link'
import { getRelatorioDesempenhoLote } from '@/lib/services/relatorios.service'
import { format } from 'date-fns'

// Função auxiliar para formatação de números
const formatNumber = (value: number | null | undefined, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A'
  return value.toFixed(decimals)
}

export default async function DesempenhoLotesPage() {
  const dados = await getRelatorioDesempenhoLote()

  return (
    <div className="p-8 space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/dashboard/relatorios" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Voltar para Relatórios
          </Link>
          <h1 className="font-display text-3xl md:text-4xl">Relatório de Desempenho por Lote</h1>
          <p className="text-muted-foreground">
            Análise de eficiência e produtividade consolidada por lote.
          </p>
        </div>
        {/* Adicionar botões de exportação aqui futuramente */}
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
        <div className='flex-1'>
            <label htmlFor="fazenda" className="text-sm font-medium text-muted-foreground">Fazenda</label>
            <select id="fazenda" className="w-full p-2 border rounded-md bg-background" disabled>
                <option>Todas as fazendas</option>
            </select>
        </div>
        <div className='flex-1'>
            <label htmlFor="sistema_produtivo" className="text-sm font-medium text-muted-foreground">Sistema Produtivo</label>
            <select id="sistema_produtivo" className="w-full p-2 border rounded-md bg-background" disabled>
                <option>Todos</option>
            </select>
        </div>
        <div className='flex-1'>
            <label htmlFor="periodo" className="text-sm font-medium text-muted-foreground">Período</label>
            <input type="date" id="periodo" className="w-full p-2 border rounded-md bg-background" disabled/>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 text-left font-bold">Lote</th>
              <th className="p-3 text-right font-bold">Nº de Animais</th>
              <th className="p-3 text-right font-bold">Peso Médio Inicial (kg)</th>
              <th className="p-3 text-right font-bold">Peso Médio Atual (kg)</th>
              <th className="p-3 text-right font-bold">Ganho Médio Total (kg)</th>
              <th className="p-3 text-right font-bold">GMD Médio (kg/dia)</th>
              <th className="p-3 text-right font-bold">Dias no Sistema</th>
            </tr>
          </thead>
          <tbody>
            {dados && dados.length > 0 ? (
              dados.map((lote) => (
                <tr key={lote.lote_id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{lote.lote_nome}</td>
                  <td className="p-3 text-right">{lote.quantidade_animais}</td>
                  <td className="p-3 text-right">{formatNumber(lote.peso_medio_inicial)}</td>
                  <td className="p-3 text-right">{formatNumber(lote.peso_medio_atual)}</td>
                  <td className="p-3 text-right font-semibold text-green-600">{formatNumber(lote.ganho_medio_total)}</td>
                  <td className="p-3 text-right font-semibold text-primary">{formatNumber(lote.gmd_medio, 3)}</td>
                  <td className="p-3 text-right">{formatNumber(lote.dias_no_sistema, 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-8 text-muted-foreground">
                  <p className="font-bold text-lg">Nenhum dado de desempenho encontrado.</p>
                  <p>Cadastre animais, lotes e pesagens para gerar este relatório.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
