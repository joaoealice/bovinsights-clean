-- =====================================================
-- MIGRACAO COMPLETA: Todas as Tabelas do BovInsights
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TABELA: vendas
-- =====================================================
CREATE TABLE IF NOT EXISTS vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
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
  post_mortem_data DATE,
  post_mortem_frigorifico VARCHAR(255),
  post_mortem_rendimento_carcaca DECIMAL(5, 2) CHECK (
    post_mortem_rendimento_carcaca IS NULL OR
    (post_mortem_rendimento_carcaca >= 0 AND post_mortem_rendimento_carcaca <= 100)
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_vendas_usuario_id ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vendas_lote_id ON vendas(lote_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda DESC);

ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "vendas_select" ON vendas FOR SELECT USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "vendas_insert" ON vendas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "vendas_update" ON vendas FOR UPDATE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "vendas_delete" ON vendas FOR DELETE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 2. TABELA: pesagens
-- =====================================================
CREATE TABLE IF NOT EXISTS pesagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES animais(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  peso DECIMAL(10, 2) NOT NULL CHECK (peso > 0),
  data_pesagem DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_pesagens_usuario_id ON pesagens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pesagens_animal_id ON pesagens(animal_id);
CREATE INDEX IF NOT EXISTS idx_pesagens_lote_id ON pesagens(lote_id);
CREATE INDEX IF NOT EXISTS idx_pesagens_data_pesagem ON pesagens(data_pesagem DESC);

ALTER TABLE pesagens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pesagens_select" ON pesagens FOR SELECT USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "pesagens_insert" ON pesagens FOR INSERT WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "pesagens_update" ON pesagens FOR UPDATE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "pesagens_delete" ON pesagens FOR DELETE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 3. TABELA: despesas
-- =====================================================
CREATE TABLE IF NOT EXISTS despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,
  categoria VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL CHECK (valor > 0),
  data_despesa DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT categoria_valida CHECK (categoria IN ('suplementacao', 'sal_mineral', 'medicamentos', 'mao_de_obra', 'eletricidade', 'manutencao', 'outros'))
);

CREATE INDEX IF NOT EXISTS idx_despesas_usuario_id ON despesas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesas_lote_id ON despesas(lote_id);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas(categoria);
CREATE INDEX IF NOT EXISTS idx_despesas_data_despesa ON despesas(data_despesa DESC);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "despesas_select" ON despesas FOR SELECT USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "despesas_insert" ON despesas FOR INSERT WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "despesas_update" ON despesas FOR UPDATE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "despesas_delete" ON despesas FOR DELETE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 4. TABELA: market_prices (cotacoes do mercado)
-- =====================================================
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  price_cash DECIMAL(10, 2) NOT NULL,
  price_term DECIMAL(10, 2),
  reference_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_market_prices_reference_date ON market_prices(reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_state ON market_prices(state);

-- =====================================================
-- 5. TABELA: market_indicators (indicadores do mercado)
-- =====================================================
CREATE TABLE IF NOT EXISTS market_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_type VARCHAR(100) NOT NULL,
  reference_date DATE NOT NULL,
  state VARCHAR(100),
  region VARCHAR(100),
  price_today DECIMAL(10, 2) NOT NULL,
  price_yesterday DECIMAL(10, 2),
  diff DECIMAL(10, 2),
  trend VARCHAR(20) DEFAULT 'stable',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT trend_valido CHECK (trend IN ('up', 'down', 'stable'))
);

CREATE INDEX IF NOT EXISTS idx_market_indicators_reference_date ON market_indicators(reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_indicators_type ON market_indicators(indicator_type);

-- =====================================================
-- 6. TABELA: perfil_usuario
-- =====================================================
CREATE TABLE IF NOT EXISTS perfil_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome_fazenda VARCHAR(255),
  localizacao VARCHAR(255),
  telefone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_perfil_usuario_usuario_id ON perfil_usuario(usuario_id);

ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "perfil_select" ON perfil_usuario FOR SELECT USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "perfil_insert" ON perfil_usuario FOR INSERT WITH CHECK (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "perfil_update" ON perfil_usuario FOR UPDATE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "perfil_delete" ON perfil_usuario FOR DELETE USING (auth.uid() = usuario_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 7. FOREIGN KEYS ADICIONAIS (se nao existirem)
-- =====================================================

-- FK de vendas para lotes
DO $$ BEGIN
  ALTER TABLE vendas ADD CONSTRAINT fk_vendas_lote
  FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FK de pesagens para animais
DO $$ BEGIN
  ALTER TABLE pesagens ADD CONSTRAINT fk_pesagens_animal
  FOREIGN KEY (animal_id) REFERENCES animais(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FK de pesagens para lotes
DO $$ BEGIN
  ALTER TABLE pesagens ADD CONSTRAINT fk_pesagens_lote
  FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FK de despesas para lotes
DO $$ BEGIN
  ALTER TABLE despesas ADD CONSTRAINT fk_despesas_lote
  FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =====================================================
-- 8. TRIGGERS para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendas_updated_at ON vendas;
CREATE TRIGGER trigger_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pesagens_updated_at ON pesagens;
CREATE TRIGGER trigger_pesagens_updated_at
  BEFORE UPDATE ON pesagens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_despesas_updated_at ON despesas;
CREATE TRIGGER trigger_despesas_updated_at
  BEFORE UPDATE ON despesas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_perfil_updated_at ON perfil_usuario;
CREATE TRIGGER trigger_perfil_updated_at
  BEFORE UPDATE ON perfil_usuario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DA MIGRACAO
-- =====================================================
SELECT 'Migracao completa executada com sucesso!' as resultado;
