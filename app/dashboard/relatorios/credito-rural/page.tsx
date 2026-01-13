'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  mockRelatorioCreditorRural,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/mocks/relatorio-credito-rural'

export default function RelatorioCreditoRuralPage() {
  const relatorioRef = useRef<HTMLDivElement>(null)
  const [gerando, setGerando] = useState(false)
  const dados = mockRelatorioCreditorRural

  const gerarPDF = async () => {
    if (!relatorioRef.current) return

    setGerando(true)

    try {
      // Importar dinamicamente para não afetar o bundle inicial
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const elemento = relatorioRef.current

      // Configurações para melhor qualidade
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      // Calcular quantas páginas serão necessárias
      const pageHeight = pdfHeight
      const totalPages = Math.ceil((imgHeight * ratio) / pageHeight)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        pdf.addImage(
          imgData,
          'PNG',
          imgX,
          imgY - (i * pageHeight),
          imgWidth * ratio,
          imgHeight * ratio
        )
      }

      // Nome do arquivo
      const nomeArquivo = `Relatorio_Credito_Rural_${dados.propriedade.nome.replace(/\s+/g, '_')}_${dados.numeroRelatorio}.pdf`
      pdf.save(nomeArquivo)

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header com ações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <Link href="/dashboard/relatorios" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Voltar para Relatórios
          </Link>
          <h1 className="font-display text-3xl md:text-4xl">Relatório de Crédito Rural</h1>
          <p className="text-muted-foreground">
            Capacidade Produtiva e Pagamento – Pecuária de Corte
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg transition-all flex items-center gap-2"
          >
            <span>🖨️</span>
            Imprimir
          </button>
          <button
            onClick={gerarPDF}
            disabled={gerando}
            className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-white font-bold rounded-lg transition-all flex items-center gap-2"
          >
            {gerando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando...
              </>
            ) : (
              <>
                <span>📄</span>
                Gerar PDF para Banco
              </>
            )}
          </button>
        </div>
      </div>

      {/* Relatório */}
      <div
        ref={relatorioRef}
        className="bg-white text-gray-900 p-8 md:p-12 rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:p-0"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Cabeçalho do Documento */}
        <div className="border-b-4 border-green-700 pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800 mb-1">
                RELATÓRIO DE CAPACIDADE PRODUTIVA E PAGAMENTO
              </h1>
              <p className="text-lg text-gray-600">Pecuária de Corte</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p><strong>Nº:</strong> {dados.numeroRelatorio}</p>
              <p><strong>Data:</strong> {dados.dataEmissao}</p>
              <p><strong>Período:</strong> {dados.periodoReferencia}</p>
            </div>
          </div>
        </div>

        {/* 1. Identificação */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            1. IDENTIFICAÇÃO
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados do Produtor */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold text-gray-700 mb-3">1.1 Produtor Rural</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600 w-28">Nome:</td>
                    <td className="py-1 font-medium">{dados.produtor.nome}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">CPF:</td>
                    <td className="py-1">{dados.produtor.cpf}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Telefone:</td>
                    <td className="py-1">{dados.produtor.telefone}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">E-mail:</td>
                    <td className="py-1">{dados.produtor.email}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Dados da Propriedade */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold text-gray-700 mb-3">1.2 Propriedade Rural</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600 w-28">Nome:</td>
                    <td className="py-1 font-medium">{dados.propriedade.nome}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">CNPJ:</td>
                    <td className="py-1">{dados.propriedade.cpfCnpj}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Município:</td>
                    <td className="py-1">{dados.propriedade.municipio} - {dados.propriedade.estado}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-600">Área Total:</td>
                    <td className="py-1">{formatNumber(dados.propriedade.areaTotal)} ha</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 2. Estrutura Produtiva */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            2. ESTRUTURA PRODUTIVA
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-green-800">{formatNumber(dados.propriedade.areaPastagem)}</p>
              <p className="text-sm text-gray-600">Área de Pastagem (ha)</p>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-green-800">{formatNumber(dados.rebanhoAtual.totalCabecas)}</p>
              <p className="text-sm text-gray-600">Cabeças</p>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-green-800">{formatNumber(dados.rebanhoAtual.totalUA)}</p>
              <p className="text-sm text-gray-600">Unidades Animal (UA)</p>
            </div>
            <div className="bg-green-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-green-800">{formatNumber(dados.rebanhoAtual.lotacaoAtual, 2)}</p>
              <p className="text-sm text-gray-600">Lotação (UA/ha)</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic">
            Capacidade de suporte da propriedade: {formatNumber(dados.propriedade.capacidadeSuporte, 1)} UA/ha
          </p>
        </section>

        {/* 3. Composição do Rebanho */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            3. COMPOSIÇÃO DO REBANHO E LOTES EM PRODUÇÃO
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="p-2 text-left">Lote</th>
                  <th className="p-2 text-left">Categoria</th>
                  <th className="p-2 text-right">Qtd</th>
                  <th className="p-2 text-right">Peso Atual (kg)</th>
                  <th className="p-2 text-right">GMD (kg/dia)</th>
                  <th className="p-2 text-right">Peso Saída (kg)</th>
                  <th className="p-2 text-center">Prev. Saída</th>
                </tr>
              </thead>
              <tbody>
                {dados.lotesProducao.map((lote, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2 border-b font-medium">{lote.nome}</td>
                    <td className="p-2 border-b">{lote.categoria}</td>
                    <td className="p-2 border-b text-right">{formatNumber(lote.quantidade)}</td>
                    <td className="p-2 border-b text-right">{formatNumber(lote.pesoMedioAtual)}</td>
                    <td className="p-2 border-b text-right">{formatNumber(lote.gmdMedio, 2)}</td>
                    <td className="p-2 border-b text-right">{formatNumber(lote.pesoMedioSaida)}</td>
                    <td className="p-2 border-b text-center">{lote.previsaoSaida}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-100 font-bold">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">{formatNumber(dados.rebanhoAtual.totalCabecas)}</td>
                  <td className="p-2" colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* 4. Projeção de Produção */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            4. PROJEÇÃO DE PRODUÇÃO E RECEITA
          </h2>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="p-2 text-left">Período</th>
                  <th className="p-2 text-right">Arrobas Projetadas</th>
                  <th className="p-2 text-right">Preço Estimado (@)</th>
                  <th className="p-2 text-right">Receita Bruta</th>
                </tr>
              </thead>
              <tbody>
                {dados.projecaoProducao.map((proj, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2 border-b">{proj.periodo}</td>
                    <td className="p-2 border-b text-right">{formatNumber(proj.arrobasProjetadas)}</td>
                    <td className="p-2 border-b text-right">{formatCurrency(proj.precoArrobaEstimado)}</td>
                    <td className="p-2 border-b text-right">{formatCurrency(proj.receitaBruta)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-100 font-bold">
                  <td className="p-2">TOTAL ANUAL</td>
                  <td className="p-2 text-right">{formatNumber(dados.totalArrobasAno)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">{formatCurrency(dados.receitaBrutaAnual)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="text-sm text-gray-600 italic">
            * Projeções baseadas no histórico de desempenho dos lotes e preços médios de mercado.
            Rendimento de carcaça considerado: {formatPercent(dados.indicadores.rendimentoCarcaca)}.
          </p>
        </section>

        {/* 5. Custos Operacionais */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            5. CUSTOS OPERACIONAIS
          </h2>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="p-2 text-left">Descrição</th>
                  <th className="p-2 text-right">Valor Mensal</th>
                  <th className="p-2 text-right">Valor Anual</th>
                  <th className="p-2 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {dados.custosOperacionais.map((custo, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-2 border-b">{custo.descricao}</td>
                    <td className="p-2 border-b text-right">{formatCurrency(custo.valorMensal)}</td>
                    <td className="p-2 border-b text-right">{formatCurrency(custo.valorAnual)}</td>
                    <td className="p-2 border-b text-right">{formatPercent(custo.percentual)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-100 font-bold">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2 text-right">{formatCurrency(dados.custoTotalAnual / 12)}</td>
                  <td className="p-2 text-right">{formatCurrency(dados.custoTotalAnual)}</td>
                  <td className="p-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p className="text-sm">
              <strong>Custo por arroba produzida:</strong> {formatCurrency(dados.custoPoArroba)}
            </p>
          </div>
        </section>

        {/* 6. Resultado Operacional */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            6. RESULTADO OPERACIONAL E CAPACIDADE DE PAGAMENTO
          </h2>

          <div className="bg-gray-50 p-6 rounded">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-gray-700">Receita Bruta Anual Estimada</td>
                  <td className="py-3 text-right font-bold text-lg">
                    {formatCurrency(dados.capacidadePagamento.receitaBrutaAnual)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 text-gray-700">(-) Custos Operacionais</td>
                  <td className="py-3 text-right font-bold text-lg text-red-600">
                    {formatCurrency(dados.capacidadePagamento.custoOperacionalAnual)}
                  </td>
                </tr>
                <tr className="border-b-2 border-green-700">
                  <td className="py-3 text-gray-700 font-bold">(=) Margem Bruta Operacional</td>
                  <td className="py-3 text-right font-bold text-xl text-green-700">
                    {formatCurrency(dados.capacidadePagamento.margemBruta)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-700">Margem sobre Receita</td>
                  <td className="py-3 text-right font-bold text-lg">
                    {formatPercent(dados.capacidadePagamento.percentualMargem)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-green-700 text-white p-6 rounded">
              <p className="text-sm opacity-90 mb-1">Capacidade de Pagamento Mensal</p>
              <p className="text-3xl font-bold">{formatCurrency(dados.capacidadePagamento.capacidadePagamentoMensal)}</p>
            </div>
            <div className="bg-green-800 text-white p-6 rounded">
              <p className="text-sm opacity-90 mb-1">Capacidade de Pagamento Anual</p>
              <p className="text-3xl font-bold">{formatCurrency(dados.capacidadePagamento.capacidadePagamentoAnual)}</p>
            </div>
          </div>
        </section>

        {/* 7. Indicadores Técnicos */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-green-800 border-b-2 border-green-700 pb-2 mb-4">
            7. INDICADORES TÉCNICOS
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-800">{formatNumber(dados.indicadores.gmdMedioRebanho, 3)}</p>
              <p className="text-sm text-gray-600">GMD Médio (kg/dia)</p>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-800">{dados.indicadores.idadeMediaSaida}</p>
              <p className="text-sm text-gray-600">Idade Média Saída (meses)</p>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-800">{formatPercent(dados.indicadores.rendimentoCarcaca)}</p>
              <p className="text-sm text-gray-600">Rendimento Carcaça</p>
            </div>
            <div className="bg-gray-50 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-800">{dados.indicadores.cicloMedio}</p>
              <p className="text-sm text-gray-600">Ciclo Médio (meses)</p>
            </div>
          </div>
        </section>

        {/* Declaração */}
        <section className="mb-8">
          <div className="bg-gray-100 p-6 rounded border">
            <h3 className="font-bold text-gray-700 mb-3">DECLARAÇÃO</h3>
            <p className="text-sm text-gray-600 mb-4">
              Declaro, para os devidos fins, que as informações prestadas neste relatório são verdadeiras
              e refletem a realidade produtiva e financeira da propriedade rural acima identificada.
              Os dados apresentados foram obtidos a partir do sistema de gestão pecuária utilizado
              na propriedade e estão sujeitos às variações de mercado e condições climáticas.
            </p>
            <p className="text-sm text-gray-600">
              Este documento foi gerado para fins de análise de crédito rural e não substitui
              documentos contábeis oficiais.
            </p>
          </div>
        </section>

        {/* Assinaturas */}
        <section className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mx-8">
                <p className="font-bold">{dados.produtor.nome}</p>
                <p className="text-sm text-gray-600">Produtor Rural</p>
                <p className="text-sm text-gray-600">CPF: {dados.produtor.cpf}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2 mx-8">
                <p className="font-bold">_____________________________</p>
                <p className="text-sm text-gray-600">Responsável Técnico</p>
                <p className="text-sm text-gray-600">CREA/CRM:</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Documento gerado pelo sistema Bovinsights em {dados.dataEmissao}</p>
          <p>{dados.propriedade.nome} | {dados.propriedade.municipio} - {dados.propriedade.estado}</p>
        </footer>
      </div>

      {/* Informação adicional */}
      <div className="max-w-4xl mx-auto print:hidden">
        <div className="card-leather p-6 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-4">
            <span className="text-3xl">💡</span>
            <div>
              <h3 className="font-display text-xl mb-2">Sobre este relatório</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Este relatório segue as diretrizes do Manual de Crédito Rural (MCR) e é aceito
                pelas principais instituições financeiras do país, incluindo Banco do Brasil,
                Banco do Nordeste e cooperativas de crédito rural.
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Nota:</strong> Os dados exibidos são simulados para demonstração.
                Em produção, serão utilizados os dados reais cadastrados no sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
