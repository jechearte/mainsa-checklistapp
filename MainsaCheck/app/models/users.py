from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional
from datetime import datetime

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    nombre: str
    apellidos: str
    tipo: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    estado: Optional[str] = None

class User(UserBase):
    id: UUID4
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class UserInDB(User):
    password: str 