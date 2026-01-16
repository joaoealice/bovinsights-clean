ALTER TABLE perfil_usuario
ADD COLUMN quick_tour_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN quick_tour_skipped BOOLEAN DEFAULT FALSE;
