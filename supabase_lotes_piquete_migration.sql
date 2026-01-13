-- Migration: Adicionar campos de manejo de pastagem aos lotes
-- Permite vincular lotes a piquetes e calcular dias de permanência

ALTER TABLE lotes
ADD COLUMN IF NOT EXISTS piquete_id UUID REFERENCES areas_pastagem(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS peso_medio_animal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS dias_permanencia_ideal INTEGER,
ADD COLUMN IF NOT EXISTS data_entrada_piquete DATE;

-- Índice para busca por piquete
CREATE INDEX IF NOT EXISTS idx_lotes_piquete ON lotes(piquete_id);

-- Comentários
COMMENT ON COLUMN lotes.piquete_id IS 'Piquete vinculado ao lote (para pastagem/semi)';
COMMENT ON COLUMN lotes.peso_medio_animal IS 'Peso médio dos animais em kg';
COMMENT ON COLUMN lotes.dias_permanencia_ideal IS 'Dias ideais de permanência no piquete';
COMMENT ON COLUMN lotes.data_entrada_piquete IS 'Data de entrada no piquete atual';
