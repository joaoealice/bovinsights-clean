-- =====================================================
-- MÓDULO: Nutrição e Alimentação de Confinamento
-- Fase 1 MVP: Projeção Alimentar, Leitura de Cocho, Alertas
-- =====================================================

-- =====================================================
-- 1. TABELA: dietas (Perfis de Dieta Reutilizáveis)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dietas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Identificação
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('adaptacao', 'crescimento', 'terminacao_alto_grao', 'terminacao_convencional')),
    descricao TEXT,

    -- Composição da Dieta (em %)
    percentual_volumoso DECIMAL(5, 2) NOT NULL DEFAULT 15.00,     -- % volumoso na MS total
    percentual_concentrado DECIMAL(5, 2) NOT NULL DEFAULT 85.00, -- % concentrado na MS total

    -- Teor de Matéria Seca dos Ingredientes
    ms_volumoso DECIMAL(5, 2) NOT NULL DEFAULT 35.00,            -- % MS do volumoso
    ms_concentrado DECIMAL(5, 2) NOT NULL DEFAULT 88.00,         -- % MS do concentrado

    -- Custos (R$/kg Matéria Natural)
    custo_volumoso_kg DECIMAL(10, 4) NOT NULL DEFAULT 0.18,
    custo_concentrado_kg DECIMAL(10, 4) NOT NULL DEFAULT 1.85,

    -- Parâmetros de Consumo
    consumo_ms_percentual_pv DECIMAL(4, 2) NOT NULL DEFAULT 2.20, -- Consumo MS como % do PV
    consumo_ms_minimo DECIMAL(4, 2) DEFAULT 1.80,                 -- Mínimo aceitável
    consumo_ms_maximo DECIMAL(4, 2) DEFAULT 2.50,                 -- Máximo aceitável

    -- GMD Esperado para esta dieta
    gmd_esperado DECIMAL(4, 3) DEFAULT 1.400,                     -- kg/dia

    -- Conversão Alimentar de Referência
    ca_referencia DECIMAL(4, 2) DEFAULT 6.50,                     -- kg MS / kg ganho

    -- Status
    ativo BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dietas_usuario_id ON public.dietas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dietas_tipo ON public.dietas(tipo);

