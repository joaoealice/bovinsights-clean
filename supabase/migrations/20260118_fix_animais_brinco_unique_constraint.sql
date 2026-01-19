-- Migration para corrigir a constraint de unicidade do brinco
-- Problema: A constraint animais_brinco_key é global, impedindo que diferentes usuários
-- usem o mesmo número de brinco. Deve ser única apenas por usuário (usuario_id + brinco).

-- 1. Remove a constraint global existente
ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_brinco_key;

-- 2. Remove índice único global se existir
DROP INDEX IF EXISTS animais_brinco_key;

-- 3. Cria nova constraint de unicidade composta (brinco único por usuário)
ALTER TABLE animais ADD CONSTRAINT animais_usuario_brinco_unique UNIQUE (usuario_id, brinco);

-- Comentário: Agora cada usuário pode ter seus próprios brincos independentes
-- Ex: Usuário A pode ter brinco "001" e Usuário B também pode ter brinco "001"
