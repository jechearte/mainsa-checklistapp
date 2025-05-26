-- Eliminamos primero las restricciones de clave foránea
ALTER TABLE informes
DROP CONSTRAINT informes_maquina_id_fkey;

-- Eliminamos la tabla existente ya que está vacía
DROP TABLE maquinas;

-- Creamos la tabla con la nueva estructura
CREATE TABLE maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_maquina_id UUID NOT NULL REFERENCES tipos_maquinas(id),
    cliente TEXT NOT NULL,
    numero_bastidor TEXT,
    aviso_llamada TEXT,
    numero_flota TEXT,
    numero_horas FLOAT,
    numero_matricula TEXT,
    numero_kilometros FLOAT,
    zona TEXT,
    capacidad TEXT,
    numero_fabricacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreamos la restricción de clave foránea en la tabla informes
ALTER TABLE informes
ADD CONSTRAINT informes_maquina_id_fkey 
FOREIGN KEY (maquina_id) 
REFERENCES maquinas(id);

-- Nota: Después de ejecutar esta migración, necesitarás actualizar los datos existentes
-- con la información correcta para el campo 'cliente' que es NOT NULL 