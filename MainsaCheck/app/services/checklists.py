from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.models.checklists import (
    Checklist, ChecklistCreate, ChecklistUpdate, ChecklistWithGroups,
    Group, GroupCreate, GroupUpdate, GroupWithItems,
    ChecklistItem, ChecklistItemCreate, ChecklistItemUpdate,
    PossibleState, PossibleStateCreate, PossibleStateUpdate
)
from app.utils.supabase import supabase, format_uuid
from app.services.machines import get_machine_type

# Servicios para Checklists
async def get_checklists(skip: int = 0, limit: int = 100) -> List[Checklist]:
    response = supabase.table("checklists").select("*").range(skip, skip + limit - 1).execute()
    
    return [Checklist(**item) for item in response.data]

async def get_checklist(checklist_id: str) -> Optional[Checklist]:
    response = supabase.table("checklists").select("*").eq("id", checklist_id).execute()
    
    if not response.data:
        return None
    
    return Checklist(**response.data[0])

async def get_checklist_with_groups(checklist_id: str) -> Optional[ChecklistWithGroups]:
    # Obtener el checklist
    checklist_response = supabase.table("checklists").select("*").eq("id", checklist_id).execute()
    
    if not checklist_response.data:
        return None
    
    checklist_data = checklist_response.data[0]
    
    # Obtener los grupos del checklist
    groups_response = supabase.table("grupos").select("*").eq("checklist_id", checklist_id).order("orden").execute()
    
    groups_with_items = []
    
    for group_data in groups_response.data:
        # Obtener los items de cada grupo
        items_response = supabase.table("items_checklist").select("*").eq("grupo_id", group_data["id"]).order("orden").execute()
        items = [ChecklistItem(**item) for item in items_response.data]
        
        # Crear el grupo con sus items
        group_with_items = GroupWithItems(**group_data, items=items)
        groups_with_items.append(group_with_items)
    
    # Crear el checklist completo con grupos e items
    return ChecklistWithGroups(**checklist_data, grupos=groups_with_items)

async def get_checklists_by_machine_type(machine_type_id: str, skip: int = 0, limit: int = 100) -> List[Checklist]:
    response = supabase.table("checklists").select("*").eq("tipo_maquina_id", machine_type_id).eq("activo", True).range(skip, skip + limit - 1).execute()
    
    return [Checklist(**item) for item in response.data]

async def create_checklist(checklist: ChecklistCreate) -> Checklist:
    # Verificar que el tipo de máquina existe
    machine_type = await get_machine_type(format_uuid(checklist.tipo_maquina_id))
    if not machine_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine type with ID {checklist.tipo_maquina_id} not found"
        )
    
    data = checklist.dict()
    data["fecha_creacion"] = datetime.now().isoformat()
    data["fecha_actualizacion"] = datetime.now().isoformat()
    
    response = supabase.table("checklists").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating checklist"
        )
    
    return Checklist(**response.data[0])

async def update_checklist(checklist_id: str, checklist: ChecklistUpdate) -> Checklist:
    update_data = checklist.dict(exclude_unset=True)
    update_data["fecha_actualizacion"] = datetime.now().isoformat()
    
    response = supabase.table("checklists").update(update_data).eq("id", checklist_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {checklist_id} not found"
        )
    
    return Checklist(**response.data[0])

async def delete_checklist(checklist_id: str):
    # Verificar si hay informes usando este checklist
    report_check = supabase.table("informes").select("id").eq("checklist_id", checklist_id).execute()
    
    if report_check.data:
        # En vez de eliminar, marcamos como inactivo
        response = supabase.table("checklists").update({"activo": False}).eq("id", checklist_id).execute()
    else:
        # Eliminar los items y grupos asociados al checklist
        groups_response = supabase.table("grupos").select("id").eq("checklist_id", checklist_id).execute()
        
        for group in groups_response.data:
            await delete_group(group["id"])
        
        response = supabase.table("checklists").delete().eq("id", checklist_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {checklist_id} not found"
        )
    
    return {"ok": True}

# Servicios para Grupos
async def get_groups_by_checklist(checklist_id: str) -> List[Group]:
    response = supabase.table("grupos").select("*").eq("checklist_id", checklist_id).order("orden").execute()
    
    return [Group(**item) for item in response.data]

async def get_group(group_id: str) -> Optional[Group]:
    response = supabase.table("grupos").select("*").eq("id", group_id).execute()
    
    if not response.data:
        return None
    
    return Group(**response.data[0])

async def create_group(group: GroupCreate) -> Group:
    # Verificar que el checklist existe
    checklist = await get_checklist(format_uuid(group.checklist_id))
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {group.checklist_id} not found"
        )
    
    data = group.dict()
    response = supabase.table("grupos").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating group"
        )
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(group.checklist_id), ChecklistUpdate())
    
    return Group(**response.data[0])

