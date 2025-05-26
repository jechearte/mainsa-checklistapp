from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.checklists import PossibleState, PossibleStateCreate, PossibleStateUpdate
from app.dependencies import get_current_active_user, check_admin
from app.services.checklists import (
    get_possible_states_by_machine_type, get_possible_state, 
    create_possible_state, update_possible_state, delete_possible_state
)

router = APIRouter(
    prefix="/states",
    tags=["states"],
    responses={404: {"description": "Not found"}},
)

@router.get("/by-machine-type/{machine_type_id}", response_model=List[PossibleState])
async def read_states_by_machine_type(
    machine_type_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener estados posibles por tipo de máquina
    """
    return await get_possible_states_by_machine_type(machine_type_id)

@router.get("/{state_id}", response_model=PossibleState)
async def read_state(
    state_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener un estado posible por ID
    """
    state = await get_possible_state(state_id)
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Possible state not found"
        )
    return state

@router.post("/", response_model=PossibleState, status_code=status.HTTP_201_CREATED)
async def create_new_state(
    state: PossibleStateCreate,
    current_user = Depends(check_admin)
):
    """
    Crear un nuevo estado posible (solo administradores)
    """
    return await create_possible_state(state)

@router.put("/{state_id}", response_model=PossibleState)
async def update_state_details(
    state_id: str,
    state_update: PossibleStateUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar un estado posible (solo administradores)
    """
    return await update_possible_state(state_id, state_update)

@router.delete("/{state_id}")
async def delete_state_endpoint(
    state_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar un estado posible (solo administradores)
    """
    return await delete_possible_state(state_id) 