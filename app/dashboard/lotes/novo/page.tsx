'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createLoteComEntrada } from '@/lib/services/lotes.service'
import LoteEntradaForm from '@/components/lotes/LoteEntradaForm'
import toast from 'react-hot-toast'

export default function NovoLotePage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    try {
      await createLoteComEntrada(data)
      toast.success('Lote criado com sucesso!')
      router.push('/dashboard/lotes')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar lote')
      throw error
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/lotes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <span>←</span>
          <span>Voltar para lotes</span>
        </Link>
        <h1 className="font-display text-4xl md:text-5xl mb-2">CRIAR LOTE</h1>
        <p className="text-muted-foreground">Registre a entrada de animais e custos da operação</p>
      </div>

      {/* Formulário */}
      <div className="card-leather p-8">
        <LoteEntradaForm onSubmit={handleSubmit} submitLabel="Criar Lote" />
      </div>

      {/* Dicas */}
      <div className="card-leather p-6 bg-primary/5 border border-primary/20">
        <h3 className="font-display text-xl mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>Dicas</span>
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>O sistema calcula automaticamente o custo por cabeça baseado no peso, preço da @, frete e comissão</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Você pode cadastrar animais individualmente depois, com brincos personalizados</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Use nomes descritivos para facilitar a identificação (ex: "Lote 01 - Confinamento Dez/2024")</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>A capacidade máxima deve ser maior que a quantidade de animais da entrada</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
