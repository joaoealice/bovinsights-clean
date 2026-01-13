'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnimalById, deleteAnimal, AnimalWithDetails } from '@/lib/services/animais.service'
import { getPesagensByAnimal, PesagemWithDetails } from '@/lib/services/pesagens.service'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function AnimalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [animal, setAnimal] = useState<AnimalWithDetails | null>(null)
  const [pesagens, setPesagens] = useState<PesagemWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [animalData, pesagensData] = await Promise.all([
        getAnimalById(params.id as string),
        getPesagensByAnimal(params.id as string)
      ])
      setAnimal(animalData)
      setPesagens(pesagensData)
    } catch (error: any) {
      toast.error('Erro ao carregar animal')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAnimal(params.id as string)
      toast.success('Animal excluído com sucesso')
      router.push('/dashboard/animais')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir animal')
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getSexoIcon = (sexo: string) => {
    return sexo === 'Macho' ? '♂' : '♀'
  }

  const getSexoColor = (sexo: string) => {
    return sexo === 'Macho' ? 'text-blue-500' : 'text-pink-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-success/20 text-success border-success/30'
      case 'Vendido':
        return 'bg-accent/20 text-accent border-accent/30'
      case 'Morto':
        return 'bg-error/20 text-error border-error/30'
      case 'Transferido':
        return 'bg-warning/20 text-warning border-warning/30'
      default:
        return 'bg-muted/20 text-muted-foreground border-border'
    }
  }

  // Preparar dados do gráfico
  const chartData = pesagens
    .slice()
    .reverse()
    .map(p => ({
      data: new Date(p.data_pesagem).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      peso: p.peso,
      gmd: p.gmd
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🐮</p>
        <h3 className="font-display text-2xl mb-2">Animal não encontrado</h3>
        <Link href="/dashboard/animais" className="text-primary hover:underline">
          Voltar para a lista
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/animais"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <span>←</span>
            <span>Voltar para animais</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className={`text-5xl ${getSexoColor(animal.sexo)}`}>
              {getSexoIcon(animal.sexo)}
            </span>
            <div>
              <h1 className="font-display text-4xl md:text-5xl mb-1">{animal.brinco}</h1>
              {animal.nome && (
                <p className="text-xl text-muted-foreground">{animal.nome}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(animal.status)}`}>
              {animal.status}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/dashboard/animais/${animal.id}/editar`}>
            <button className="px-6 py-3 bg-muted/30 border border-border hover:bg-muted/50 font-semibold rounded-lg transition-all">
              Editar
            </button>
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-error/10 border border-error/30 text-error hover:bg-error/20 font-semibold rounded-lg transition-all"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Peso e GMD */}
          <div className="card-leather p-6">
            <h2 className="font-display text-2xl mb-6">Peso e Desempenho</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Peso de Entrada</p>
                <p className="font-mono font-bold text-2xl text-primary">
                  {animal.peso_entrada} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  {(animal.peso_entrada / 30).toFixed(1)} @
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Peso Atual</p>
                <p className="font-mono font-bold text-2xl">
                  {animal.peso_atual || animal.peso_entrada} kg
                </p>
                <p className="text-xs text-muted-foreground">
                  {((animal.peso_atual || animal.peso_entrada) / 30).toFixed(1)} @
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Ganho Total</p>
                <p className={`font-mono font-bold text-2xl ${animal.ganho_total && animal.ganho_total > 0 ? 'text-success' : animal.ganho_total && animal.ganho_total < 0 ? 'text-error' : ''}`}>
                  {animal.ganho_total ? `${animal.ganho_total > 0 ? '+' : ''}${animal.ganho_total} kg` : '-'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg p-4 border border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">GMD</p>
                <p className={`font-mono font-bold text-2xl ${animal.gmd && animal.gmd > 0 ? 'text-success' : ''}`}>
                  {animal.gmd ? `${animal.gmd.toFixed(3)} kg/dia` : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução */}
          {chartData.length > 1 && (
            <div className="card-leather p-6">
              <h2 className="font-display text-2xl mb-6">Evolução do Peso</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="data" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#999' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#c9a227"
                      strokeWidth={3}
                      dot={{ fill: '#c9a227', strokeWidth: 2 }}
                      name="Peso (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Histórico de Pesagens */}
          <div className="card-leather p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl">Histórico de Pesagens</h2>
              <Link href={`/dashboard/pesagens/novo?animal_id=${animal.id}`}>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-all">
                  + Nova Pesagem
                </button>
              </Link>
            </div>

            {pesagens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma pesagem registrada
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Data</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Peso</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Ganho</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">GMD</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Obs.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesagens.map((pesagem, index) => (
                      <tr key={pesagem.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-3 px-4 font-mono">
                          {formatDate(pesagem.data_pesagem)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {pesagem.peso} kg
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${pesagem.ganho > 0 ? 'text-success' : pesagem.ganho < 0 ? 'text-error' : ''}`}>
                          {pesagem.ganho !== 0 ? `${pesagem.ganho > 0 ? '+' : ''}${pesagem.ganho} kg` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${pesagem.gmd > 0 ? 'text-success' : pesagem.gmd < 0 ? 'text-error' : ''}`}>
                          {pesagem.gmd !== 0 ? `${pesagem.gmd.toFixed(3)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-[200px]">
                          {pesagem.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Animal */}
          <div className="card-leather p-6">
            <h2 className="font-display text-xl mb-4">Informações</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Raça</p>
                <p className="font-semibold">{animal.raca}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo / Categoria</p>
                <p className="font-semibold">{animal.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sexo</p>
                <p className="font-semibold">{animal.sexo}</p>
              </div>
              {animal.lote && (
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <Link href={`/dashboard/lotes/${animal.lote.id}`} className="text-primary hover:underline font-semibold">
                    {animal.lote.nome}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Data de Entrada</p>
                <p className="font-semibold">{formatDate(animal.data_entrada)}</p>
              </div>
              {animal.data_nascimento && (
                <div>
                  <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                  <p className="font-semibold">{formatDate(animal.data_nascimento)}</p>
                </div>
              )}
              {animal.idade_meses && (
                <div>
                  <p className="text-xs text-muted-foreground">Idade</p>
                  <p className="font-semibold">{animal.idade_meses} meses ({(animal.idade_meses / 12).toFixed(1)} anos)</p>
                </div>
              )}
            </div>
          </div>

          {/* Valor de Compra */}
          {(animal.preco_arroba_compra || animal.valor_total_compra) && (
            <div className="card-leather p-6 bg-gradient-to-br from-accent/10 to-primary/10">
              <h2 className="font-display text-xl mb-4">Valor de Compra</h2>
              <div className="space-y-4">
                {animal.preco_arroba_compra && (
                  <div>
                    <p className="text-xs text-muted-foreground">Preço da @ na Compra</p>
                    <p className="font-mono font-semibold text-lg">
                      {formatCurrency(animal.preco_arroba_compra)}
                    </p>
                  </div>
                )}
                {animal.valor_total_compra && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="font-display text-3xl text-accent">
                      {formatCurrency(animal.valor_total_compra)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estatísticas */}
          <div className="card-leather p-6">
            <h2 className="font-display text-xl mb-4">Estatísticas</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Pesagens</span>
                <span className="font-mono font-bold">{animal.total_pesagens || 0}</span>
              </div>
              {animal.arroba_atual && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrobas Atuais</span>
                  <span className="font-mono font-bold">{animal.arroba_atual.toFixed(1)} @</span>
                </div>
              )}
              {animal.ultima_pesagem && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última Pesagem</span>
                  <span className="font-mono">{formatDate(animal.ultima_pesagem)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {animal.observacoes && (
            <div className="card-leather p-6">
              <h2 className="font-display text-xl mb-4">Observações</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{animal.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-leather p-8 max-w-md w-full animate-slideInUp">
            <h3 className="font-display text-2xl mb-4">Confirmar Exclusão</h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir o animal <strong>{animal.brinco}</strong>?
              Esta ação não pode ser desfeita e todas as pesagens associadas serão removidas.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-muted/30 border border-border hover:bg-muted/50 font-semibold rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-error hover:bg-error/90 text-white font-semibold rounded-lg transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
