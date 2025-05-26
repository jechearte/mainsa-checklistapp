-- Migración para agregar el campo "nombre" a la tabla informes
-- Fecha: $(date)
-- Descripción: Agregar campo nombre para identificar mejor los informes

ALTER TABLE informes 
ADD COLUMN nombre VARCHAR(255);

-- Opcional: Agregar comentario al campo
COMMENT ON COLUMN informes.nombre IS 'Nombre descriptivo del informe para facilitar su identificación';

-- Opcional: Crear un índice para mejorar las búsquedas por nombre
CREATE INDEX idx_informes_nombre ON informes(nombre); 