from fastapi import HTTPException, status
from typing import List, Optional

from app.models.users import User, UserCreate, UserUpdate, UserInDB
from app.utils.supabase import supabase, format_uuid
from app.services.auth import get_password_hash

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    response = supabase.table("usuarios").select("*").eq("id", user_id).execute()
    
    if not response.data:
        return None
    
    return UserInDB(**response.data[0])

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    response = supabase.table("usuarios").select("*").eq("email", email).execute()
    
    if not response.data:
        return None
    
    return UserInDB(**response.data[0])

async def get_users(skip: int = 0, limit: int = 100) -> List[User]:
    response = supabase.table("usuarios").select("*").range(skip, skip + limit - 1).execute()
    
    return [User(**user) for user in response.data]

async def update_user(user_id: str, user_update: UserUpdate):
    # Preparar datos para actualizar
    update_data = user_update.dict(exclude_unset=True)
    
    # Si se actualiza la contraseña, hashearla
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    
    response = supabase.table("usuarios").update(update_data).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    return User(**response.data[0])

async def delete_user(user_id: str):
    # En vez de eliminar, marcamos como inactivo
    response = supabase.table("usuarios").update({"estado": "inactivo"}).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    return {"ok": True} 