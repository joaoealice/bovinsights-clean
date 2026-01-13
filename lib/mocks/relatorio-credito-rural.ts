// Mock de dados para o Relatório de Capacidade Produtiva e Pagamento
// Estes dados simulam informações que virão das tabelas reais do sistema

export interface DadosPropriedade {
  nome: string
  inscricaoEstadual: string
  cpfCnpj: string
  endereco: string
  municipio: string
  estado: string
  areaTotal: number // hectares
  areaPastagem: number // hectares
  capacidadeSuporte: number // UA/ha
}

export interface DadosProdutor {
  nome: string
  cpf: string
  telefone: string
  email: string
}

export interface LoteProducao {
  nome: string
  categoria: string
  quantidade: number
  pesoMedioEntrada: number // kg
  pesoMedioAtual: number // kg
  gmdMedio: number // kg/dia
  previsaoSaida: string
  pesoMedioSaida: number // kg estimado
}

export interface ProjecaoProducao {
  periodo: string
  arrobasProjetadas: number
  precoArrobaEstimado: number // R$
  receitaBruta: number
}

export interface CustoOperacional {
  descricao: string
  valorMensal: number
  valorAnual: number
  percentual: number
}

export interface CapacidadePagamento {
  receitaBrutaAnual: number
  custoOperacionalAnual: number
  margemBruta: number
  percentualMargem: number
  capacidadePagamentoMensal: number
  capacidadePagamentoAnual: number
}

export interface RelatorioCreditorRuralData {
  // Metadados
  dataEmissao: string
  numeroRelatorio: string
  periodoReferencia: string

  // Dados básicos
  propriedade: DadosPropriedade
  produtor: DadosProdutor

  // Dados de produção
  rebanhoAtual: {
    totalCabecas: number
    totalUA: number
    lotacaoAtual: number // UA/ha
  }
  lotesProducao: LoteProducao[]

  // Projeções
  projecaoProducao: ProjecaoProducao[]
  totalArrobasAno: number
  receitaBrutaAnual: number

  // Custos
  custosOperacionais: CustoOperacional[]
  custoTotalAnual: number
  custoPoArroba: number

  // Resultado
  capacidadePagamento: CapacidadePagamento

  // Indicadores
  indicadores: {
    gmdMedioRebanho: number
    idadeMediaSaida: number // meses
    rendimentoCarcaca: number // %
    cicloMedio: number // meses
  }
}

// Dados mockados simulando uma fazenda real
export const mockRelatorioCreditorRural: RelatorioCreditorRuralData = {
  dataEmissao: new Date().toLocaleDateString('pt-BR'),
  numeroRelatorio: `RC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
  periodoReferencia: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,

  propriedade: {
    nome: 'Fazenda Santa Clara',
    inscricaoEstadual: '123.456.789.001',
    cpfCnpj: '12.345.678/0001-90',
    endereco: 'Rodovia BR-153, Km 245, Zona Rural',
    municipio: 'Jataí',
    estado: 'GO',
    areaTotal: 850,
    areaPastagem: 720,
    capacidadeSuporte: 1.8,
  },

  produtor: {
    nome: 'João Carlos Silva',
    cpf: '123.456.789-00',
    telefone: '(64) 99999-9999',
    email: 'joao.silva@email.com',
  },

  rebanhoAtual: {
    totalCabecas: 1240,
    totalUA: 1116, // considerando média de 0.9 UA por cabeça
    lotacaoAtual: 1.55, // UA/ha
  },

  lotesProducao: [
    {
      nome: 'Lote Nelore 2024-A',
      categoria: 'Boi Magro',
      quantidade: 320,
      pesoMedioEntrada: 280,
      pesoMedioAtual: 385,
      gmdMedio: 0.85,
      previsaoSaida: 'Jun/2025',
      pesoMedioSaida: 540,
    },
    {
      nome: 'Lote Nelore 2024-B',
      categoria: 'Boi Magro',
      quantidade: 280,
      pesoMedioEntrada: 290,
      pesoMedioAtual: 420,
      gmdMedio: 0.90,
      previsaoSaida: 'Abr/2025',
      pesoMedioSaida: 550,
    },
    {
      nome: 'Lote Recria 2024',
      categoria: 'Garrote',
      quantidade: 380,
      pesoMedioEntrada: 180,
      pesoMedioAtual: 265,
      gmdMedio: 0.65,
      previsaoSaida: 'Set/2025',
      pesoMedioSaida: 380,
    },
    {
      nome: 'Lote Terminação',
      categoria: 'Boi Gordo',
      quantidade: 260,
      pesoMedioEntrada: 420,
      pesoMedioAtual: 510,
      gmdMedio: 1.10,
      previsaoSaida: 'Fev/2025',
      pesoMedioSaida: 570,
    },
  ],

  projecaoProducao: [
    {
      periodo: '1º Trimestre/2025',
      arrobasProjetadas: 2860,
      precoArrobaEstimado: 285,
      receitaBruta: 815100,
    },
    {
      periodo: '2º Trimestre/2025',
      arrobasProjetadas: 3420,
      precoArrobaEstimado: 290,
      receitaBruta: 991800,
    },
    {
      periodo: '3º Trimestre/2025',
      arrobasProjetadas: 2100,
      precoArrobaEstimado: 295,
      receitaBruta: 619500,
    },
    {
      periodo: '4º Trimestre/2025',
      arrobasProjetadas: 1850,
      precoArrobaEstimado: 300,
      receitaBruta: 555000,
    },
  ],

  totalArrobasAno: 10230,
  receitaBrutaAnual: 2981400,

  custosOperacionais: [
    {
      descricao: 'Alimentação e Suplementação',
      valorMensal: 45000,
      valorAnual: 540000,
      percentual: 38.5,
    },
    {
      descricao: 'Mão de Obra',
      valorMensal: 28000,
      valorAnual: 336000,
      percentual: 24.0,
    },
    {
      descricao: 'Sanidade Animal',
      valorMensal: 8500,
      valorAnual: 102000,
      percentual: 7.3,
    },
    {
      descricao: 'Manutenção de Pastagens',
      valorMensal: 12000,
      valorAnual: 144000,
      percentual: 10.3,
    },
    {
      descricao: 'Combustíveis e Energia',
      valorMensal: 9500,
      valorAnual: 114000,
      percentual: 8.1,
    },
    {
      descricao: 'Despesas Administrativas',
      valorMensal: 6000,
      valorAnual: 72000,
      percentual: 5.1,
    },
    {
      descricao: 'Outras Despesas',
      valorMensal: 7833,
      valorAnual: 94000,
      percentual: 6.7,
    },
  ],

  custoTotalAnual: 1402000,
  custoPoArroba: 137.05,

  capacidadePagamento: {
    receitaBrutaAnual: 2981400,
    custoOperacionalAnual: 1402000,
    margemBruta: 1579400,
    percentualMargem: 52.97,
    capacidadePagamentoMensal: 131616.67,
    capacidadePagamentoAnual: 1579400,
  },

  indicadores: {
    gmdMedioRebanho: 0.875,
    idadeMediaSaida: 30,
    rendimentoCarcaca: 52.5,
    cicloMedio: 18,
  },
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Função para formatar números
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Função para formatar percentuais
export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}
