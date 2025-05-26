from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.models.users import User, UserCreate
from app.dependencies import Token, get_current_active_user
from app.services.auth import authenticate_user, create_user, generate_token

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return generate_token(str(user.id))

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    # Este endpoint puede ser usado solo para registrar mecánicos
    # Para administrativos, debería haber un proceso diferente
    if user.tipo != "mecánico":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mechanics can register through this endpoint"
        )
    return await create_user(user)

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user 