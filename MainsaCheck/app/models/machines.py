from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import date

# Tipo de máquina
class MachineTypeBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class MachineTypeCreate(MachineTypeBase):
    pass

class MachineTypeUpdate(MachineTypeBase):
    nombre: Optional[str] = None
    
class MachineType(MachineTypeBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# Máquina
class MachineBase(BaseModel):
    tipo_maquina_id: UUID4
    cliente: str
    numero_bastidor: Optional[str] = None
    numero_flota: Optional[str] = None
    numero_horas: Optional[float] = None
    numero_matricula: Optional[str] = None
    numero_kilometros: Optional[float] = None
    zona: Optional[str] = None
    capacidad: Optional[str] = None
    numero_fabricacion: Optional[str] = None

class MachineCreate(MachineBase):
    pass

class MachineUpdate(BaseModel):
    tipo_maquina_id: Optional[UUID4] = None
    cliente: Optional[str] = None
    numero_bastidor: Optional[str] = None
    numero_flota: Optional[str] = None
    numero_horas: Optional[float] = None
    numero_matricula: Optional[str] = None
    numero_kilometros: Optional[float] = None
    zona: Optional[str] = None
    capacidad: Optional[str] = None
    numero_fabricacion: Optional[str] = None

class Machine(MachineBase):
    id: UUID4
    
    class Config:
        from_attributes = True

class MachineWithType(Machine):
    tipo_maquina: Optional[MachineType] = None 