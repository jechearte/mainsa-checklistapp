import os
from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_KEY

# Crear cliente de Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Función para convertir UUID a string para consultas
def format_uuid(uuid):
    if uuid is None:
        return None
    return str(uuid) 