import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar variables de entorno desde archivo .env
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Configuración de la aplicación
API_PREFIX = "/api"
APP_NAME = "MainsaCheck API"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración de Database
DATABASE_URL = os.getenv("DATABASE_URL") 