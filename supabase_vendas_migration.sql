-- =====================================================
-- MIGRAÇÃO: Tabela de Vendas
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,

  -- Dados da venda
  data_venda DATE NOT NULL,
  quantidade_cabecas INTEGER NOT NULL CHECK (quantidade_cabecas > 0),
  peso_total_kg DECIMAL(12, 2) NOT NULL CHECK (peso_total_kg > 0),
  peso_total_arrobas DECIMAL(12, 2) NOT NULL,
  preco_arroba_venda DECIMAL(10, 2) NOT NULL CHECK (preco_arroba_venda > 0),
  valor_total_venda DECIMAL(14, 2) NOT NULL,
  custo_total DECIMAL(14, 2) NOT NULL DEFAULT 0,
  lucro_bruto DECIMAL(14, 2) NOT NULL,
  margem_percentual DECIMAL(6, 2) NOT NULL,
  atingiu_objetivo BOOLEAN NOT NULL DEFAULT false,
  comprador VARCHAR(255),
  observacoes TEXT,

  -- Post Mortem (dados do frigorífico)
  post_mortem_data DATE,
  post_mortem_frigorifico VARCHAR(255),
  post_mortem_rendimento_carcaca DECIMAL(5, 2) CHECK (
    post_mortem_rendimento_carcaca IS NULL OR
    (post_mortem_rendimento_carcaca >= 0 AND post_mortem_rendimento_carcaca <= 100)
  ),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_vendas_usuario_id ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_lote_id ON vendas(lote_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_atingiu_objetivo ON vendas(atingiu_objetivo);

-- RLS (Row Level Security)
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias vendas"
  ON vendas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar suas próprias vendas"
  ON vendas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias vendas"
  ON vendas FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias vendas"
  ON vendas FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_vendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_vendas_updated_at();

-- Comentários na tabela
COMMENT ON TABLE vendas IS 'Registro de vendas de animais/lotes';
COMMENT ON COLUMN vendas.peso_total_arrobas IS 'Peso convertido para arrobas (kg / 15)';
COMMENT ON COLUMN vendas.margem_percentual IS 'Margem de lucro percentual sobre o custo';
COMMENT ON COLUMN vendas.atingiu_objetivo IS 'Se atingiu o objetivo de 25% de margem';
COMMENT ON COLUMN vendas.post_mortem_rendimento_carcaca IS 'Percentual de rendimento de carcaça informado pelo frigorífico';
