-- Adicionar coluna praca_preferida na tabela perfil_usuario
ALTER TABLE perfil_usuario
ADD COLUMN praca_preferida VARCHAR(100) DEFAULT NULL;

-- Comentario explicativo
COMMENT ON COLUMN perfil_usuario.praca_preferida IS
'Praca de mercado preferida do usuario para cotacoes e calculos de estoque';
