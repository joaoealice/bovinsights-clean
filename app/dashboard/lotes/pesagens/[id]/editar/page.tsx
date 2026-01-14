'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getPesagemById, updatePesagem, PesagemWithDetails } from '@/lib/services/pesagens.service'
import { PesagemForm } from '@/components/pesagens/PesagemForm'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export default function EditarPesagemPage() {
  const params = useParams()
  const router = useRouter()
  const [pesagem, setPesagem] = useState<PesagemWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPesagem()
  }, [params.id])

  async function loadPesagem() {
    try {
      setLoading(true)
      const data = await getPesagemById(params.id as string)

      if (!data) {
        toast.error('Pesagem não encontrada')
        router.push('/dashboard/pesagens')
        return
      }

      setPesagem(data)
    } catch (error) {
      console.error('Erro ao carregar pesagem:', error)
      toast.error('Erro ao carregar pesagem')
      router.push('/dashboard/pesagens')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    try {
      await updatePesagem(params.id as string, data)
      toast.success('Pesagem atualizada com sucesso!')
      router.push(`/dashboard/pesagens/${params.id}`)
    } catch (error: any) {
      console.error('Erro ao atualizar pesagem:', error)
      toast.error(error.message || 'Erro ao atualizar pesagem')
    }
  }

  if (loading) {
    return <PageLoading message="Carregando pesagem..." />
  }

  if (!pesagem) {
    return null
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/pesagens/${params.id}`}
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Voltar para Detalhes
        </Link>
        <h1 className="text-3xl font-display text-foreground">Editar Pesagem</h1>
        <p className="text-muted-foreground">
          Animal: {pesagem.animal?.brinco} {pesagem.animal?.nome ? `- ${pesagem.animal.nome}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <div className="card-leather p-6">
            <PesagemForm
              initialData={pesagem}
              animalId={pesagem.animal_id}
              onSubmit={handleSubmit}
              submitLabel="Salvar Alterações"
            />
          </div>
        </div>

        {/* Info Atual */}
        <div className="lg:col-span-1">
          <div className="card-leather p-6 space-y-4">
            <h3 className="font-display text-lg text-foreground flex items-center gap-2">
              <span>📊</span>
              Dados Atuais
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Peso Atual</p>
                <p className="text-xl font-mono font-bold">{pesagem.peso} kg</p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Ganho</p>
                <p className={`text-xl font-mono font-bold ${pesagem.ganho > 0 ? 'text-green-400' : pesagem.ganho < 0 ? 'text-red-400' : ''}`}>
                  {pesagem.ganho > 0 ? '+' : ''}{pesagem.ganho} kg
                </p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="text-sm text-muted-foreground">GMD</p>
                <p className="text-xl font-mono font-bold">
                  {(pesagem.gmd * 1000).toFixed(0)} g/dia
                </p>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-400">
                <strong>Atenção:</strong> Ao alterar o peso desta pesagem, o GMD será recalculado automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
