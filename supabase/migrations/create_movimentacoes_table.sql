-- =====================================================
-- TABELA: movimentacoes
-- Descrição: Registro de todas as movimentações financeiras
-- para auditoria e controle de entradas/saídas
-- =====================================================

-- Criar tabela de movimentações
CREATE TABLE IF NOT EXISTS public.movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tipo e categoria da movimentação
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN (
        'venda',        -- Entrada de venda
        'recebimento',  -- Recebimento de conta a prazo
        'despesa',      -- Saída de despesa operacional
        'pagamento',    -- Pagamento de conta
        'compra_lote',  -- Compra de lote/animais
        'ajuste',       -- Ajuste manual
        'estorno'       -- Estorno/cancelamento
    )),

    -- Dados principais
    descricao TEXT NOT NULL,
    valor DECIMAL(12, 2) NOT NULL CHECK (valor > 0),
    data_movimentacao DATE NOT NULL,

    -- Referências para rastreabilidade
    venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
    despesa_id UUID REFERENCES public.despesas(id) ON DELETE SET NULL,
    conta_id UUID REFERENCES public.contas(id) ON DELETE SET NULL,
    lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,

    -- Detalhes extras para auditoria
    quantidade_animais INTEGER,
    peso_arrobas DECIMAL(10, 2),
    comprador_fornecedor VARCHAR(200),
    forma_pagamento VARCHAR(50),
    observacoes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_id ON public.movimentacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo ON public.movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria ON public.movimentacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON public.movimentacoes(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_lote_id ON public.movimentacoes(lote_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_venda_id ON public.movimentacoes(venda_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_movimentacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_movimentacoes_updated_at ON public.movimentacoes;
CREATE TRIGGER trigger_movimentacoes_updated_at
    BEFORE UPDATE ON public.movimentacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_movimentacoes_updated_at();

-- RLS (Row Level Security) - Cada usuário só vê suas próprias movimentações
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias movimentações
DROP POLICY IF EXISTS "Users can view own movimentacoes" ON public.movimentacoes;
CREATE POLICY "Users can view own movimentacoes"
    ON public.movimentacoes
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: Usuários podem inserir suas próprias movimentações
DROP POLICY IF EXISTS "Users can insert own movimentacoes" ON public.movimentacoes;
CREATE POLICY "Users can insert own movimentacoes"
    ON public.movimentacoes
    FOR INSERT
    WITH CHECK (auth.uid() = usuario_id);

-- Política: Usuários podem atualizar suas próprias movimentações
DROP POLICY IF EXISTS "Users can update own movimentacoes" ON public.movimentacoes;
CREATE POLICY "Users can update own movimentacoes"
    ON public.movimentacoes
    FOR UPDATE
    USING (auth.uid() = usuario_id);

-- Política: Usuários podem deletar suas próprias movimentações
DROP POLICY IF EXISTS "Users can delete own movimentacoes" ON public.movimentacoes;
CREATE POLICY "Users can delete own movimentacoes"
    ON public.movimentacoes
    FOR DELETE
    USING (auth.uid() = usuario_id);

-- Comentários na tabela
COMMENT ON TABLE public.movimentacoes IS 'Registro de todas as movimentações financeiras para auditoria';
COMMENT ON COLUMN public.movimentacoes.tipo IS 'Tipo: entrada (dinheiro entrando) ou saida (dinheiro saindo)';
COMMENT ON COLUMN public.movimentacoes.categoria IS 'Categoria da movimentação para classificação';
COMMENT ON COLUMN public.movimentacoes.quantidade_animais IS 'Quantidade de animais envolvidos (para vendas/compras)';
COMMENT ON COLUMN public.movimentacoes.peso_arrobas IS 'Peso em arrobas (para vendas)';
