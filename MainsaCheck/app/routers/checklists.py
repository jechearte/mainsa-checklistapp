from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.models.checklists import (
    Checklist, ChecklistCreate, ChecklistUpdate, ChecklistWithGroups,
    Group, GroupCreate, GroupUpdate, GroupWithItems,
    ChecklistItem, ChecklistItemCreate, ChecklistItemUpdate,
    PossibleState, PossibleStateCreate, PossibleStateUpdate
)
from app.dependencies import get_current_active_user, check_admin
from app.services.checklists import (
    get_checklists, get_checklist, get_checklist_with_groups, get_checklists_by_machine_type,
    create_checklist, update_checklist, delete_checklist,
    get_groups_by_checklist, get_group, create_group, update_group, delete_group,
    get_items_by_group, get_item, create_item, update_item, delete_item,
    get_possible_states_by_machine_type, get_possible_state, create_possible_state,
    update_possible_state, delete_possible_state
)

router = APIRouter(
    prefix="/checklists",
    tags=["checklists"],
    responses={404: {"description": "Not found"}},
)

# Endpoints para Checklists
@router.get("/", response_model=List[Checklist])
async def read_checklists(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener todos los checklists
    """
    return await get_checklists(skip=skip, limit=limit)

@router.get("/{checklist_id}", response_model=ChecklistWithGroups)
async def read_checklist(
    checklist_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener un checklist completo con grupos e items
    """
    checklist = await get_checklist_with_groups(checklist_id)
    if checklist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found"
        )
    return checklist

@router.post("/", response_model=Checklist, status_code=status.HTTP_201_CREATED)
async def create_new_checklist(
    checklist: ChecklistCreate,
    current_user = Depends(check_admin)
):
    """
    Crear un nuevo checklist (solo administradores)
    """
    return await create_checklist(checklist)

@router.put("/{checklist_id}", response_model=Checklist)
async def update_checklist_details(
    checklist_id: str,
    checklist_update: ChecklistUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar un checklist (solo administradores)
    """
    return await update_checklist(checklist_id, checklist_update)

@router.delete("/{checklist_id}")
async def delete_checklist_endpoint(
    checklist_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar un checklist (solo administradores)
    """
    return await delete_checklist(checklist_id)

@router.get("/by-machine-type/{machine_type_id}", response_model=List[Checklist])
async def read_checklists_by_machine_type(
    machine_type_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener checklists por tipo de máquina
    """
    return await get_checklists_by_machine_type(machine_type_id, skip=skip, limit=limit)

# Endpoints para Grupos
@router.get("/{checklist_id}/groups", response_model=List[Group])
async def read_groups_by_checklist(
    checklist_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener grupos de un checklist
    """
    return await get_groups_by_checklist(checklist_id)

@router.post("/groups", response_model=Group, status_code=status.HTTP_201_CREATED)
async def create_new_group(
    group: GroupCreate,
    current_user = Depends(check_admin)
):
    """
    Crear un nuevo grupo (solo administradores)
    """
    return await create_group(group)

@router.put("/groups/{group_id}", response_model=Group)
async def update_group_details(
    group_id: str,
    group_update: GroupUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar un grupo (solo administradores)
    """
    return await update_group(group_id, group_update)

@router.delete("/groups/{group_id}")
async def delete_group_endpoint(
    group_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar un grupo (solo administradores)
    """
    return await delete_group(group_id)

# Endpoints para Items
@router.get("/groups/{group_id}/items", response_model=List[ChecklistItem])
async def read_items_by_group(
    group_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Obtener items de un grupo
    """
    return await get_items_by_group(group_id)

@router.post("/items", response_model=ChecklistItem, status_code=status.HTTP_201_CREATED)
async def create_new_item(
    item: ChecklistItemCreate,
    current_user = Depends(check_admin)
):
    """
    Crear un nuevo item (solo administradores)
    """
    return await create_item(item)

@router.put("/items/{item_id}", response_model=ChecklistItem)
async def update_item_details(
    item_id: str,
    item_update: ChecklistItemUpdate,
    current_user = Depends(check_admin)
):
    """
    Actualizar un item (solo administradores)
    """
    return await update_item(item_id, item_update)

@router.delete("/items/{item_id}")
async def delete_item_endpoint(
    item_id: str,
    current_user = Depends(check_admin)
):
    """
    Eliminar un item (solo administradores)
    """
    return await delete_item(item_id) 