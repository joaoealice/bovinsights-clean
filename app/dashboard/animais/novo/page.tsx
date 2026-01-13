'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createAnimal } from '@/lib/services/animais.service'
import AnimalForm from '@/components/animais/AnimalForm'
import toast from 'react-hot-toast'

export default function NovoAnimalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loteId = searchParams.get('lote')

  const handleSubmit = async (data: any) => {
    try {
      await createAnimal(data)
      toast.success('Animal identificado com sucesso!')
      router.push('/dashboard/animais')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao identificar animal')
      throw error
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/animais"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para animais</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">IDENTIFICAR ANIMAL</h1>
        <p className="text-muted-foreground">
          Detalhe individualmente um animal que ja existe no lote
        </p>
      </div>

      {/* Formulario */}
      <div className="card-leather p-8">
        <AnimalForm
          onSubmit={handleSubmit}
          submitLabel="Identificar Animal"
          preSelectedLoteId={loteId || undefined}
        />
      </div>

      {/* Dicas */}
      <div className="card-leather p-6 bg-primary/5 border border-primary/20">
        <h3 className="font-display text-xl mb-3 flex items-center gap-2">
          <span>i</span>
          <span>Como funciona</span>
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span>-</span>
            <span>A identificacao serve para <strong>rastrear animais que ja existem no lote</strong></span>
          </li>
          <li className="flex gap-2">
            <span>-</span>
            <span>Nao altera o financeiro do lote - apenas adiciona rastreabilidade individual</span>
          </li>
          <li className="flex gap-2">
            <span>-</span>
            <span>Data de entrada e peso sao herdados automaticamente do lote selecionado</span>
          </li>
          <li className="flex gap-2">
            <span>-</span>
            <span>O animal herda o historico de pesagens e manejos realizados no lote</span>
          </li>
          <li className="flex gap-2">
            <span>-</span>
            <span>Voce pode identificar todos os animais do lote ou apenas alguns especificos</span>
          </li>
        </ul>
      </div>

      {/* Fluxo Recomendado */}
      <div className="card-leather p-6">
        <h3 className="font-display text-xl mb-4">Fluxo Recomendado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-2">1</span>
            <p className="font-semibold">Crie um Lote</p>
            <p className="text-xs text-muted-foreground">Com quantidade e peso total</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-2">2</span>
            <p className="font-semibold">Faca Pesagens</p>
            <p className="text-xs text-muted-foreground">Em lote ou individual</p>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-muted/10 rounded-lg">
            <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mb-2">3</span>
            <p className="font-semibold">Identifique Animais</p>
            <p className="text-xs text-muted-foreground">Quando precisar rastrear individualmente</p>
          </div>
        </div>
      </div>
    </div>
  )
}