-- RLS
ALTER TABLE public.dietas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own dietas" ON public.dietas;
CREATE POLICY "Users can manage own dietas"
    ON public.dietas FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 2. TABELA: projecoes_lote (Cenários de Projeção)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projecoes_lote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,
    dieta_id UUID REFERENCES public.dietas(id) ON DELETE SET NULL,

    -- Parâmetros de Entrada
    nome_projecao VARCHAR(100),
    data_inicio DATE NOT NULL,
    dias_confinamento INTEGER NOT NULL,                          -- Dias planejados
    gmd_alvo DECIMAL(4, 3) NOT NULL,                             -- kg/dia alvo
    peso_inicial DECIMAL(8, 2) NOT NULL,                         -- Peso médio inicial (kg)
    quantidade_animais INTEGER NOT NULL,

    -- Parâmetros de Dieta (snapshot ou custom)
    consumo_ms_percentual_pv DECIMAL(4, 2) NOT NULL,
    percentual_volumoso DECIMAL(5, 2) NOT NULL,
    percentual_concentrado DECIMAL(5, 2) NOT NULL,
    ms_volumoso DECIMAL(5, 2) NOT NULL,
    ms_concentrado DECIMAL(5, 2) NOT NULL,
    custo_volumoso_kg DECIMAL(10, 4) NOT NULL,
    custo_concentrado_kg DECIMAL(10, 4) NOT NULL,

    -- Resultados Calculados (Por Animal)
    consumo_ms_diario_animal DECIMAL(8, 4),                      -- kg MS/animal/dia
    consumo_volumoso_mn_animal DECIMAL(8, 4),                    -- kg MN volumoso/animal/dia
    consumo_concentrado_mn_animal DECIMAL(8, 4),                 -- kg MN concentrado/animal/dia
    custo_alimentar_diario_animal DECIMAL(10, 4),                -- R$/animal/dia

    -- Resultados Calculados (Por Lote)
    consumo_ms_diario_lote DECIMAL(10, 2),                       -- kg MS/lote/dia
    custo_alimentar_diario_lote DECIMAL(12, 2),                  -- R$/lote/dia
    custo_alimentar_total DECIMAL(14, 2),                        -- R$ total período

    -- Projeções de Saída
    peso_final_projetado DECIMAL(8, 2),                          -- kg médio final
    arrobas_projetadas DECIMAL(10, 2),                           -- @ total do lote
    data_saida_projetada DATE,
    ca_projetado DECIMAL(4, 2),                                  -- Conversão alimentar

    -- Status
    ativo BOOLEAN DEFAULT true,                                  -- Projeção em uso

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projecoes_lote_usuario_id ON public.projecoes_lote(usuario_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_lote_lote_id ON public.projecoes_lote(lote_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_lote_ativo ON public.projecoes_lote(lote_id, ativo);

-- RLS
ALTER TABLE public.projecoes_lote ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own projecoes" ON public.projecoes_lote;
CREATE POLICY "Users can manage own projecoes"
    ON public.projecoes_lote FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 3. TABELA: leituras_cocho (Registro Diário de Trato)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leituras_cocho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID NOT NULL REFERENCES public.lotes(id) ON DELETE CASCADE,

    -- Data e Trato
    data_leitura DATE NOT NULL,
    numero_trato INTEGER NOT NULL DEFAULT 1,                     -- 1º, 2º, 3º trato do dia

    -- Quantidades Fornecidas (kg Matéria Natural)
    volumoso_fornecido_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    concentrado_fornecido_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,

    -- Sobras
    sobra_percentual DECIMAL(5, 2),                              -- % estimado de sobra
    sobra_kg DECIMAL(10, 2),                                     -- kg de sobra (se pesado)

    -- Escore de Cocho (0-5)
    escore_cocho INTEGER CHECK (escore_cocho BETWEEN 0 AND 5),

    -- Consumo Calculado
    consumo_volumoso_kg DECIMAL(10, 2),                          -- Fornecido - Sobra
    consumo_concentrado_kg DECIMAL(10, 2),
    consumo_total_mn_kg DECIMAL(10, 2),                          -- Total MN consumido
    consumo_total_ms_kg DECIMAL(10, 2),                          -- Total MS consumido

    -- Observações
    observacoes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: um registro por lote/data/trato
    CONSTRAINT unique_leitura_cocho UNIQUE (lote_id, data_leitura, numero_trato)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_usuario_id ON public.leituras_cocho(usuario_id);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_lote_id ON public.leituras_cocho(lote_id);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_data ON public.leituras_cocho(data_leitura);
CREATE INDEX IF NOT EXISTS idx_leituras_cocho_lote_data ON public.leituras_cocho(lote_id, data_leitura);

-- RLS
ALTER TABLE public.leituras_cocho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own leituras_cocho" ON public.leituras_cocho;
CREATE POLICY "Users can manage own leituras_cocho"
    ON public.leituras_cocho FOR ALL USING (auth.uid() = usuario_id);

-- =====================================================
-- 4. ADICIONAR CAMPOS NA TABELA LOTES
-- =====================================================

ALTER TABLE public.lotes
ADD COLUMN IF NOT EXISTS dieta_id UUID REFERENCES public.dietas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS projecao_ativa_id UUID REFERENCES public.projecoes_lote(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gmd_alvo DECIMAL(4, 3),
ADD COLUMN IF NOT EXISTS data_prevista_saida DATE;

-- =====================================================
-- 5. VIEW: consumo_diario_lote (Consolidação por Data)
-- =====================================================

CREATE OR REPLACE VIEW public.view_consumo_diario_lote AS
SELECT
    lc.usuario_id,
    lc.lote_id,
    lc.data_leitura,
    l.nome AS lote_nome,
    l.quantidade_total AS quantidade_animais,

    -- Totais do dia (soma de todos os tratos)
    SUM(lc.volumoso_fornecido_kg) AS volumoso_fornecido_total,
    SUM(lc.concentrado_fornecido_kg) AS concentrado_fornecido_total,
    SUM(lc.consumo_volumoso_kg) AS consumo_volumoso_total,
    SUM(lc.consumo_concentrado_kg) AS consumo_concentrado_total,
    SUM(lc.consumo_total_ms_kg) AS consumo_ms_total,

    -- Médias
    AVG(lc.escore_cocho) AS escore_medio,

    -- Por animal
    CASE WHEN l.quantidade_total > 0
        THEN SUM(lc.consumo_total_ms_kg) / l.quantidade_total
        ELSE 0
    END AS consumo_ms_por_animal,

    -- Contagem de tratos
    COUNT(*) AS quantidade_tratos

FROM public.leituras_cocho lc
JOIN public.lotes l ON lc.lote_id = l.id
GROUP BY lc.usuario_id, lc.lote_id, lc.data_leitura, l.nome, l.quantidade_total;

-- =====================================================
-- 6. FUNÇÃO: Calcular Projeção Alimentar
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_projecao_alimentar(
    p_peso_inicial DECIMAL,
    p_quantidade_animais INTEGER,
    p_dias_confinamento INTEGER,
    p_gmd_alvo DECIMAL,
    p_consumo_ms_pv DECIMAL,
    p_perc_volumoso DECIMAL,
    p_perc_concentrado DECIMAL,
    p_ms_volumoso DECIMAL,
    p_ms_concentrado DECIMAL,
    p_custo_volumoso DECIMAL,
    p_custo_concentrado DECIMAL
) RETURNS TABLE (
    consumo_ms_diario_animal DECIMAL,
    consumo_volumoso_mn_animal DECIMAL,
    consumo_concentrado_mn_animal DECIMAL,
    custo_alimentar_diario_animal DECIMAL,
    consumo_ms_diario_lote DECIMAL,
    custo_alimentar_diario_lote DECIMAL,
    custo_alimentar_total DECIMAL,
    peso_final_projetado DECIMAL,
    arrobas_projetadas DECIMAL,
    ca_projetado DECIMAL
) AS $$
DECLARE
    v_consumo_ms DECIMAL;
    v_consumo_vol_ms DECIMAL;
    v_consumo_conc_ms DECIMAL;
    v_consumo_vol_mn DECIMAL;
    v_consumo_conc_mn DECIMAL;
    v_custo_diario DECIMAL;
    v_peso_final DECIMAL;
BEGIN
    -- Consumo MS por animal (kg/dia)
    v_consumo_ms := p_peso_inicial * (p_consumo_ms_pv / 100);

    -- Consumo por componente em MS
    v_consumo_vol_ms := v_consumo_ms * (p_perc_volumoso / 100);
    v_consumo_conc_ms := v_consumo_ms * (p_perc_concentrado / 100);

    -- Conversão para Matéria Natural
    v_consumo_vol_mn := v_consumo_vol_ms / (p_ms_volumoso / 100);
    v_consumo_conc_mn := v_consumo_conc_ms / (p_ms_concentrado / 100);

    -- Custo diário por animal
    v_custo_diario := (v_consumo_vol_mn * p_custo_volumoso) + (v_consumo_conc_mn * p_custo_concentrado);

    -- Peso final projetado
    v_peso_final := p_peso_inicial + (p_gmd_alvo * p_dias_confinamento);

    RETURN QUERY SELECT
        ROUND(v_consumo_ms, 4)::DECIMAL,
        ROUND(v_consumo_vol_mn, 4)::DECIMAL,
        ROUND(v_consumo_conc_mn, 4)::DECIMAL,
        ROUND(v_custo_diario, 4)::DECIMAL,
        ROUND(v_consumo_ms * p_quantidade_animais, 2)::DECIMAL,
        ROUND(v_custo_diario * p_quantidade_animais, 2)::DECIMAL,
        ROUND(v_custo_diario * p_quantidade_animais * p_dias_confinamento, 2)::DECIMAL,
        ROUND(v_peso_final, 2)::DECIMAL,
        ROUND((v_peso_final * p_quantidade_animais) / 30, 2)::DECIMAL,
        ROUND(v_consumo_ms / p_gmd_alvo, 2)::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Dietas
CREATE OR REPLACE FUNCTION update_dietas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dietas_updated_at ON public.dietas;
CREATE TRIGGER trigger_dietas_updated_at
    BEFORE UPDATE ON public.dietas
    FOR EACH ROW
    EXECUTE FUNCTION update_dietas_updated_at();

-- Projeções
CREATE OR REPLACE FUNCTION update_projecoes_lote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_projecoes_lote_updated_at ON public.projecoes_lote;
CREATE TRIGGER trigger_projecoes_lote_updated_at
    BEFORE UPDATE ON public.projecoes_lote
    FOR EACH ROW
    EXECUTE FUNCTION update_projecoes_lote_updated_at();

-- Leituras Cocho
CREATE OR REPLACE FUNCTION update_leituras_cocho_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leituras_cocho_updated_at ON public.leituras_cocho;
CREATE TRIGGER trigger_leituras_cocho_updated_at
    BEFORE UPDATE ON public.leituras_cocho
    FOR EACH ROW
    EXECUTE FUNCTION update_leituras_cocho_updated_at();

-- =====================================================
-- 8. INSERIR DIETAS PADRÃO
-- =====================================================

-- Nota: Estas dietas serão inseridas quando o usuário criar sua primeira dieta
-- ou podem ser usadas como template

COMMENT ON TABLE public.dietas IS 'Perfis de dieta reutilizáveis para confinamento';
COMMENT ON TABLE public.projecoes_lote IS 'Cenários de projeção alimentar por lote';
COMMENT ON TABLE public.leituras_cocho IS 'Registro diário de fornecimento e consumo no cocho';
