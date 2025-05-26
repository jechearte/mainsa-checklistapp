from fastapi import HTTPException, status
from typing import List, Optional

from app.models.machines import MachineType, MachineTypeCreate, MachineTypeUpdate
from app.models.machines import Machine, MachineCreate, MachineUpdate, MachineWithType
from app.utils.supabase import supabase, format_uuid

# Servicios para Tipos de Máquinas
async def get_machine_types(skip: int = 0, limit: int = 100) -> List[MachineType]:
    response = supabase.table("tipos_maquinas").select("*").range(skip, skip + limit - 1).execute()
    
    return [MachineType(**item) for item in response.data]

async def get_machine_type(machine_type_id: str) -> Optional[MachineType]:
    response = supabase.table("tipos_maquinas").select("*").eq("id", machine_type_id).execute()
    
    if not response.data:
        return None
    
    return MachineType(**response.data[0])

async def create_machine_type(machine_type: MachineTypeCreate) -> MachineType:
    data = machine_type.dict()
    response = supabase.table("tipos_maquinas").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating machine type"
        )
    
    return MachineType(**response.data[0])

async def update_machine_type(machine_type_id: str, machine_type: MachineTypeUpdate) -> MachineType:
    update_data = machine_type.dict(exclude_unset=True)
    
    response = supabase.table("tipos_maquinas").update(update_data).eq("id", machine_type_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine type with ID {machine_type_id} not found"
        )
    
    return MachineType(**response.data[0])

async def delete_machine_type(machine_type_id: str):
    # Verificar si hay máquinas usando este tipo
    machine_check = supabase.table("maquinas").select("id").eq("tipo_maquina_id", machine_type_id).execute()
    
    if machine_check.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a machine type that's in use by machines"
        )
    
    response = supabase.table("tipos_maquinas").delete().eq("id", machine_type_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine type with ID {machine_type_id} not found"
        )
    
    return {"ok": True}

# Servicios para Máquinas
async def get_machines(skip: int = 0, limit: int = 100) -> List[Machine]:
    response = supabase.table("maquinas").select("*").range(skip, skip + limit - 1).execute()
    
    return [Machine(**item) for item in response.data]

async def get_machine(machine_id: str) -> Optional[MachineWithType]:
    try:
        response = supabase.table("maquinas").select("""
            *,
            tipo_maquina:tipos_maquinas(*)
        """).eq("id", machine_id).execute()
        
        if not response.data:
            return None
        
        machine_data = response.data[0]
        
        # Tratamos de forma segura el acceso a tipo_maquina
        try:
            if "tipo_maquina" in machine_data and machine_data["tipo_maquina"] and len(machine_data["tipo_maquina"]) > 0:
                machine_type_data = machine_data.pop("tipo_maquina")[0]
                return MachineWithType(**machine_data, tipo_maquina=MachineType(**machine_type_data))
            else:
                if "tipo_maquina" in machine_data:
                    machine_data.pop("tipo_maquina")
                return MachineWithType(**machine_data, tipo_maquina=None)
        except (KeyError, IndexError) as e:
            # Si hay cualquier error al acceder a tipo_maquina, simplemente devolvemos la máquina sin tipo
            if "tipo_maquina" in machine_data:
                machine_data.pop("tipo_maquina")
            return MachineWithType(**machine_data, tipo_maquina=None)
    except Exception as e:
        # Loguear el error
        print(f"Error al obtener máquina: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la máquina: {str(e)}"
        )

async def get_machines_by_type(machine_type_id: str, skip: int = 0, limit: int = 100) -> List[Machine]:
    response = supabase.table("maquinas").select("*").eq("tipo_maquina_id", machine_type_id).range(skip, skip + limit - 1).execute()
    
    return [Machine(**item) for item in response.data]

async def create_machine(machine: MachineCreate) -> Machine:
    # Verificar que el tipo de máquina existe
    machine_type = await get_machine_type(format_uuid(machine.tipo_maquina_id))
    if not machine_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine type with ID {machine.tipo_maquina_id} not found"
        )
    
    data = machine.dict()
    response = supabase.table("maquinas").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating machine"
        )
    
    return Machine(**response.data[0])

async def update_machine(machine_id: str, machine: MachineUpdate) -> Machine:
    update_data = machine.dict(exclude_unset=True)
    
    # Si se actualiza el tipo de máquina, verificar que existe
    if "tipo_maquina_id" in update_data:
        machine_type = await get_machine_type(format_uuid(update_data["tipo_maquina_id"]))
        if not machine_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Machine type with ID {update_data['tipo_maquina_id']} not found"
            )
    
    response = supabase.table("maquinas").update(update_data).eq("id", machine_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID {machine_id} not found"
        )
    
    return Machine(**response.data[0])

async def delete_machine(machine_id: str):
    # Verificar si hay informes usando esta máquina
    report_check = supabase.table("informes").select("id").eq("maquina_id", machine_id).execute()
    
    if report_check.data:
        # En vez de eliminar, marcamos como inactiva
        response = supabase.table("maquinas").update({"estado": "inactivo"}).eq("id", machine_id).execute()
    else:
        response = supabase.table("maquinas").delete().eq("id", machine_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID {machine_id} not found"
        )
    
    return {"ok": True} 