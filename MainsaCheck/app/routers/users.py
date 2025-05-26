from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.users import User, UserCreate, UserUpdate
from app.dependencies import get_current_active_user, check_admin
from app.services.users import get_users, get_user_by_id, update_user, delete_user
from app.services.auth import create_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0, 
    limit: int = 100,
    current_user: User = Depends(check_admin)
):
    """
    Obtener lista de usuarios (solo administradores)
    """
    return await get_users(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener detalles de un usuario
    """
    # Solo el propio usuario o un administrador puede ver los detalles
    if str(current_user.id) != user_id and current_user.tipo != "administrativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user: UserCreate,
    current_user: User = Depends(check_admin)
):
    """
    Crear un nuevo usuario (solo administradores)
    """
    return await create_user(user)

@router.put("/{user_id}", response_model=User)
async def update_user_details(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """
    Actualizar datos de usuario
    """
    # Solo el propio usuario o un administrador puede actualizar
    if str(current_user.id) != user_id and current_user.tipo != "administrativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Un mecánico no puede cambiar su tipo
    if current_user.tipo != "administrativo" and "tipo" in user_update.dict(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to change user type"
        )
        
    return await update_user(user_id, user_update)

@router.delete("/{user_id}")
async def delete_user_endpoint(
    user_id: str,
    current_user: User = Depends(check_admin)
):
    """
    Eliminar un usuario (solo administradores)
    """
    return await delete_user(user_id) 