'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createPesagemLote, createPesagemLoteAgregada } from '@/lib/services/pesagens.service'
import { PesagemLoteForm } from '@/components/pesagens/PesagemLoteForm'

export default function PesagemLotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Obter lote da URL se vier da página de detalhes do lote
  const loteIdFromUrl = searchParams.get('lote')
  const loteNameFromUrl = searchParams.get('loteName')

  // Handler para pesagem AGREGADA por lote (modo "Lote Inteiro")
  // Funciona sem animais cadastrados - o LOTE é o eixo central
  async function handleSubmitLoteAgregado(
    loteId: string,
    pesoTotal: number,
    quantidadeAnimais: number,
    dataPesagem: string,
    observacoes?: string
  ) {
    try {
      const resultado = await createPesagemLoteAgregada(
        loteId,
        pesoTotal,
        quantidadeAnimais,
        dataPesagem,
        observacoes
      )
      toast.success(`Pesagem registrada! Peso medio: ${resultado.pesoMedio} kg/animal`)
      // Se veio de um lote específico, voltar para a página do lote
      if (loteIdFromUrl) {
        router.push(`/dashboard/lotes/${loteIdFromUrl}`)
      } else {
        router.push('/dashboard/pesagens')
      }
    } catch (error: any) {
      console.error('Erro ao criar pesagem agregada:', error)
      toast.error(error.message || 'Erro ao registrar pesagem')
    }
  }

  // Handler para pesagem de ANIMAIS INDIVIDUAIS (modo "Animais Individuais")
  // Apenas para animais já identificados/cadastrados
  async function handleSubmitAnimais(
    pesagens: { animal_id: string; peso: number }[],
    dataPesagem: string,
    loteId: string,
    observacoes?: string
  ) {
    try {
      await createPesagemLote(pesagens, dataPesagem, loteId, observacoes)
      toast.success(`${pesagens.length} pesagens registradas com sucesso!`)
      // Se veio de um lote específico, voltar para a página do lote
      if (loteIdFromUrl) {
        router.push(`/dashboard/lotes/${loteIdFromUrl}`)
      } else {
        router.push('/dashboard/pesagens')
      }
    } catch (error: any) {
      console.error('Erro ao criar pesagens:', error)
      toast.error(error.message || 'Erro ao registrar pesagens')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={loteIdFromUrl ? `/dashboard/lotes/${loteIdFromUrl}` : '/dashboard/pesagens'}
          className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← {loteIdFromUrl ? `Voltar para ${loteNameFromUrl || 'Lote'}` : 'Voltar para Pesagens'}
        </Link>
        <h1 className="text-3xl font-display text-foreground">Pesagem em Lote</h1>
        <p className="text-muted-foreground">
          {loteNameFromUrl
            ? `Registrar pesagem para o lote: ${loteNameFromUrl}`
            : 'Registre pesagens de múltiplos animais de uma vez'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <div className="card-leather p-6">
            <PesagemLoteForm
              loteId={loteIdFromUrl || undefined}
              onSubmitLoteAgregado={handleSubmitLoteAgregado}
              onSubmitAnimais={handleSubmitAnimais}
              submitLabel="Registrar Pesagens"
            />
          </div>
        </div>

        {/* Dicas */}
        <div className="lg:col-span-1">
          <div className="card-leather p-6 space-y-4">
            <h3 className="font-display text-lg text-foreground flex items-center gap-2">
              <span>📋</span>
              Como funciona
            </h3>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">1. Selecione o lote</p>
                <p>Escolha o lote que sera pesado. A quantidade de referencia vem do lote.</p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">2. Escolha o modo</p>
                <p><strong>Lote Inteiro:</strong> Informe o peso total e quantidade - ideal para pesagem coletiva.</p>
                <p className="mt-1"><strong>Animais Individuais:</strong> Pese animais identificados um a um.</p>
              </div>

              <div className="p-3 bg-background/30 rounded-lg">
                <p className="font-medium text-foreground mb-1">3. Registre a pesagem</p>
                <p>No modo "Lote Inteiro", o sistema calcula o peso medio automaticamente.</p>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-medium text-foreground mb-1">O LOTE e o centro</p>
                <p>A quantidade de animais vem do lote. Identificar animais individualmente e opcional - faca quando precisar rastrear um animal especifico.</p>
              </div>

              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="font-medium text-foreground mb-1">Atualizacao automatica</p>
                <p>O peso medio do lote sera atualizado automaticamente apos a pesagem.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
