-- =====================================================
-- MIGRAÇÃO: Contas a Pagar e Receber + Atualização Vendas
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR TABELA DE VENDAS (adicionar campos de pagamento)
-- =====================================================

-- Adicionar campo modo_pagamento
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS modo_pagamento VARCHAR(20) DEFAULT 'a_vista';

-- Adicionar constraint para valores válidos
DO $$ BEGIN
  ALTER TABLE vendas ADD CONSTRAINT vendas_modo_pagamento_check
  CHECK (modo_pagamento IN ('a_vista', 'permuta', 'prazo'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Adicionar campo data_vencimento (para vendas a prazo)
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS data_vencimento DATE;

-- Adicionar campo valor_permuta (para vendas em permuta)
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS valor_permuta DECIMAL(14, 2);

-- Adicionar campo descricao_permuta
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS descricao_permuta TEXT;

-- Adicionar campo status_pagamento
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(20) DEFAULT 'pendente';

DO $$ BEGIN
  ALTER TABLE vendas ADD CONSTRAINT vendas_status_pagamento_check
  CHECK (status_pagamento IN ('pendente', 'pago', 'parcial'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Comentários nos novos campos
COMMENT ON COLUMN vendas.modo_pagamento IS 'Forma de pagamento: a_vista, permuta ou prazo';
COMMENT ON COLUMN vendas.data_vencimento IS 'Data de vencimento para vendas a prazo';
COMMENT ON COLUMN vendas.valor_permuta IS 'Valor dos bens recebidos em permuta';
COMMENT ON COLUMN vendas.descricao_permuta IS 'Descrição dos bens recebidos em permuta';
COMMENT ON COLUMN vendas.status_pagamento IS 'Status do recebimento: pendente, pago ou parcial';

-- =====================================================
-- 2. CRIAR TABELA DE CONTAS A PAGAR E RECEBER
-- =====================================================

CREATE TABLE IF NOT EXISTS contas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo e origem
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  origem VARCHAR(50) NOT NULL, -- 'venda', 'despesa', 'manual'
  referencia_id UUID, -- ID da venda ou despesa relacionada

  -- Dados da conta
  descricao TEXT NOT NULL,
  valor DECIMAL(14, 2) NOT NULL CHECK (valor > 0),
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,

  -- Status e controle
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'parcial', 'cancelado')),
  valor_pago DECIMAL(14, 2) DEFAULT 0,

  -- Relacionamentos opcionais
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  venda_id UUID REFERENCES vendas(id) ON DELETE SET NULL,

  -- Informações adicionais
  forma_pagamento VARCHAR(50), -- pix, boleto, cheque, dinheiro, etc
  observacoes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_contas_usuario_id ON contas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contas_tipo ON contas(tipo);
CREATE INDEX IF NOT EXISTS idx_contas_status ON contas(status);
CREATE INDEX IF NOT EXISTS idx_contas_data_vencimento ON contas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_venda_id ON contas(venda_id);
CREATE INDEX IF NOT EXISTS idx_contas_lote_id ON contas(lote_id);

-- RLS (Row Level Security)
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DO $$ BEGIN
  CREATE POLICY "contas_select" ON contas FOR SELECT USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "contas_insert" ON contas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "contas_update" ON contas FOR UPDATE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "contas_delete" ON contas FOR DELETE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_contas_updated_at ON contas;
CREATE TRIGGER trigger_contas_updated_at
  BEFORE UPDATE ON contas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ADICIONAR CAMPO STATUS AO LOTE
-- =====================================================

-- Adicionar mais opções ao status do lote para incluir 'vendido'
-- O status atual já permite 'ativo', 'inativo', 'manutencao'
-- Vamos adicionar 'vendido'

ALTER TABLE lotes DROP CONSTRAINT IF EXISTS lotes_status_check;
ALTER TABLE lotes ADD CONSTRAINT lotes_status_check
  CHECK (status IN ('ativo', 'inativo', 'manutencao', 'vendido'));

-- Comentários na tabela
COMMENT ON TABLE contas IS 'Controle de contas a pagar e receber';
COMMENT ON COLUMN contas.tipo IS 'Tipo da conta: pagar (saída) ou receber (entrada)';
COMMENT ON COLUMN contas.origem IS 'Origem da conta: venda, despesa ou manual';
COMMENT ON COLUMN contas.referencia_id IS 'ID do registro de origem (venda_id ou despesa_id)';
COMMENT ON COLUMN contas.status IS 'Status: pendente, pago, parcial ou cancelado';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
SELECT 'Migração de contas a pagar/receber concluída!' as resultado;
