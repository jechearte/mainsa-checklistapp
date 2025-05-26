-- Migración para mover el campo "aviso_llamada" de la tabla maquinas a la tabla informes
-- Fecha: $(date)
-- Descripción: Mover aviso_llamada de maquinas a informes ya que es un concepto asociado al informe específico

-- Paso 1: Agregar el campo aviso_llamada a la tabla informes
ALTER TABLE informes 
ADD COLUMN aviso_llamada TEXT;

-- Paso 2: Migrar los datos existentes (opcional, si hay datos que migrar)
-- UPDATE informes 
-- SET aviso_llamada = (
--     SELECT m.aviso_llamada 
--     FROM maquinas m 
--     WHERE m.id = informes.maquina_id
-- );

-- Paso 3: Eliminar el campo aviso_llamada de la tabla maquinas
ALTER TABLE maquinas 
DROP COLUMN aviso_llamada;

-- Opcional: Agregar comentario al nuevo campo
COMMENT ON COLUMN informes.aviso_llamada IS 'Aviso o llamada específica asociada a este informe'; 