-- Migração para sincronizar o schema da tabela animais com o código
-- Adiciona todas as colunas que podem estar faltando

-- Coluna tipo (Engorda, Terminação, Recria, Cria)
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'Engorda';

-- Coluna idade_meses
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS idade_meses INTEGER;

-- Coluna data_nascimento
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Coluna preco_arroba_compra
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS preco_arroba_compra DECIMAL(10,2);

-- Coluna valor_total_compra
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS valor_total_compra DECIMAL(10,2);

-- Coluna observacoes
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Coluna updated_at
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
