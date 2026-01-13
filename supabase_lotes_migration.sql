-- =====================================================
-- MIGRACAO: Adicionar colunas na tabela lotes
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna status
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ativo';

-- Adicionar coluna capacidade_maxima (obrigatória)
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS capacidade_maxima INTEGER DEFAULT 100;

-- Adicionar coluna tipo_lote
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS tipo_lote VARCHAR(50);

-- Adicionar colunas de entrada de animais
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS data_entrada DATE;
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS quantidade_total INTEGER;
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS peso_total_entrada DECIMAL(12, 2);

-- Adicionar colunas de custos
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS preco_arroba_compra DECIMAL(10, 2);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS valor_animais DECIMAL(14, 2);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS frete DECIMAL(12, 2);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS comissao DECIMAL(12, 2);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS custo_total DECIMAL(14, 2);
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS custo_por_cabeca DECIMAL(12, 2);

-- Adicionar coluna fornecedor
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS fornecedor VARCHAR(255);

-- =====================================================
-- FIM DA MIGRACAO
-- =====================================================
SELECT 'Colunas adicionadas com sucesso na tabela lotes!' as resultado;
