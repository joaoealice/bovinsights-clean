'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnimalById, updateAnimal, AnimalWithDetails, STATUS_ANIMAL } from '@/lib/services/animais.service'
import AnimalForm from '@/components/animais/AnimalForm'
import toast from 'react-hot-toast'

export default function EditarAnimalPage() {
  const params = useParams()
  const router = useRouter()
  const [animal, setAnimal] = useState<AnimalWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadAnimal()
  }, [params.id])

  const loadAnimal = async () => {
    try {
      setLoading(true)
      const data = await getAnimalById(params.id as string)
      setAnimal(data)
      setStatus(data?.status || 'Ativo')
    } catch (error: any) {
      toast.error('Erro ao carregar animal')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateAnimal(params.id as string, {
        ...data,
        status
      })
      toast.success('Animal atualizado com sucesso!')
      router.push(`/dashboard/animais/${params.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar animal')
      throw error
    }
  }

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/animais/${animal.id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para detalhes</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">EDITAR ANIMAL</h1>
        <p className="text-muted-foreground">
          Editando: <span className="text-foreground font-semibold">{animal.brinco}</span>
          {animal.nome && <span> ({animal.nome})</span>}
        </p>
      </div>

      {/* Status do Animal */}
      <div className="card-leather p-6">
        <h3 className="font-display text-xl mb-4">Status do Animal</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_ANIMAL.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                status === s.value
                  ? s.value === 'Ativo' ? 'bg-success text-white' :
                    s.value === 'Vendido' ? 'bg-accent text-white' :
                    s.value === 'Morto' ? 'bg-error text-white' :
                    'bg-warning text-white'
                  : 'bg-muted/30 border border-border hover:bg-muted/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="card-leather p-8">
        <AnimalForm
          onSubmit={handleSubmit}
          submitLabel="Salvar Alterações"
          initialData={{
            brinco: animal.brinco,
            nome: animal.nome,
            sexo: animal.sexo,
            raca: animal.raca,
            tipo: animal.tipo,
            lote_id: animal.lote_id,
            data_entrada: animal.data_entrada,
            data_nascimento: animal.data_nascimento,
            idade_meses: animal.idade_meses,
            peso_entrada: animal.peso_entrada,
            preco_arroba_compra: animal.preco_arroba_compra,
            valor_total_compra: animal.valor_total_compra,
            observacoes: animal.observacoes
          }}
        />
      </div>

      {/* Aviso sobre peso de entrada */}
      <div className="card-leather p-6 bg-warning/10 border border-warning/30">
        <h3 className="font-display text-xl mb-3 flex items-center gap-2 text-warning">
          <span>!</span>
          <span>Atenção</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          O <strong>peso de entrada</strong> é um valor fixo usado como parâmetro inicial para cálculos.
          Alterar este valor pode afetar os cálculos de ganho de peso e GMD de todo o histórico do animal.
        </p>
      </div>
    </div>
  )
}
