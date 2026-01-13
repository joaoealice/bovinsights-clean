-- =====================================================
-- MIGRATION: Áreas de Pastagem (Suporte Forrageiro)
-- =====================================================
-- Esta tabela armazena as áreas de pastagem desenhadas
-- pelo usuário, vinculadas a lotes específicos.
-- No futuro será usada para monitoramento de clima,
-- índice de vegetação (NDVI), etc.
-- =====================================================

-- Tabela de Áreas de Pastagem
CREATE TABLE IF NOT EXISTS areas_pastagem (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,

    -- Informações básicas
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,

    -- Dados geométricos
    area_hectares DECIMAL(12,4) NOT NULL,
    perimetro_km DECIMAL(12,4) NOT NULL,
    centroid_lat DECIMAL(12,8) NOT NULL,
    centroid_lng DECIMAL(12,8) NOT NULL,
    bbox_json JSONB NOT NULL,           -- Bounding box [minLng, minLat, maxLng, maxLat]
    geojson JSONB NOT NULL,             -- GeoJSON completo do polígono
    pontos INTEGER NOT NULL,            -- Quantidade de vértices

    -- Status
    ativo BOOLEAN DEFAULT true,

    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_usuario ON areas_pastagem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_lote ON areas_pastagem(lote_id);
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_ativo ON areas_pastagem(ativo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_areas_pastagem_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_areas_pastagem_updated_at ON areas_pastagem;
CREATE TRIGGER trigger_areas_pastagem_updated_at
    BEFORE UPDATE ON areas_pastagem
    FOR EACH ROW
    EXECUTE FUNCTION update_areas_pastagem_updated_at();

-- RLS (Row Level Security)
ALTER TABLE areas_pastagem ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver suas próprias áreas" ON areas_pastagem;
CREATE POLICY "Usuários podem ver suas próprias áreas"
    ON areas_pastagem FOR SELECT
    USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias áreas" ON areas_pastagem;
CREATE POLICY "Usuários podem inserir suas próprias áreas"
    ON areas_pastagem FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias áreas" ON areas_pastagem;
CREATE POLICY "Usuários podem atualizar suas próprias áreas"
    ON areas_pastagem FOR UPDATE
    USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias áreas" ON areas_pastagem;
CREATE POLICY "Usuários podem deletar suas próprias áreas"
    ON areas_pastagem FOR DELETE
    USING (auth.uid() = usuario_id);

-- Comentários
COMMENT ON TABLE areas_pastagem IS 'Áreas de pastagem desenhadas pelo usuário para monitoramento';
COMMENT ON COLUMN areas_pastagem.lote_id IS 'Lote vinculado (opcional)';
COMMENT ON COLUMN areas_pastagem.geojson IS 'GeoJSON completo do polígono da área';
COMMENT ON COLUMN areas_pastagem.bbox_json IS 'Bounding box para consultas de satélite';
