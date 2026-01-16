import Link from 'next/link'
import { getRelatorioRebanhoAtual } from '@/lib/services/relatorios.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Função auxiliar para formatação de números
const formatNumber = (value: number | null | undefined, decimals = 0) => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export default async function RebanhoAtualPage() {
  const dados = await getRelatorioRebanhoAtual()
  const relatorio = dados?.[0] // A função RPC retorna um array, pegamos o primeiro item

  const ultimaPesagem = relatorio?.data_ultima_pesagem
    ? format(new Date(relatorio.data_ultima_pesagem), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'N/A'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/relatorios" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Voltar para Relatórios
        </Link>
        <h1 className="font-display text-3xl md:text-4xl">Relatório de Rebanho Atual</h1>
        <p className="text-muted-foreground">
          Fotografia do seu rebanho com base nas últimas informações de pesagem.
        </p>
      </div>

       {/* Filtros */}
       <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
        <div className='flex-1'>
            <label htmlFor="fazenda" className="text-sm font-medium text-muted-foreground">Fazenda</label>
            <select id="fazenda" className="w-full p-2 border rounded-md bg-background" disabled>
                <option>{relatorio?.fazenda_nome || 'Todas'}</option>
            </select>
        </div>
        <div className='flex-1'>
            <label htmlFor="lote" className="text-sm font-medium text-muted-foreground">Lote</label>
            <select id="lote" className="w-full p-2 border rounded-md bg-background" disabled>
                <option>Todos</option>
            </select>
        </div>
        <div className='flex-1'>
            <label htmlFor="status" className="text-sm font-medium text-muted-foreground">Status do Animal</label>
            <select id="status" className="w-full p-2 border rounded-md bg-background" disabled>
                <option>Ativo</option>
            </select>
        </div>
      </div>

      {/* Cards de Dados */}
      {relatorio ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-leather p-6">
            <h3 className="text-muted-foreground font-bold">Total de Animais Ativos</h3>
            <p className="text-4xl font-display mt-2">{formatNumber(relatorio.quantidade_total_animais)}</p>
          </div>
          <div className="card-leather p-6">
            <h3 className="text-muted-foreground font-bold">Peso Total do Rebanho</h3>
            <p className="text-4xl font-display mt-2">{formatNumber(relatorio.peso_total_rebanho, 2)} kg</p>
          </div>
          <div className="card-leather p-6">
            <h3 className="text-muted-foreground font-bold">Peso Médio por Animal</h3>
            <p className="text-4xl font-display mt-2">{formatNumber(relatorio.peso_medio_atual, 2)} kg</p>
          </div>
          <div className="card-leather p-6">
            <h3 className="text-muted-foreground font-bold">Data da Última Pesagem</h3>
            <p className="text-3xl font-display mt-2">{ultimaPesagem}</p>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 text-muted-foreground border-dashed border-2 rounded-lg">
          <p className="font-bold text-lg">Nenhum dado de rebanho encontrado.</p>
          <p>Para gerar este relatório, certifique-se de que há animais com status 'Ativo' e que eles possuem pelo menos uma pesagem registrada.</p>
        </div>
      )}

    </div>
  )
}
