-- Script SQL para actualizar el campo 'nombre' de todos los informes existentes
-- que tengan este campo vacío o nulo.
-- 
-- El nombre se genera con el formato: {aviso_llamada}_{numero_bastidor}_{fecha_YYMMDD}

-- Función auxiliar para limpiar caracteres especiales (PostgreSQL)
CREATE OR REPLACE FUNCTION limpiar_texto(texto TEXT)
RETURNS TEXT AS $$
BEGIN
    IF texto IS NULL OR texto = '' THEN
        RETURN '';
    END IF;
    
    -- Reemplazar caracteres especiales y espacios, mantener solo alfanuméricos, guiones y guiones bajos
    RETURN TRIM(REGEXP_REPLACE(texto, '[^a-zA-Z0-9\-_]', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Actualizar nombres de informes
UPDATE informes 
SET nombre = CONCAT(
    COALESCE(limpiar_texto(informes.aviso_llamada), 'SinAviso'),
    '_',
    COALESCE(limpiar_texto(maquinas.numero_bastidor), 'SinBastidor'),
    '_',
    TO_CHAR(informes.fecha_creacion, 'YYMMDD')
)
FROM maquinas
WHERE informes.maquina_id = maquinas.id
  AND (informes.nombre IS NULL OR informes.nombre = '');

-- Verificar resultados
SELECT 
    COUNT(*) as total_informes,
    COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as con_nombre,
    COUNT(CASE WHEN nombre IS NULL OR nombre = '' THEN 1 END) as sin_nombre
FROM informes;

-- Mostrar algunos ejemplos de nombres generados
SELECT 
    id,
    nombre,
    aviso_llamada,
    fecha_creacion
FROM informes 
WHERE nombre IS NOT NULL AND nombre != ''
LIMIT 10;

-- Limpiar función auxiliar (opcional)
-- DROP FUNCTION IF EXISTS limpiar_texto(TEXT); 