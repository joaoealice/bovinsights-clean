import Link from 'next/link'
import { getRelatorioPesagensDesempenho } from '@/lib/services/relatorios.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função auxiliar para formatação de números
const formatNumber = (value: number | null | undefined, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A'
  return value.toFixed(decimals)
}

// Função auxiliar para formatação de datas
const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A'
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
}

export default async function PesagensDesempenhoPage() {
  // Período padrão: últimos 90 dias
  const dataFim = new Date()
  const dataInicio = new Date()
  dataInicio.setDate(dataFim.getDate() - 90)

  const dados = await getRelatorioPesagensDesempenho({
    data_inicio: dataInicio.toISOString().split('T')[0],
    data_fim: dataFim.toISOString().split('T')[0],
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/relatorios" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Voltar para Relatórios
        </Link>
        <h1 className="font-display text-3xl md:text-4xl">Relatório de Pesagens e Desempenho</h1>
        <p className="text-muted-foreground">
          Análise detalhada da evolução de peso e GMD de cada animal.
        </p>
      </div>

      {/* Filtros */}
      <div className="p-4 border rounded-lg space-y-4">
        <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
                <label htmlFor="periodo_inicio" className="text-sm font-medium text-muted-foreground">Data Início</label>
                <input type="date" id="periodo_inicio" className="w-full p-2 border rounded-md bg-background" defaultValue={dataInicio.toISOString().split('T')[0]} disabled/>
            </div>
            <div className='flex-1'>
                <label htmlFor="periodo_fim" className="text-sm font-medium text-muted-foreground">Data Fim</label>
                <input type="date" id="periodo_fim" className="w-full p-2 border rounded-md bg-background" defaultValue={dataFim.toISOString().split('T')[0]} disabled/>
            </div>
            <div className='flex-1'>
                <label htmlFor="lote" className="text-sm font-medium text-muted-foreground">Lote</label>
                <select id="lote" className="w-full p-2 border rounded-md bg-background" disabled>
                    <option>Todos</option>
                </select>
            </div>
        </div>
        <div className="text-xs text-center text-muted-foreground bg-amber-50 p-2 rounded-md border border-amber-200">
            <strong>Nota:</strong> Os filtros interativos serão implementados em uma futura atualização. Atualmente, o relatório exibe os dados dos últimos 90 dias.
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-3 text-left font-bold">Brinco</th>
              <th className="p-3 text-left font-bold">Lote</th>
              <th className="p-3 text-left font-bold">Data da Pesagem</th>
              <th className="p-3 text-right font-bold">Peso Anterior (kg)</th>
              <th className="p-3 text-right font-bold">Peso Atual (kg)</th>
              <th className="p-3 text-right font-bold">Dias Entre Pesagens</th>
              <th className="p-3 text-right font-bold">Ganho no Período (kg)</th>
              <th className="p-3 text-right font-bold">GMD (kg/dia)</th>
            </tr>
          </thead>
          <tbody>
            {dados && dados.length > 0 ? (
              dados.map((pesagem, index) => (
                <tr key={`${pesagem.animal_id}-${index}`} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">{pesagem.brinco}</td>
                  <td className="p-3">{pesagem.lote_nome || 'N/A'}</td>
                  <td className="p-3">{formatDate(pesagem.data_pesagem)}</td>
                  <td className="p-3 text-right">{formatNumber(pesagem.peso_anterior)}</td>
                  <td className="p-3 text-right">{formatNumber(pesagem.peso_atual)}</td>
                  <td className="p-3 text-right">{pesagem.dias_entre_pesagens}</td>
                  <td className={`p-3 text-right font-semibold ${pesagem.ganho_no_periodo && pesagem.ganho_no_periodo > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatNumber(pesagem.ganho_no_periodo)}
                  </td>
                  <td className={`p-3 text-right font-semibold ${pesagem.gmd && pesagem.gmd > 0 ? 'text-primary' : ''}`}>
                    {formatNumber(pesagem.gmd, 3)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center p-8 text-muted-foreground">
                  <p className="font-bold text-lg">Nenhuma pesagem encontrada no período.</p>
                  <p>Ajuste o período ou adicione novas pesagens para gerar este relatório.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
