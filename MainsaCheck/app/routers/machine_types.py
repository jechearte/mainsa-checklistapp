from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.machines import MachineType, MachineTypeCreate, MachineTypeUpdate
from app.dependencies import get_current_active_user, check_admin
from app.services.machines import (
    get_machine_types, 
    get_machine_type, 
    create_machine_type, 
    update_machine_type, 
    delete_machine_type
)

router = APIRouter(
    prefix="/machine-types",
    tags=["machine types"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[MachineType])
async def read_machine_types(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener todos los tipos de máquinas
    """
    return await get_machine_types(skip=skip, limit=limit)

@router.get("/{machine_type_id}", response_model=MachineType)
async def read_machine_type(
    machine_type_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener un tipo de máquina por ID
    """
    machine_type = await get_machine_type(machine_type_id)
    if machine_type is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine type not found"
        )
    return machine_type

@router.post("/", response_model=MachineType, status_code=status.HTTP_201_CREATED)
async def create_new_machine_type(
    machine_type: MachineTypeCreate,
    current_user = Depends(check_admin)
):
    """
    Crear un nuevo tipo de máquina (solo administradores)
    """
    return await create_machine_type(machine_type)

@router.put("/{machine_type_id}", response_model=MachineType)
async def update_machine_type_details(
    machine_type_id: str,
    machine_type_update: MachineTypeUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar un tipo de máquina (solo administradores)
    """
    return await update_machine_type(machine_type_id, machine_type_update)

@router.delete("/{machine_type_id}")
async def delete_machine_type_endpoint(
    machine_type_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar un tipo de máquina (solo administradores)
    """
    return await delete_machine_type(machine_type_id) 