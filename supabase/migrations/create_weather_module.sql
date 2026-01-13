-- =====================================================
-- MÓDULO: Clima & Tempo
-- Descrição: Adiciona suporte a dados climáticos baseados
-- na localização da fazenda (município/estado)
-- API: Open-Meteo (gratuita, sem API key)
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COORDENADAS NA TABELA perfil_usuario
-- =====================================================

-- Adicionar colunas de latitude e longitude
ALTER TABLE public.perfil_usuario
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS coordenadas_atualizadas_em TIMESTAMPTZ;

-- Comentários nas colunas
COMMENT ON COLUMN public.perfil_usuario.latitude IS 'Latitude da fazenda (obtida via geocodificação do município/estado)';
COMMENT ON COLUMN public.perfil_usuario.longitude IS 'Longitude da fazenda (obtida via geocodificação do município/estado)';
COMMENT ON COLUMN public.perfil_usuario.coordenadas_atualizadas_em IS 'Data/hora da última atualização das coordenadas';

-- =====================================================
-- 2. CRIAR TABELA weather_data
-- =====================================================

CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Dados de localização (snapshot no momento da consulta)
    cidade VARCHAR(200),
    estado VARCHAR(2),
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,

    -- Dados climáticos atuais
    temperatura_atual DECIMAL(5, 2),           -- Celsius
    temperatura_maxima DECIMAL(5, 2),          -- Celsius
    temperatura_minima DECIMAL(5, 2),          -- Celsius
    sensacao_termica DECIMAL(5, 2),            -- Celsius
    umidade_relativa INTEGER,                  -- Percentual (0-100)
    precipitacao DECIMAL(6, 2),                -- mm
    probabilidade_chuva INTEGER,               -- Percentual (0-100)
    velocidade_vento DECIMAL(5, 2),            -- km/h
    direcao_vento INTEGER,                     -- Graus (0-360)
    rajada_vento DECIMAL(5, 2),                -- km/h
    pressao_atmosferica DECIMAL(7, 2),         -- hPa
    indice_uv DECIMAL(4, 2),                   -- Índice UV
    visibilidade DECIMAL(8, 2),                -- km
    cobertura_nuvens INTEGER,                  -- Percentual (0-100)

    -- Código de condição climática (WMO Weather interpretation codes)
    codigo_clima INTEGER,
    descricao_clima VARCHAR(100),

    -- Dados de nascer/pôr do sol
    nascer_sol TIME,
    por_sol TIME,
    duracao_dia_horas DECIMAL(4, 2),

    -- Índices agrícolas calculados
    indice_estresse_termico DECIMAL(4, 2),     -- ITU (Índice de Temperatura e Umidade)
    alerta_estresse VARCHAR(20),               -- 'normal', 'leve', 'moderado', 'severo'

    -- Previsão resumida (próximos dias)
    previsao_json JSONB,                       -- Array com previsão de 7 dias

    -- Controle
    data_consulta DATE NOT NULL,               -- Data de referência dos dados
    fonte VARCHAR(50) DEFAULT 'open-meteo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_weather_data_usuario_id ON public.weather_data(usuario_id);
CREATE INDEX IF NOT EXISTS idx_weather_data_data_consulta ON public.weather_data(data_consulta);
CREATE INDEX IF NOT EXISTS idx_weather_data_usuario_data ON public.weather_data(usuario_id, data_consulta DESC);

-- Constraint de unicidade: apenas um registro por usuário por dia
ALTER TABLE public.weather_data
ADD CONSTRAINT unique_weather_usuario_data UNIQUE (usuario_id, data_consulta);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_weather_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_weather_data_updated_at ON public.weather_data;
CREATE TRIGGER trigger_weather_data_updated_at
    BEFORE UPDATE ON public.weather_data
    FOR EACH ROW
    EXECUTE FUNCTION update_weather_data_updated_at();

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados climáticos
DROP POLICY IF EXISTS "Users can view own weather_data" ON public.weather_data;
CREATE POLICY "Users can view own weather_data"
    ON public.weather_data
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: Usuários podem inserir seus próprios dados climáticos
DROP POLICY IF EXISTS "Users can insert own weather_data" ON public.weather_data;
CREATE POLICY "Users can insert own weather_data"
    ON public.weather_data
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Usuários podem atualizar seus próprios dados climáticos
DROP POLICY IF EXISTS "Users can update own weather_data" ON public.weather_data;
CREATE POLICY "Users can update own weather_data"
    ON public.weather_data
    FOR UPDATE
    USING (auth.uid() = usuario_id);

-- Política: Usuários podem deletar seus próprios dados climáticos
DROP POLICY IF EXISTS "Users can delete own weather_data" ON public.weather_data;
CREATE POLICY "Users can delete own weather_data"
    ON public.weather_data
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- =====================================================
-- 4. FUNÇÃO PARA CALCULAR ÍNDICE DE ESTRESSE TÉRMICO (ITU)
-- =====================================================

-- ITU = Índice de Temperatura e Umidade
-- Fórmula: ITU = 0.8 * T + (UR/100) * (T - 14.4) + 46.4
-- Onde: T = temperatura (°C), UR = umidade relativa (%)
-- Classificação:
--   ITU < 72: Normal (conforto térmico)
--   72 <= ITU < 78: Estresse leve
--   78 <= ITU < 82: Estresse moderado
--   ITU >= 82: Estresse severo

CREATE OR REPLACE FUNCTION calcular_estresse_termico(
    temperatura DECIMAL,
    umidade INTEGER
) RETURNS TABLE (
    itu DECIMAL(4, 2),
    alerta VARCHAR(20)
) AS $$
DECLARE
    itu_calculado DECIMAL(4, 2);
    alerta_nivel VARCHAR(20);
BEGIN
    -- Calcular ITU
    itu_calculado := 0.8 * temperatura + (umidade::DECIMAL / 100) * (temperatura - 14.4) + 46.4;

    -- Determinar nível de alerta
    IF itu_calculado < 72 THEN
        alerta_nivel := 'normal';
    ELSIF itu_calculado < 78 THEN
        alerta_nivel := 'leve';
    ELSIF itu_calculado < 82 THEN
        alerta_nivel := 'moderado';
    ELSE
        alerta_nivel := 'severo';
    END IF;

    RETURN QUERY SELECT itu_calculado, alerta_nivel;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. COMENTÁRIOS NA TABELA
-- =====================================================

COMMENT ON TABLE public.weather_data IS 'Dados climáticos diários obtidos da API Open-Meteo';
COMMENT ON COLUMN public.weather_data.codigo_clima IS 'Código WMO de interpretação climática (0=céu limpo, 1-3=parcialmente nublado, etc)';
COMMENT ON COLUMN public.weather_data.indice_estresse_termico IS 'ITU - Índice de Temperatura e Umidade para bovinos';
COMMENT ON COLUMN public.weather_data.alerta_estresse IS 'Nível de alerta: normal, leve, moderado, severo';
COMMENT ON COLUMN public.weather_data.previsao_json IS 'Previsão dos próximos 7 dias em formato JSON';