async def update_group(group_id: str, group: GroupUpdate) -> Group:
    update_data = group.dict(exclude_unset=True)
    
    response = supabase.table("grupos").update(update_data).eq("id", group_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )
    
    # Obtener el grupo actualizado para saber a qué checklist pertenece
    updated_group = await get_group(group_id)
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(updated_group.checklist_id), ChecklistUpdate())
    
    return updated_group

async def delete_group(group_id: str):
    # Verificar si hay items usando este grupo
    group = await get_group(group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )
    
    # Eliminar los items del grupo
    items_response = supabase.table("items_checklist").select("id").eq("grupo_id", group_id).execute()
    
    for item in items_response.data:
        await delete_item(item["id"])
    
    response = supabase.table("grupos").delete().eq("id", group_id).execute()
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(group.checklist_id), ChecklistUpdate())
    
    return {"ok": True}

# Servicios para Items de Checklist
async def get_items_by_group(group_id: str) -> List[ChecklistItem]:
    response = supabase.table("items_checklist").select("*").eq("grupo_id", group_id).order("orden").execute()
    
    return [ChecklistItem(**item) for item in response.data]

async def get_item(item_id: str) -> Optional[ChecklistItem]:
    response = supabase.table("items_checklist").select("*").eq("id", item_id).execute()
    
    if not response.data:
        return None
    
    return ChecklistItem(**response.data[0])

async def create_item(item: ChecklistItemCreate) -> ChecklistItem:
    # Verificar que el grupo existe
    group = await get_group(format_uuid(item.grupo_id))
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {item.grupo_id} not found"
        )
    
    data = item.dict()
    response = supabase.table("items_checklist").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating checklist item"
        )
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(group.checklist_id), ChecklistUpdate())
    
    return ChecklistItem(**response.data[0])

async def update_item(item_id: str, item: ChecklistItemUpdate) -> ChecklistItem:
    update_data = item.dict(exclude_unset=True)
    
    response = supabase.table("items_checklist").update(update_data).eq("id", item_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item with ID {item_id} not found"
        )
    
    # Obtener el item actualizado para saber a qué grupo pertenece
    updated_item = await get_item(item_id)
    
    # Obtener el grupo para saber a qué checklist pertenece
    group = await get_group(format_uuid(updated_item.grupo_id))
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(group.checklist_id), ChecklistUpdate())
    
    return updated_item

async def delete_item(item_id: str):
    # Verificar si hay detalles de informes usando este item
    item = await get_item(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item with ID {item_id} not found"
        )
    
    # Obtener el grupo para saber a qué checklist pertenece
    group = await get_group(format_uuid(item.grupo_id))
    
    detail_check = supabase.table("detalles_informe").select("id").eq("item_checklist_id", item_id).execute()
    
    if detail_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a checklist item that's in use by report details"
        )
    
    response = supabase.table("items_checklist").delete().eq("id", item_id).execute()
    
    # Actualizar la fecha de actualización del checklist
    await update_checklist(format_uuid(group.checklist_id), ChecklistUpdate())
    
    return {"ok": True}

# Servicios para Estados Posibles
async def get_possible_states_by_machine_type(machine_type_id: str) -> List[PossibleState]:
    response = supabase.table("estados_posibles").select("*").eq("tipo_maquina_id", machine_type_id).execute()
    
    return [PossibleState(**item) for item in response.data]

async def get_possible_state(state_id: str) -> Optional[PossibleState]:
    response = supabase.table("estados_posibles").select("*").eq("id", state_id).execute()
    
    if not response.data:
        return None
    
    return PossibleState(**response.data[0])

async def create_possible_state(state: PossibleStateCreate) -> PossibleState:
    # Verificar que el tipo de máquina existe
    machine_type = await get_machine_type(format_uuid(state.tipo_maquina_id))
    if not machine_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine type with ID {state.tipo_maquina_id} not found"
        )
    
    data = state.dict()
    response = supabase.table("estados_posibles").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating possible state"
        )
    
    return PossibleState(**response.data[0])

async def update_possible_state(state_id: str, state: PossibleStateUpdate) -> PossibleState:
    update_data = state.dict(exclude_unset=True)
    
    response = supabase.table("estados_posibles").update(update_data).eq("id", state_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Possible state with ID {state_id} not found"
        )
    
    return PossibleState(**response.data[0])

async def delete_possible_state(state_id: str):
    # Verificar si hay detalles de informes usando este estado
    detail_check = supabase.table("detalles_informe").select("id").eq("estado_id", state_id).execute()
    
    if detail_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a possible state that's in use by report details"
        )
    
    response = supabase.table("estados_posibles").delete().eq("id", state_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Possible state with ID {state_id} not found"
        )
    
    return {"ok": True} 