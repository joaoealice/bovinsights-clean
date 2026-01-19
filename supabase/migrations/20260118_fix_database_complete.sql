-- =====================================================
-- MIGRATION COMPLETA: Correções do Banco de Dados
-- Data: 2026-01-18
-- =====================================================
-- Esta migration corrige:
-- 1. Constraint animais_brinco_key (deve ser única por usuário, não global)
-- 2. Cria tabela leituras_cocho se não existir
-- 3. Cria tabela dietas se não existir
-- 4. Cria tabela projecoes_lote se não existir
-- 5. Garante RLS em todas as tabelas
-- =====================================================

-- =====================================================
-- 1. CORRIGIR CONSTRAINT DO BRINCO (animais)
-- =====================================================

-- Remove constraint global se existir
ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_brinco_key;
DROP INDEX IF EXISTS animais_brinco_key;

-- Cria constraint composta (brinco único por usuário)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'animais_usuario_brinco_unique'
    ) THEN
        ALTER TABLE animais ADD CONSTRAINT animais_usuario_brinco_unique UNIQUE (usuario_id, brinco);
    END IF;
END $$;

-- =====================================================
-- 2. TABELA: dietas (Perfis de Dieta Reutilizáveis)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dietas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('adaptacao', 'crescimento', 'terminacao_alto_grao', 'terminacao_convencional')),
    descricao TEXT,
    percentual_volumoso DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    percentual_concentrado DECIMAL(5, 2) NOT NULL DEFAULT 85.00,
    ms_volumoso DECIMAL(5, 2) NOT NULL DEFAULT 35.00,
    ms_concentrado DECIMAL(5, 2) NOT NULL DEFAULT 88.00,
    custo_volumoso_kg DECIMAL(10, 4) NOT NULL DEFAULT 0.18,
    custo_concentrado_kg DECIMAL(10, 4) NOT NULL DEFAULT 1.85,
    consumo_ms_percentual_pv DECIMAL(4, 2) NOT NULL DEFAULT 2.20,
    consumo_ms_minimo DECIMAL(4, 2) DEFAULT 1.80,
    consumo_ms_maximo DECIMAL(4, 2) DEFAULT 2.50,
    gmd_esperado DECIMAL(4, 3) DEFAULT 1.400,
    ca_referencia DECIMAL(4, 2) DEFAULT 6.50,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dietas_usuario_id ON public.dietas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dietas_tipo ON public.dietas(tipo);

ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own dietas" ON public.dietas;
CREATE POLICY "Users can manage own dietas"
    ON public.dietas FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 3. TABELA: projecoes_lote (Cenários de Projeção)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projecoes_lote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    dieta_id UUID REFERENCES public.dietas(id) ON DELETE SET NULL,
    nome_projecao VARCHAR(100),
    data_inicio DATE NOT NULL,
    dias_confinamento INTEGER NOT NULL,
    gmd_alvo DECIMAL(4, 3) NOT NULL,
    peso_inicial DECIMAL(8, 2) NOT NULL,
    quantidade_animais INTEGER NOT NULL,
    consumo_ms_percentual_pv DECIMAL(4, 2) NOT NULL,
    percentual_volumoso DECIMAL(5, 2) NOT NULL,
    percentual_concentrado DECIMAL(5, 2) NOT NULL,
    ms_volumoso DECIMAL(5, 2) NOT NULL,
    ms_concentrado DECIMAL(5, 2) NOT NULL,
    custo_volumoso_kg DECIMAL(10, 4) NOT NULL,
    custo_concentrado_kg DECIMAL(10, 4) NOT NULL,
    consumo_ms_diario_animal DECIMAL(8, 4),
    consumo_volumoso_mn_animal DECIMAL(8, 4),
    consumo_concentrado_mn_animal DECIMAL(8, 4),
    custo_alimentar_diario_animal DECIMAL(10, 4),
    consumo_ms_diario_lote DECIMAL(10, 2),
    custo_alimentar_diario_lote DECIMAL(12, 2),
    custo_alimentar_total DECIMAL(14, 2),
    peso_final_projetado DECIMAL(8, 2),
    arrobas_projetadas DECIMAL(10, 2),
    data_saida_projetada DATE,
    ca_projetado DECIMAL(4, 2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projecoes_lote_usuario_id ON public.projecoes_lote(usuario_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_lote_lote_id ON public.projecoes_lote(lote_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_lote_ativo ON public.projecoes_lote(lote_id, ativo);

ALTER TABLE public.projecoes_lote ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own projecoes" ON public.projecoes_lote;
CREATE POLICY "Users can manage own projecoes"
    ON public.projecoes_lote FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 4. TABELA: leituras_cocho (Registro Diário de Trato)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leituras_cocho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    data_leitura DATE NOT NULL,
    numero_trato INTEGER NOT NULL DEFAULT 1,
    volumoso_fornecido_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    concentrado_fornecido_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    sobra_percentual DECIMAL(5, 2),
    sobra_kg DECIMAL(10, 2),
    escore_cocho INTEGER CHECK (escore_cocho BETWEEN 0 AND 5),
    consumo_volumoso_kg DECIMAL(10, 2),
    consumo_concentrado_kg DECIMAL(10, 2),
    consumo_total_mn_kg DECIMAL(10, 2),
    consumo_total_ms_kg DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_leitura_cocho UNIQUE (lote_id, data_leitura, numero_trato)
);

CREATE INDEX IF NOT EXISTS idx_leituras_cocho_usuario_id ON public.leituras_cocho(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_lote_id ON public.leituras_cocho(lote_id);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_data ON public.leituras_cocho(data_leitura);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_lote_data ON public.leituras_cocho(lote_id, data_leitura);

ALTER TABLE public.leituras_cocho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own leituras_cocho" ON public.leituras_cocho;
CREATE POLICY "Users can manage own leituras_cocho"
    ON public.leituras_cocho FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 5. ADICIONAR CAMPOS NA TABELA LOTES (se não existirem)
-- =====================================================

ALTER TABLE public.lotes
ADD COLUMN IF NOT EXISTS dieta_id UUID REFERENCES public.dietas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS projecao_ativa_id UUID REFERENCES public.projecoes_lote(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gmd_alvo DECIMAL(4, 3),
ADD COLUMN IF NOT EXISTS data_prevista_saida DATE;

-- =====================================================
-- 6. GARANTIR RLS EM TODAS AS TABELAS PRINCIPAIS
-- =====================================================

-- perfil_usuario
ALTER TABLE public.perfil_usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own perfil" ON public.perfil_usuario;
CREATE POLICY "Users can manage own perfil"
    ON public.perfil_usuario FOR ALL USING (auth.uid() = usuario_id);

-- lotes
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own lotes" ON public.lotes;
CREATE POLICY "Users can manage own lotes"
    ON public.lotes FOR ALL USING (auth.uid() = usuario_id);

-- animais
ALTER TABLE public.animais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own animais" ON public.animais;
CREATE POLICY "Users can manage own animais"
    ON public.animais FOR ALL USING (auth.uid() = usuario_id);

-- pesagens
ALTER TABLE public.pesagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own pesagens" ON public.pesagens;
CREATE POLICY "Users can manage own pesagens"
    ON public.pesagens FOR ALL USING (auth.uid() = usuario_id);

-- despesas
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own despesas" ON public.despesas;
CREATE POLICY "Users can manage own despesas"
    ON public.despesas FOR ALL USING (auth.uid() = usuario_id);

-- manejos
ALTER TABLE public.manejos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own manejos" ON public.manejos;
CREATE POLICY "Users can manage own manejos"
    ON public.manejos FOR ALL USING (auth.uid() = usuario_id);

-- vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own vendas" ON public.vendas;
CREATE POLICY "Users can manage own vendas"
    ON public.vendas FOR ALL USING (auth.uid() = usuario_id);

-- contas
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own contas" ON public.contas;
CREATE POLICY "Users can manage own contas"
    ON public.contas FOR ALL USING (auth.uid() = usuario_id);

-- movimentacoes
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own movimentacoes" ON public.movimentacoes;
CREATE POLICY "Users can manage own movimentacoes"
    ON public.movimentacoes FOR ALL USING (auth.uid() = usuario_id);

-- weather_data
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own weather_data" ON public.weather_data;
CREATE POLICY "Users can manage own weather_data"
    ON public.weather_data FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para as novas tabelas
DROP TRIGGER IF EXISTS trigger_dietas_updated_at ON public.dietas;
CREATE TRIGGER trigger_dietas_updated_at
    BEFORE UPDATE ON public.dietas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_projecoes_lote_updated_at ON public.projecoes_lote;
CREATE TRIGGER trigger_projecoes_lote_updated_at
    BEFORE UPDATE ON public.projecoes_lote
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_leituras_cocho_updated_at ON public.leituras_cocho;
CREATE TRIGGER trigger_leituras_cocho_updated_at
    BEFORE UPDATE ON public.leituras_cocho
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RESUMO DAS CORREÇÕES:
-- =====================================================
-- 1. animais.brinco agora é único por usuário (não global)
-- 2. Tabela leituras_cocho criada com RLS
-- 3. Tabela dietas criada com RLS
-- 4. Tabela projecoes_lote criada com RLS
-- 5. Todas as tabelas principais têm RLS habilitado
-- 6. Cada usuário só vê seus próprios dados
-- =====================================================
