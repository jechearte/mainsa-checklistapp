from pydantic import BaseModel, UUID4
from typing import Optional, List, Dict
from datetime import datetime

from app.models.users import User
from app.models.machines import Machine as MachineBase
from app.models.checklists import Checklist, ChecklistItem, PossibleState, Group

# Extiendo el modelo Machine para añadir el nombre del tipo de máquina
class Machine(MachineBase):
    tipo_maquina_nombre: Optional[str] = None

# Informe
class ReportBase(BaseModel):
    checklist_id: UUID4
    nombre: Optional[str] = None
    aviso_llamada: Optional[str] = None
    comentarios: Optional[str] = None

class ReportCreate(BaseModel):
    maquina_id: UUID4
    checklist_id: UUID4
    nombre: Optional[str] = None
    aviso_llamada: Optional[str] = None
    comentarios: Optional[str] = None

class ReportUpdate(BaseModel):
    nombre: Optional[str] = None
    aviso_llamada: Optional[str] = None
    comentarios: Optional[str] = None
    fecha_finalizacion: Optional[datetime] = None

class Report(ReportBase):
    id: UUID4
    usuario_id: UUID4
    maquina_id: UUID4
    fecha_creacion: datetime
    fecha_finalizacion: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Modelo para mostrar informes en la tabla
class ReportTable(BaseModel):
    id: UUID4
    fecha_creacion: datetime
    fecha_finalizacion: Optional[datetime] = None
    maquina_id: UUID4
    tipo_maquina: str
    numero_bastidor: Optional[str] = None
    nombre: Optional[str] = None
    aviso_llamada: Optional[str] = None
    
    class Config:
        from_attributes = True

# Detalle de Informe
class ReportDetailBase(BaseModel):
    informe_id: UUID4
    item_checklist_id: UUID4
    estado_id: UUID4
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None

class ReportDetailCreate(ReportDetailBase):
    pass

class ReportDetailUpdate(BaseModel):
    estado_id: Optional[UUID4] = None
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None

class ReportDetail(ReportDetailBase):
    id: UUID4
    
    class Config:
        from_attributes = True

# Relaciones entre modelos
class ReportDetailComplete(ReportDetail):
    item: ChecklistItem
    estado: PossibleState

class ReportComplete(ReportBase):
    id: UUID4
    usuario_id: UUID4
    fecha_creacion: datetime
    fecha_finalizacion: Optional[datetime] = None
    maquina: Machine
    usuario: User
    checklist: Checklist
    detalles: List[ReportDetailComplete]

# Nuevos modelos para detalles agrupados
class ReportDetailWithNames(BaseModel):
    id: UUID4
    informe_id: UUID4
    item_id: UUID4
    item_nombre: str
    estado_id: UUID4
    estado_nombre: str
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None

class GroupedReportDetails(BaseModel):
    grupo_nombre: str
    items: List[ReportDetailWithNames]

class ReportDetailsGrouped(BaseModel):
    informe_id: UUID4
    grupos: List[GroupedReportDetails] 

# Modelo para crear múltiples detalles en una sola petición
class ReportDetailItem(BaseModel):
    item_checklist_id: UUID4
    estado_id: UUID4
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None

class BatchReportDetailCreate(BaseModel):
    informe_id: UUID4
    detalles: List[ReportDetailItem]