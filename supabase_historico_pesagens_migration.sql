-- =====================================================
-- MIGRACAO: Adicionar coluna historico_pesagens na tabela lotes
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna historico_pesagens como JSONB
-- Esta coluna armazena o historico de pesagens agregadas do lote
-- Estrutura esperada: [{ data: string, peso_total: number, quantidade_animais: number, peso_medio: number }]
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS historico_pesagens JSONB DEFAULT '[]'::JSONB;

-- Criar indice para melhor performance em consultas JSONB (opcional)
CREATE INDEX IF NOT EXISTS idx_lotes_historico_pesagens ON lotes USING GIN (historico_pesagens);

-- =====================================================
-- FIM DA MIGRACAO
-- =====================================================
SELECT 'Coluna historico_pesagens adicionada com sucesso na tabela lotes!' as resultado;
