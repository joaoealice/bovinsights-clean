-- =====================================================
-- MIGRAÇÃO: Perfil de Usuário Completo
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. EXPANDIR TABELA PERFIL_USUARIO
-- =====================================================

-- Dados pessoais
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS nome_completo VARCHAR(255);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Endereço residencial
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS endereco_residencial TEXT;
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS cidade_residencial VARCHAR(100);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS estado_residencial VARCHAR(2);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS cep_residencial VARCHAR(10);

-- Dados da fazenda (expandir os existentes)
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS endereco_fazenda TEXT;
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS municipio_fazenda VARCHAR(100);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS estado_fazenda VARCHAR(2);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS cep_fazenda VARCHAR(10);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS tamanho_hectares DECIMAL(12, 2);

-- Geolocalização da fazenda
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS geojson JSONB;

-- Status do cadastro
ALTER TABLE perfil_usuario ADD COLUMN IF NOT EXISTS cadastro_completo BOOLEAN DEFAULT false;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_perfil_municipio ON perfil_usuario(municipio_fazenda);
CREATE INDEX IF NOT EXISTS idx_perfil_estado ON perfil_usuario(estado_fazenda);

-- Comentários nos campos
COMMENT ON COLUMN perfil_usuario.nome_completo IS 'Nome completo do usuário';
COMMENT ON COLUMN perfil_usuario.cpf IS 'CPF do usuário (opcional, para relatórios de crédito)';
COMMENT ON COLUMN perfil_usuario.rg IS 'RG do usuário (opcional, para relatórios de crédito)';
COMMENT ON COLUMN perfil_usuario.foto_url IS 'URL da foto de perfil no storage';
COMMENT ON COLUMN perfil_usuario.municipio_fazenda IS 'Município da fazenda (para monitoramento climático)';
COMMENT ON COLUMN perfil_usuario.estado_fazenda IS 'UF da fazenda (para monitoramento climático)';
COMMENT ON COLUMN perfil_usuario.tamanho_hectares IS 'Tamanho total da propriedade em hectares';
COMMENT ON COLUMN perfil_usuario.latitude IS 'Latitude da fazenda';
COMMENT ON COLUMN perfil_usuario.longitude IS 'Longitude da fazenda';
COMMENT ON COLUMN perfil_usuario.geojson IS 'GeoJSON com os limites da propriedade';
COMMENT ON COLUMN perfil_usuario.cadastro_completo IS 'Indica se o usuário completou o cadastro';

-- =====================================================
-- 2. CRIAR BUCKET PARA FOTOS DE PERFIL (se não existir)
-- =====================================================
-- Execute no Supabase Dashboard > Storage > Create bucket
-- Nome: avatars
-- Public: true

-- Política de acesso ao storage (executar no SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
SELECT 'Migração de perfil completo executada!' as resultado;
