export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      perfil_usuario: {
        Row: {
          id: string
          usuario_id: string
          nome_fazenda: string | null
          cpf_cnpj: string | null
          telefone: string | null
          email_contato: string | null
          endereco: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string
          estado: string
          cep: string | null
          area_total_hectares: number | null
          inscricao_estadual: string | null
          observacoes: string | null
          latitude: number | null
          longitude: number | null
          coordenadas_atualizadas_em: string | null
          onboarding_completed: boolean | null
          quick_tour_completed: boolean | null
          quick_tour_skipped: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome_fazenda?: string | null
          cpf_cnpj?: string | null
          telefone?: string | null
          email_contato?: string | null
          endereco?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade: string
          estado: string
          cep?: string | null
          area_total_hectares?: number | null
          inscricao_estadual?: string | null
          observacoes?: string | null
          latitude?: number | null
          longitude?: number | null
          coordenadas_atualizadas_em?: string | null
          onboarding_completed?: boolean | null
          quick_tour_completed?: boolean | null
          quick_tour_skipped?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome_fazenda?: string | null
          cpf_cnpj?: string | null
          telefone?: string | null
          email_contato?: string | null
          endereco?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string
          estado?: string
          cep?: string | null
          area_total_hectares?: number | null
          inscricao_estadual?: string | null
          observacoes?: string | null
          latitude?: number | null
          longitude?: number | null
          coordenadas_atualizadas_em?: string | null
          onboarding_completed?: boolean | null
          quick_tour_completed?: boolean | null
          quick_tour_skipped?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      lotes: {
        Row: {
          id: string
          usuario_id: string
          nome: string
          localizacao: string | null
          area_hectares: number | null
          capacidade_animais: number | null
          tipo_pastagem: string | null
          data_formacao: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome: string
          localizacao?: string | null
          area_hectares?: number | null
          capacidade_animais?: number | null
          tipo_pastagem?: string | null
          data_formacao?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome?: string
          localizacao?: string | null
          area_hectares?: number | null
          capacidade_animais?: number | null
          tipo_pastagem?: string | null
          data_formacao?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      animais: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string | null
          entrada_lote_id: string | null
          brinco: string
          nome: string | null
          sexo: 'Macho' | 'Fêmea' | null
          raca: string | null
          data_nascimento: string | null
          peso_nascimento: number | null
          peso_atual: number | null
          mae_id: string | null
          pai_id: string | null
          origem: 'Nascido na fazenda' | 'Comprado' | 'Doado' | null
          data_entrada: string | null
          valor_compra: number | null
          status: 'Ativo' | 'Vendido' | 'Morto' | 'Transferido'
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id?: string | null
          entrada_lote_id?: string | null
          brinco: string
          nome?: string | null
          sexo?: 'Macho' | 'Fêmea' | null
          raca?: string | null
          data_nascimento?: string | null
          peso_nascimento?: number | null
          peso_atual?: number | null
          mae_id?: string | null
          pai_id?: string | null
          origem?: 'Nascido na fazenda' | 'Comprado' | 'Doado' | null
          data_entrada?: string | null
          valor_compra?: number | null
          status?: 'Ativo' | 'Vendido' | 'Morto' | 'Transferido'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string | null
          entrada_lote_id?: string | null
          brinco?: string
          nome?: string | null
          sexo?: 'Macho' | 'Fêmea' | null
          raca?: string | null
          data_nascimento?: string | null
          peso_nascimento?: number | null
          peso_atual?: number | null
          mae_id?: string | null
          pai_id?: string | null
          origem?: 'Nascido na fazenda' | 'Comprado' | 'Doado' | null
          data_entrada?: string | null
          valor_compra?: number | null
          status?: 'Ativo' | 'Vendido' | 'Morto' | 'Transferido'
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pesagens: {
        Row: {
          id: string
          usuario_id: string
          animal_id: string
          lote_id: string | null
          peso: number
          data_pesagem: string
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          animal_id: string
          lote_id?: string | null
          peso: number
          data_pesagem: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          animal_id?: string
          lote_id?: string | null
          peso?: number
          data_pesagem?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      despesas: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string | null
          categoria: 'suplementacao' | 'sal_mineral' | 'medicamentos' | 'mao_de_obra' | 'eletricidade' | 'manutencao' | 'outros'
          descricao: string
          valor: number
          data_despesa: string
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id?: string | null
          categoria: 'suplementacao' | 'sal_mineral' | 'medicamentos' | 'mao_de_obra' | 'eletricidade' | 'manutencao' | 'outros'
          descricao: string
          valor: number
          data_despesa: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string | null
          categoria?: 'racao' | 'medicamentos' | 'mao_de_obra' | 'manutencao' | 'frete' | 'outros'
          descricao?: string
          valor?: number
          data_despesa?: string
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      manejos: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string | null
          tipo_aplicacao: 'lote_inteiro' | 'animais_individuais'
          animais_ids: string[] | null
          tipo_manejo: 'vermifugo' | 'vacinacao' | 'suplementacao' | 'marcacao' | 'castracao' | 'desmama' | 'outros'
          descricao: string
          data_manejo: string
          vacinas: string[] | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id?: string | null
          tipo_aplicacao: 'lote_inteiro' | 'animais_individuais'
          animais_ids?: string[] | null
          tipo_manejo: 'vermifugo' | 'vacinacao' | 'suplementacao' | 'marcacao' | 'castracao' | 'desmama' | 'outros'
          descricao: string
          data_manejo: string
          vacinas?: string[] | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string | null
          tipo_aplicacao?: 'lote_inteiro' | 'animais_individuais'
          animais_ids?: string[] | null
          tipo_manejo?: 'vermifugo' | 'vacinacao' | 'suplementacao' | 'marcacao' | 'castracao' | 'desmama' | 'outros'
          descricao?: string
          data_manejo?: string
          vacinas?: string[] | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendas: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string | null
          data_venda: string
          quantidade_cabecas: number
          peso_total_kg: number
          peso_total_arrobas: number
          preco_arroba_venda: number
          valor_total_venda: number
          custo_total: number
          lucro_bruto: number
          margem_percentual: number
          atingiu_objetivo: boolean
          comprador: string | null
          observacoes: string | null
          modo_pagamento: 'a_vista' | 'permuta' | 'prazo'
          data_vencimento: string | null
          valor_permuta: number | null
          descricao_permuta: string | null
          status_pagamento: 'pendente' | 'pago' | 'parcial'
          post_mortem_data: string | null
          post_mortem_frigorifico: string | null
          post_mortem_rendimento_carcaca: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id?: string | null
          data_venda: string
          quantidade_cabecas: number
          peso_total_kg: number
          peso_total_arrobas?: number
          preco_arroba_venda: number
          valor_total_venda?: number
          custo_total: number
          lucro_bruto?: number
          margem_percentual?: number
          atingiu_objetivo?: boolean
          comprador?: string | null
          observacoes?: string | null
          modo_pagamento?: 'a_vista' | 'permuta' | 'prazo'
          data_vencimento?: string | null
          valor_permuta?: number | null
          descricao_permuta?: string | null
          status_pagamento?: 'pendente' | 'pago' | 'parcial'
          post_mortem_data?: string | null
          post_mortem_frigorifico?: string | null
          post_mortem_rendimento_carcaca?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string | null
          data_venda?: string
          quantidade_cabecas?: number
          peso_total_kg?: number
          peso_total_arrobas?: number
          preco_arroba_venda?: number
          valor_total_venda?: number
          custo_total?: number
          lucro_bruto?: number
          margem_percentual?: number
          atingiu_objetivo?: boolean
          comprador?: string | null
          observacoes?: string | null
          modo_pagamento?: 'a_vista' | 'permuta' | 'prazo'
          data_vencimento?: string | null
          valor_permuta?: number | null
          descricao_permuta?: string | null
          status_pagamento?: 'pendente' | 'pago' | 'parcial'
          post_mortem_data?: string | null
          post_mortem_frigorifico?: string | null
          post_mortem_rendimento_carcaca?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      contas: {
        Row: {
          id: string
          usuario_id: string
          tipo: 'pagar' | 'receber'
          origem: 'venda' | 'despesa' | 'manual'
          referencia_id: string | null
          descricao: string
          valor: number
          data_emissao: string
          data_vencimento: string
          data_pagamento: string | null
          status: 'pendente' | 'pago' | 'parcial' | 'cancelado'
          valor_pago: number
          lote_id: string | null
          venda_id: string | null
          forma_pagamento: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: 'pagar' | 'receber'
          origem: 'venda' | 'despesa' | 'manual'
          referencia_id?: string | null
          descricao: string
          valor: number
          data_emissao: string
          data_vencimento: string
          data_pagamento?: string | null
          status?: 'pendente' | 'pago' | 'parcial' | 'cancelado'
          valor_pago?: number
          lote_id?: string | null
          venda_id?: string | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: 'pagar' | 'receber'
          origem?: 'venda' | 'despesa' | 'manual'
          referencia_id?: string | null
          descricao?: string
          valor?: number
          data_emissao?: string
          data_vencimento?: string
          data_pagamento?: string | null
          status?: 'pendente' | 'pago' | 'parcial' | 'cancelado'
          valor_pago?: number
          lote_id?: string | null
          venda_id?: string | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      movimentacoes: {
        Row: {
          id: string
          usuario_id: string
          tipo: 'entrada' | 'saida'
          categoria: 'venda' | 'recebimento' | 'despesa' | 'pagamento' | 'compra_lote' | 'ajuste' | 'estorno'
          descricao: string
          valor: number
          data_movimentacao: string
          venda_id: string | null
          despesa_id: string | null
          conta_id: string | null
          lote_id: string | null
          quantidade_animais: number | null
          peso_arrobas: number | null
          comprador_fornecedor: string | null
          forma_pagamento: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: 'entrada' | 'saida'
          categoria: 'venda' | 'recebimento' | 'despesa' | 'pagamento' | 'compra_lote' | 'ajuste' | 'estorno'
          descricao: string
          valor: number
          data_movimentacao: string
          venda_id?: string | null
          despesa_id?: string | null
          conta_id?: string | null
          lote_id?: string | null
          quantidade_animais?: number | null
          peso_arrobas?: number | null
          comprador_fornecedor?: string | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: 'entrada' | 'saida'
          categoria?: 'venda' | 'recebimento' | 'despesa' | 'pagamento' | 'compra_lote' | 'ajuste' | 'estorno'
          descricao?: string
          valor?: number
          data_movimentacao?: string
          venda_id?: string | null
          despesa_id?: string | null
          conta_id?: string | null
          lote_id?: string | null
          quantidade_animais?: number | null
          peso_arrobas?: number | null
          comprador_fornecedor?: string | null
          forma_pagamento?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_data: {
        Row: {
          id: string
          usuario_id: string
          cidade: string | null
          estado: string | null
          latitude: number
          longitude: number
          temperatura_atual: number | null
          temperatura_maxima: number | null
          temperatura_minima: number | null
          sensacao_termica: number | null
          umidade_relativa: number | null
          precipitacao: number | null
          probabilidade_chuva: number | null
          velocidade_vento: number | null
          direcao_vento: number | null
          rajada_vento: number | null
          pressao_atmosferica: number | null
          indice_uv: number | null
          visibilidade: number | null
          cobertura_nuvens: number | null
          codigo_clima: number | null
          descricao_clima: string | null
          nascer_sol: string | null
          por_sol: string | null
          duracao_dia_horas: number | null
          indice_estresse_termico: number | null
          alerta_estresse: 'normal' | 'leve' | 'moderado' | 'severo' | null
          previsao_json: Json | null
          data_consulta: string
          fonte: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          cidade?: string | null
          estado?: string | null
          latitude: number
          longitude: number
          temperatura_atual?: number | null
          temperatura_maxima?: number | null
          temperatura_minima?: number | null
          sensacao_termica?: number | null
          umidade_relativa?: number | null
          precipitacao?: number | null
          probabilidade_chuva?: number | null
          velocidade_vento?: number | null
          direcao_vento?: number | null
          rajada_vento?: number | null
          pressao_atmosferica?: number | null
          indice_uv?: number | null
          visibilidade?: number | null
          cobertura_nuvens?: number | null
          codigo_clima?: number | null
          descricao_clima?: string | null
          nascer_sol?: string | null
          por_sol?: string | null
          duracao_dia_horas?: number | null
          indice_estresse_termico?: number | null
          alerta_estresse?: 'normal' | 'leve' | 'moderado' | 'severo' | null
          previsao_json?: Json | null
          data_consulta: string
          fonte?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          cidade?: string | null
          estado?: string | null
          latitude?: number
          longitude?: number
          temperatura_atual?: number | null
          temperatura_maxima?: number | null
          temperatura_minima?: number | null
          sensacao_termica?: number | null
          umidade_relativa?: number | null
          precipitacao?: number | null
          probabilidade_chuva?: number | null
          velocidade_vento?: number | null
          direcao_vento?: number | null
          rajada_vento?: number | null
          pressao_atmosferica?: number | null
          indice_uv?: number | null
          visibilidade?: number | null
          cobertura_nuvens?: number | null
          codigo_clima?: number | null
          descricao_clima?: string | null
          nascer_sol?: string | null
          por_sol?: string | null
          duracao_dia_horas?: number | null
          indice_estresse_termico?: number | null
          alerta_estresse?: 'normal' | 'leve' | 'moderado' | 'severo' | null
          previsao_json?: Json | null
          data_consulta?: string
          fonte?: string
          created_at?: string
          updated_at?: string
        }
      }
      dietas: {
        Row: {
          id: string
          usuario_id: string
          nome: string
          tipo: 'adaptacao' | 'crescimento' | 'terminacao_alto_grao' | 'terminacao_convencional'
          descricao: string | null
          percentual_volumoso: number
          percentual_concentrado: number
          ms_volumoso: number
          ms_concentrado: number
          custo_volumoso_kg: number
          custo_concentrado_kg: number
          consumo_ms_percentual_pv: number
          consumo_ms_minimo: number | null
          consumo_ms_maximo: number | null
          gmd_esperado: number | null
          ca_referencia: number | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          nome: string
          tipo: 'adaptacao' | 'crescimento' | 'terminacao_alto_grao' | 'terminacao_convencional'
          descricao?: string | null
          percentual_volumoso?: number
          percentual_concentrado?: number
          ms_volumoso?: number
          ms_concentrado?: number
          custo_volumoso_kg?: number
          custo_concentrado_kg?: number
          consumo_ms_percentual_pv?: number
          consumo_ms_minimo?: number | null
          consumo_ms_maximo?: number | null
          gmd_esperado?: number | null
          ca_referencia?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          nome?: string
          tipo?: 'adaptacao' | 'crescimento' | 'terminacao_alto_grao' | 'terminacao_convencional'
          descricao?: string | null
          percentual_volumoso?: number
          percentual_concentrado?: number
          ms_volumoso?: number
          ms_concentrado?: number
          custo_volumoso_kg?: number
          custo_concentrado_kg?: number
          consumo_ms_percentual_pv?: number
          consumo_ms_minimo?: number | null
          consumo_ms_maximo?: number | null
          gmd_esperado?: number | null
          ca_referencia?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projecoes_lote: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string
          dieta_id: string | null
          nome_projecao: string | null
          data_inicio: string
          dias_confinamento: number
          gmd_alvo: number
          peso_inicial: number
          quantidade_animais: number
          consumo_ms_percentual_pv: number
          percentual_volumoso: number
          percentual_concentrado: number
          ms_volumoso: number
          ms_concentrado: number
          custo_volumoso_kg: number
          custo_concentrado_kg: number
          consumo_ms_diario_animal: number | null
          consumo_volumoso_mn_animal: number | null
          consumo_concentrado_mn_animal: number | null
          custo_alimentar_diario_animal: number | null
          consumo_ms_diario_lote: number | null
          custo_alimentar_diario_lote: number | null
          custo_alimentar_total: number | null
          peso_final_projetado: number | null
          arrobas_projetadas: number | null
          data_saida_projetada: string | null
          ca_projetado: number | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id: string
          dieta_id?: string | null
          nome_projecao?: string | null
          data_inicio: string
          dias_confinamento: number
          gmd_alvo: number
          peso_inicial: number
          quantidade_animais: number
          consumo_ms_percentual_pv: number
          percentual_volumoso: number
          percentual_concentrado: number
          ms_volumoso: number
          ms_concentrado: number
          custo_volumoso_kg: number
          custo_concentrado_kg: number
          consumo_ms_diario_animal?: number | null
          consumo_volumoso_mn_animal?: number | null
          consumo_concentrado_mn_animal?: number | null
          custo_alimentar_diario_animal?: number | null
          consumo_ms_diario_lote?: number | null
          custo_alimentar_diario_lote?: number | null
          custo_alimentar_total?: number | null
          peso_final_projetado?: number | null
          arrobas_projetadas?: number | null
          data_saida_projetada?: string | null
          ca_projetado?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string
          dieta_id?: string | null
          nome_projecao?: string | null
          data_inicio?: string
          dias_confinamento?: number
          gmd_alvo?: number
          peso_inicial?: number
          quantidade_animais?: number
          consumo_ms_percentual_pv?: number
          percentual_volumoso?: number
          percentual_concentrado?: number
          ms_volumoso?: number
          ms_concentrado?: number
          custo_volumoso_kg?: number
          custo_concentrado_kg?: number
          consumo_ms_diario_animal?: number | null
          consumo_volumoso_mn_animal?: number | null
          consumo_concentrado_mn_animal?: number | null
          custo_alimentar_diario_animal?: number | null
          consumo_ms_diario_lote?: number | null
          custo_alimentar_diario_lote?: number | null
          custo_alimentar_total?: number | null
          peso_final_projetado?: number | null
          arrobas_projetadas?: number | null
          data_saida_projetada?: string | null
          ca_projetado?: number | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leituras_cocho: {
        Row: {
          id: string
          usuario_id: string
          lote_id: string
          data_leitura: string
          numero_trato: number
          volumoso_fornecido_kg: number
          concentrado_fornecido_kg: number
          sobra_percentual: number | null
          sobra_kg: number | null
          escore_cocho: number | null
          consumo_volumoso_kg: number | null
          consumo_concentrado_kg: number | null
          consumo_total_mn_kg: number | null
          consumo_total_ms_kg: number | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          lote_id: string
          data_leitura: string
          numero_trato?: number
          volumoso_fornecido_kg?: number
          concentrado_fornecido_kg?: number
          sobra_percentual?: number | null
          sobra_kg?: number | null
          escore_cocho?: number | null
          consumo_volumoso_kg?: number | null
          consumo_concentrado_kg?: number | null
          consumo_total_mn_kg?: number | null
          consumo_total_ms_kg?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          lote_id?: string
          data_leitura?: string
          numero_trato?: number
          volumoso_fornecido_kg?: number
          concentrado_fornecido_kg?: number
          sobra_percentual?: number | null
          sobra_kg?: number | null
          escore_cocho?: number | null
          consumo_volumoso_kg?: number | null
          consumo_concentrado_kg?: number | null
          consumo_total_mn_kg?: number | null
          consumo_total_ms_kg?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
