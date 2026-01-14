'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createPesagem } from '@/lib/services/pesagens.service'
import { PesagemForm } from '@/components/pesagens/PesagemForm'

export default function NovaPesagemPage() {
  const router = useRouter()

  async function handleSubmit(data: any) {
    try {
      await createPesagem(data)
      toast.success('Pesagem registrada com sucesso!')
      router.push('/dashboard/pesagens')
    } catch (error: any) {
      console.error('Erro ao criar pesagem:', error)
      toast.error(error.message || 'Erro ao registrar pesagem')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/pesagens"
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Voltar para Pesagens
        </Link>
        <h1 className="text-3xl font-display text-foreground">Nova Pesagem</h1>
        <p className="text-muted-foreground">
          Registre uma nova pesagem individual
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <div className="card-leather p-6">
            <PesagemForm
              onSubmit={handleSubmit}
              submitLabel="Registrar Pesagem"
            />
          </div>
        </div>

        {/* Dicas */}
        <div className="lg:col-span-1">
          <div className="card-leather p-6 space-y-4">
            <h3 className="font-display text-lg text-foreground flex items-center gap-2">
              <span>💡</span>
              Dicas
            </h3>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">GMD (Ganho Médio Diário)</p>
                <p>O sistema calcula automaticamente o GMD baseado nas pesagens anteriores do animal.</p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">Frequência ideal</p>
                <p>Recomendamos pesar os animais a cada 30 dias para acompanhar o desenvolvimento.</p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">Pesagem em lote</p>
                <p>Para pesar vários animais de uma vez, use a opção de <Link href="/dashboard/pesagens/lote" className="text-primary hover:underline">Pesagem em Lote</Link>.</p>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-medium text-foreground mb-1">⚖️ Referência GMD</p>
                <ul className="space-y-1">
                  <li>• Excelente: &gt; 1.0 kg/dia</li>
                  <li>• Bom: 0.8 - 1.0 kg/dia</li>
                  <li>• Regular: 0.5 - 0.8 kg/dia</li>
                  <li>• Baixo: &lt; 0.5 kg/dia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
