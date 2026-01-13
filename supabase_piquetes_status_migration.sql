-- Migration: Status e Controle de Rotação de Piquetes
-- Adiciona campos para controlar o status e histórico de rotação dos piquetes

-- Adicionar novos campos na tabela areas_pastagem
ALTER TABLE areas_pastagem
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'disponivel',
ADD COLUMN IF NOT EXISTS data_ultima_saida DATE,
ADD COLUMN IF NOT EXISTS lote_atual_id UUID REFERENCES lotes(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_status ON areas_pastagem(status);
CREATE INDEX IF NOT EXISTS idx_areas_pastagem_lote_atual ON areas_pastagem(lote_atual_id);

-- Comentários
COMMENT ON COLUMN areas_pastagem.status IS 'Status do piquete: disponivel, lotado, recuperacao';
COMMENT ON COLUMN areas_pastagem.data_ultima_saida IS 'Data em que o último lote saiu do piquete';
COMMENT ON COLUMN areas_pastagem.lote_atual_id IS 'Lote atualmente ocupando este piquete';
