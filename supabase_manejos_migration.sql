-- =====================================================
-- MIGRACAO: Tabela de Manejos
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Criar tipo ENUM para tipo de manejo
DO $$ BEGIN
  CREATE TYPE tipo_manejo_enum AS ENUM ('vermifugo', 'vacinacao', 'suplementacao', 'marcacao', 'castracao', 'desmama', 'outros');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tipo ENUM para tipo de aplicacao
DO $$ BEGIN
  CREATE TYPE tipo_aplicacao_enum AS ENUM ('lote_inteiro', 'animais_individuais');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de manejos
CREATE TABLE IF NOT EXISTS manejos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lote_id UUID REFERENCES lotes(id) ON DELETE SET NULL,

  -- Tipo de aplicacao
  tipo_aplicacao VARCHAR(50) NOT NULL DEFAULT 'lote_inteiro',
  animais_ids UUID[] DEFAULT NULL,

  -- Dados do manejo
  tipo_manejo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  data_manejo DATE NOT NULL,
  vacinas TEXT[] DEFAULT NULL,
  observacoes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- Constraints
  CONSTRAINT tipo_manejo_valido CHECK (tipo_manejo IN ('vermifugo', 'vacinacao', 'suplementacao', 'marcacao', 'castracao', 'desmama', 'outros')),
  CONSTRAINT tipo_aplicacao_valido CHECK (tipo_aplicacao IN ('lote_inteiro', 'animais_individuais'))
);

-- Indices para otimizacao
CREATE INDEX IF NOT EXISTS idx_manejos_usuario_id ON manejos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_manejos_lote_id ON manejos(lote_id);
CREATE INDEX IF NOT EXISTS idx_manejos_tipo_manejo ON manejos(tipo_manejo);
CREATE INDEX IF NOT EXISTS idx_manejos_data_manejo ON manejos(data_manejo DESC);

-- RLS (Row Level Security)
ALTER TABLE manejos ENABLE ROW LEVEL SECURITY;

-- Politicas de seguranca
CREATE POLICY "Usuarios podem ver seus proprios manejos"
  ON manejos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar seus proprios manejos"
  ON manejos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seus proprios manejos"
  ON manejos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar seus proprios manejos"
  ON manejos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_manejos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_manejos_updated_at ON manejos;
CREATE TRIGGER trigger_manejos_updated_at
  BEFORE UPDATE ON manejos
  FOR EACH ROW
  EXECUTE FUNCTION update_manejos_updated_at();

-- Comentarios na tabela
COMMENT ON TABLE manejos IS 'Registro de manejos sanitarios e operacionais do rebanho';
COMMENT ON COLUMN manejos.tipo_aplicacao IS 'Se o manejo foi aplicado ao lote inteiro ou animais individuais';
COMMENT ON COLUMN manejos.animais_ids IS 'Array de IDs dos animais quando tipo_aplicacao = animais_individuais';
COMMENT ON COLUMN manejos.vacinas IS 'Array de vacinas aplicadas quando tipo_manejo = vacinacao';
