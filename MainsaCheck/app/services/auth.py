from typing import Optional
from fastapi import HTTPException, status
from passlib.context import CryptContext
from datetime import datetime, timedelta

from app.models.users import UserInDB, UserCreate
from app.utils.supabase import supabase
from app.dependencies import create_access_token
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def authenticate_user(email: str, password: str):
    user_response = supabase.table("usuarios").select("*").eq("email", email).execute()
    
    if not user_response.data:
        return False
    
    user_data = user_response.data[0]
    user = UserInDB(**user_data)
    
    if not verify_password(password, user.password):
        return False
    
    return user

async def create_user(user: UserCreate):
    # Verificar si ya existe un usuario con ese email
    existing_user = supabase.table("usuarios").select("email").eq("email", user.email).execute()
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Crear usuario con contraseña hasheada
    hashed_password = get_password_hash(user.password)
    user_data = user.dict()
    user_data["password"] = hashed_password
    user_data["fecha_creacion"] = datetime.now().isoformat()
    user_data["estado"] = "activo"
    
    response = supabase.table("usuarios").insert(user_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )
        
    return response.data[0]

def generate_token(user_id: str):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 