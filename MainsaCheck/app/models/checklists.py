from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

# Estado Posible
class PossibleStateBase(BaseModel):
    nombre: str
    tipo_maquina_id: UUID4

class PossibleStateCreate(PossibleStateBase):
    pass

class PossibleStateUpdate(BaseModel):
    nombre: Optional[str] = None

class PossibleState(PossibleStateBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# Checklist
class ChecklistBase(BaseModel):
    nombre: str
    tipo_maquina_id: UUID4
    version: str
    activo: bool = True

class ChecklistCreate(ChecklistBase):
    pass

class ChecklistUpdate(BaseModel):
    nombre: Optional[str] = None
    version: Optional[str] = None
    activo: Optional[bool] = None

class Checklist(ChecklistBase):
    id: UUID4
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

# Grupo
class GroupBase(BaseModel):
    nombre: str
    checklist_id: UUID4
    orden: int

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    nombre: Optional[str] = None
    orden: Optional[int] = None

class Group(GroupBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# Item Checklist
class ChecklistItemBase(BaseModel):
    nombre: str
    grupo_id: UUID4
    orden: int
    obligatorio: bool = True

class ChecklistItemCreate(ChecklistItemBase):
    pass

class ChecklistItemUpdate(BaseModel):
    nombre: Optional[str] = None
    orden: Optional[int] = None
    obligatorio: Optional[bool] = None

class ChecklistItem(ChecklistItemBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# Relaciones entre modelos
class GroupWithItems(Group):
    items: List[ChecklistItem]

class ChecklistWithGroups(Checklist):
    grupos: List[GroupWithItems] 