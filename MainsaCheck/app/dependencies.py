from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.users import UserInDB, TokenData
from app.utils.supabase import supabase

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Modelos para autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

# Función para proporcionar la sesión de base de datos
# Como usamos Supabase en lugar de SQLAlchemy, esta función es un placeholder
# que devuelve None. El servicio pdf_generator debe ser actualizado para no requerir
# una sesión de SQLAlchemy.
async def get_db():
    # Este es un placeholder ya que no usamos SQLAlchemy directamente
    # En lugar de eso, usamos el cliente de Supabase
    return None

# Funciones de autenticación
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    # Aquí normalmente buscarías el usuario en la base de datos
    # Esto es solo un placeholder, será implementado con Supabase
    from app.services.users import get_user_by_id
    user = await get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.estado != "activo":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

# Verificadores de roles
def check_admin(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.tipo != "administrativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes"
        )
    return current_user

def check_mechanic(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.tipo != "mecánico":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes"
        )
    return current_user 