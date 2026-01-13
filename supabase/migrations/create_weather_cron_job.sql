-- =====================================================
-- CRON JOB: Atualização Diária de Dados Climáticos
-- Descrição: Agenda a execução da Edge Function atualizar-clima
-- para rodar diariamente às 06:00 (horário de Brasília)
-- =====================================================

-- Nota: Este SQL deve ser executado após o deploy da Edge Function
-- e requer a extensão pg_cron habilitada no Supabase

-- Habilitar extensão pg_cron (se não estiver habilitada)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job existente se houver
-- SELECT cron.unschedule('atualizar-clima-diario');

-- Criar o job para executar às 06:00 (09:00 UTC para America/Sao_Paulo)
-- SELECT cron.schedule(
--   'atualizar-clima-diario',        -- nome do job
--   '0 9 * * *',                      -- cron expression: 09:00 UTC = 06:00 BRT
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://vwlawfsvfnibduovqtjh.supabase.co/functions/v1/atualizar-clima',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--       ),
--       body := '{}'::jsonb
--     ) AS request_id;
--   $$
-- );

-- =====================================================
-- ALTERNATIVA: Usar Supabase Database Webhooks
-- =====================================================

-- Se pg_cron não estiver disponível, você pode usar:
-- 1. Supabase Database Webhooks (Dashboard > Database > Webhooks)
-- 2. Serviço externo como Vercel Cron, Railway, ou Render
-- 3. GitHub Actions com schedule

-- Exemplo de configuração via Supabase CLI:
-- supabase functions deploy atualizar-clima
--
-- E então configurar via Dashboard:
-- 1. Ir em Edge Functions
-- 2. Selecionar atualizar-clima
-- 3. Configurar Schedule: 0 9 * * * (06:00 BRT)

-- =====================================================
-- MANUAL: Testando a função manualmente
-- =====================================================

-- Para testar a Edge Function manualmente via SQL:
-- SELECT
--   net.http_post(
--     url := 'https://vwlawfsvfnibduovqtjh.supabase.co/functions/v1/atualizar-clima',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   );

-- Ou via curl:
-- curl -X POST \
--   https://vwlawfsvfnibduovqtjh.supabase.co/functions/v1/atualizar-clima \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json"
