from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.machines import Machine, MachineCreate, MachineUpdate, MachineWithType
from app.dependencies import get_current_active_user, check_admin
from app.services.machines import (
    get_machines,
    get_machine,
    get_machines_by_type,
    create_machine,
    update_machine,
    delete_machine
)

router = APIRouter(
    prefix="/machines",
    tags=["machines"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[Machine])
async def read_machines(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener todas las máquinas
    """
    return await get_machines(skip=skip, limit=limit)

@router.get("/{machine_id}", response_model=MachineWithType)
async def read_machine(
    machine_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener una máquina por ID
    """
    machine = await get_machine(machine_id)
    if machine is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Machine not found"
        )
    return machine

@router.get("/by-type/{machine_type_id}", response_model=List[Machine])
async def read_machines_by_type(
    machine_type_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener máquinas por tipo
    """
    return await get_machines_by_type(machine_type_id, skip=skip, limit=limit)

@router.post("/", response_model=Machine, status_code=status.HTTP_201_CREATED)
async def create_new_machine(
    machine: MachineCreate,
    current_user = Depends(check_admin)
):
    """
    Crear una nueva máquina (solo administradores)
    """
    return await create_machine(machine)

@router.put("/{machine_id}", response_model=Machine)
async def update_machine_details(
    machine_id: str,
    machine_update: MachineUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar una máquina (solo administradores)
    """
    return await update_machine(machine_id, machine_update)

@router.delete("/{machine_id}")
async def delete_machine_endpoint(
    machine_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar una máquina (solo administradores)
    """
    return await delete_machine(machine_id) 