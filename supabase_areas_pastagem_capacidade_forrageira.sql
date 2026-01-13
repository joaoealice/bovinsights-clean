-- =====================================================
-- MIGRATION: Capacidade Forrageira para Áreas de Pastagem
-- =====================================================
-- Esta migration adiciona campos para calcular o potencial
-- forrageiro dos piquetes cadastrados.
-- =====================================================

-- Adicionar novos campos para capacidade forrageira
ALTER TABLE areas_pastagem
ADD COLUMN IF NOT EXISTS tipo_pasto VARCHAR(50),
ADD COLUMN IF NOT EXISTS ms_total_kg DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS altura_entrada_cm DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS altura_saida_cm DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS eficiencia DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS capacidade_ua DECIMAL(10,2);

-- Comentários para documentação
COMMENT ON COLUMN areas_pastagem.tipo_pasto IS 'Tipo do pasto: marandu, mombaca, decumbens';
COMMENT ON COLUMN areas_pastagem.ms_total_kg IS 'Matéria seca total em kg';
COMMENT ON COLUMN areas_pastagem.altura_entrada_cm IS 'Altura de entrada dos animais em cm';
COMMENT ON COLUMN areas_pastagem.altura_saida_cm IS 'Altura de saída dos animais em cm';
COMMENT ON COLUMN areas_pastagem.eficiencia IS 'Eficiência de pastejo (0 a 1)';
COMMENT ON COLUMN areas_pastagem.capacidade_ua IS 'Capacidade em unidades animais (UA)';

-- Índice para consultas por tipo de pasto
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_tipo_pasto ON areas_pastagem(tipo_pasto);
