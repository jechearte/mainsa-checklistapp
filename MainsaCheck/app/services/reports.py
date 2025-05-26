from fastapi import HTTPException, status
from typing import List, Optional, Dict
from datetime import datetime

from app.models.reports import (
    Report, ReportCreate, ReportUpdate, ReportComplete,
    ReportDetail, ReportDetailCreate, ReportDetailUpdate, ReportDetailComplete,
    ReportDetailWithNames, GroupedReportDetails, ReportDetailsGrouped,
    BatchReportDetailCreate, ReportDetailItem
)
from app.utils.supabase import supabase, format_uuid
from app.services.machines import get_machine
from app.services.checklists import get_checklist, get_checklist_with_groups, get_item, get_possible_state, get_group

# Servicios para Informes
async def get_reports(
    skip: int = 0, 
    limit: int = 100, 
    user_email: Optional[str] = None,
    machine_id: Optional[str] = None,
    machine_type_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    status: Optional[str] = None
) -> List[dict]:
    # Consulta básica para obtener informes
    query = supabase.table("informes").select("*")
    
    if user_email:
        # Primero obtenemos el ID del usuario por su email
        user_response = supabase.table("usuarios").select("id").eq("email", user_email).execute()
        if user_response.data:
            user_id = user_response.data[0]["id"]
            query = query.eq("usuario_id", user_id)
        else:
            # Si no encontramos el usuario, retornamos lista vacía
            return []
    
    if machine_id:
        query = query.eq("maquina_id", machine_id)
    
    if from_date:
        query = query.gte("fecha_creacion", from_date)
    
    if to_date:
        query = query.lte("fecha_creacion", to_date)
    
    # Comprobar el estado usando fecha_finalizacion en lugar del campo estado
    if status:
        if status == "finalizado":
            query = query.not_.is_("fecha_finalizacion", "null")
        elif status == "en_proceso":
            query = query.is_("fecha_finalizacion", "null")
    
    # Usamos el parámetro desc=True para ordenar descendente
    query = query.order("fecha_creacion", desc=True)
    response = query.range(skip, skip + limit - 1).execute()
    
    if not response.data:
        return []
    
    # Procesar los informes y obtener datos adicionales
    reports = []
    for informe in response.data:
        # Consultar información de la máquina
        machine_response = supabase.table("maquinas").select("*").eq("id", informe["maquina_id"]).execute()
        if not machine_response.data:
            continue
            
        machine_data = machine_response.data[0]
        
        # Filtrar por tipo de máquina si se especifica
        if machine_type_id and machine_data["tipo_maquina_id"] != machine_type_id:
            continue
            
        # Consultar información del tipo de máquina
        type_response = supabase.table("tipos_maquinas").select("*").eq("id", machine_data["tipo_maquina_id"]).execute()
        if not type_response.data:
            continue
            
        machine_type_data = type_response.data[0]
        
        # Construir el objeto de informe con los datos adicionales
        report = {
            "id": informe["id"],
            "fecha_creacion": informe["fecha_creacion"],
            "fecha_finalizacion": informe["fecha_finalizacion"],
            "maquina_id": informe["maquina_id"],
            "tipo_maquina": machine_type_data["nombre"],
            "numero_bastidor": machine_data["numero_bastidor"],
            "nombre": informe.get("nombre"),
            "aviso_llamada": informe.get("aviso_llamada")
        }
        reports.append(report)
    
    return reports

async def count_reports(
    user_email: Optional[str] = None,
    machine_id: Optional[str] = None,
    machine_type_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    status: Optional[str] = None
) -> int:
    # Para contar informes con filtro por tipo de máquina debemos hacerlo de forma similar a get_reports
    # ya que el filtro por tipo de máquina se aplica después de obtener los datos
    if machine_type_id:
        # Obtenemos todos los informes que cumplen con los demás filtros
        informes = await get_reports(
            skip=0,
            limit=1000,  # Un límite alto para obtener la mayoría de los informes
            user_email=user_email,
            machine_id=machine_id,
            machine_type_id=machine_type_id,
            from_date=from_date,
            to_date=to_date,
            status=status
        )
        return len(informes)
    else:
        # Si no hay filtro por tipo de máquina, usamos el conteo directo de Supabase
        query = supabase.table("informes").select("*", count="exact")
        
        if user_email:
            # Primero obtenemos el ID del usuario por su email
            user_response = supabase.table("usuarios").select("id").eq("email", user_email).execute()
            if user_response.data:
                user_id = user_response.data[0]["id"]
                query = query.eq("usuario_id", user_id)
            else:
                # Si no encontramos el usuario, retornamos 0
                return 0
        
        if machine_id:
            query = query.eq("maquina_id", machine_id)
        
        if from_date:
            query = query.gte("fecha_creacion", from_date)
        
        if to_date:
            query = query.lte("fecha_creacion", to_date)
        
        # Comprobar el estado usando fecha_finalizacion en lugar del campo estado
        if status:
            if status == "finalizado":
                query = query.not_.is_("fecha_finalizacion", "null")
            elif status == "en_proceso":
                query = query.is_("fecha_finalizacion", "null")
        
        response = query.execute()
        
        # Supabase devuelve el conteo en el campo "count" de la respuesta
        return response.count

async def get_report(report_id: str) -> Optional[Report]:
    response = supabase.table("informes").select("*").eq("id", report_id).execute()
    
    if not response.data:
        return None
    
    return Report(**response.data[0])

async def get_report_complete(report_id: str) -> Optional[ReportComplete]:
    # Obtener el informe básico primero
    report_response = supabase.table("informes").select("*").eq("id", report_id).execute()
    
    if not report_response.data:
        return None
    
    report_data = dict(report_response.data[0])
    
    # Obtener la máquina asociada en una consulta separada
    machine_id = report_data.get("maquina_id")
    if not machine_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine ID not found in report with ID {report_id}"
        )
    
    machine_response = supabase.table("maquinas").select("*").eq("id", machine_id).execute()
    if not machine_response.data or len(machine_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID {machine_id} not found in database"
        )
    machine_data = dict(machine_response.data[0])
    
    # Obtener el tipo de máquina para obtener su nombre
    machine_type_id = machine_data.get("tipo_maquina_id")
    if machine_type_id:
        machine_type_response = supabase.table("tipos_maquinas").select("nombre").eq("id", machine_type_id).execute()
        if machine_type_response.data and len(machine_type_response.data) > 0:
            machine_data["tipo_maquina_nombre"] = machine_type_response.data[0]["nombre"]
    
    # Obtener el usuario asociado en una consulta separada
    user_id = report_data.get("usuario_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User ID not found in report with ID {report_id}"
        )
    
    user_response = supabase.table("usuarios").select("*").eq("id", user_id).execute()
    if not user_response.data or len(user_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found in database"
        )
    user_data = user_response.data[0]
    
    # Obtener el checklist asociado en una consulta separada
    checklist_id = report_data.get("checklist_id")
    if not checklist_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist ID not found in report with ID {report_id}"
        )
    
    checklist_response = supabase.table("checklists").select("*").eq("id", checklist_id).execute()
    if not checklist_response.data or len(checklist_response.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {checklist_id} not found in database"
        )
    checklist_data = checklist_response.data[0]
    
    # Obtener los detalles del informe con sus relaciones
    details = []
    details_response = supabase.table("detalles_informe").select("*").eq("informe_id", report_id).execute()
    
    for detail_data in details_response.data:
        detail_copy = dict(detail_data)
        
        # Obtener el item asociado al detalle
        item_id = detail_copy.get("item_checklist_id")
        if not item_id:
            continue
        
        item_response = supabase.table("items_checklist").select("*").eq("id", item_id).execute()
        if not item_response.data or len(item_response.data) == 0:
            continue
        item_data = item_response.data[0]
        
        # Obtener el estado asociado al detalle
        estado_id = detail_copy.get("estado_id")
        if not estado_id:
            continue
        
        estado_response = supabase.table("estados_posibles").select("*").eq("id", estado_id).execute()
        if not estado_response.data or len(estado_response.data) == 0:
            continue
        state_data = estado_response.data[0]
        
        try:
            # Crear el objeto detalle
            detail = ReportDetailComplete(
                **detail_copy,
                item=item_data,
                estado=state_data
            )
            details.append(detail)
        except Exception as e:
            # Ignorar detalles con errores
            continue
    
    try:
        # Crear el informe completo
        report_complete = ReportComplete(
            id=report_data["id"],
            usuario_id=report_data["usuario_id"],
            fecha_creacion=report_data["fecha_creacion"],
            fecha_finalizacion=report_data.get("fecha_finalizacion"),
            checklist_id=report_data["checklist_id"],
            nombre=report_data.get("nombre"),
            aviso_llamada=report_data.get("aviso_llamada"),
            comentarios=report_data.get("comentarios"),
            maquina=machine_data,
            usuario=user_data,
            checklist=checklist_data,
            detalles=details
        )
        
        return report_complete
    except Exception as e:
        # Si hay un error al crear el informe completo, lanzar una excepción
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating complete report: {str(e)}"
        )

async def create_report(report: ReportCreate, user_id: str) -> Report:
    # Verificar que la máquina existe
    machine = await get_machine(format_uuid(report.maquina_id))
    if not machine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Machine with ID {report.maquina_id} not found"
        )
    
    # Verificar que el checklist existe
    checklist = await get_checklist(format_uuid(report.checklist_id))
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {report.checklist_id} not found"
        )
    
    # Crear el informe
    data = report.dict()
    
    # Generar nombre automáticamente si no se proporciona
    if not data.get("nombre"):
        aviso_llamada = data.get("aviso_llamada") or "SinAviso"
        numero_bastidor = machine.numero_bastidor or "SinBastidor"
        fecha_formato = datetime.now().strftime("%y%m%d")
        
        # Limpiar caracteres especiales
        aviso_llamada_clean = "".join(c for c in aviso_llamada if c.isalnum() or c in ('-', '_')).rstrip()
        numero_bastidor_clean = "".join(c for c in numero_bastidor if c.isalnum() or c in ('-', '_')).rstrip()
        
        data["nombre"] = f"{aviso_llamada_clean}_{numero_bastidor_clean}_{fecha_formato}"
    
    # Convertir UUIDs a strings para evitar problemas de serialización
    data["maquina_id"] = str(data["maquina_id"])
    data["checklist_id"] = str(data["checklist_id"])
    data["usuario_id"] = user_id
    data["fecha_creacion"] = datetime.now().isoformat()
    
    response = supabase.table("informes").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating report"
        )
    
    return Report(**response.data[0])

async def update_report(report_id: str, report: ReportUpdate, user_id: str) -> Report:
    # Verificar que el informe existe y pertenece al usuario
    existing_report = await get_report(report_id)
    if not existing_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    if str(existing_report.usuario_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this report"
        )
    
    # Solo se puede actualizar un informe en proceso (sin fecha de finalización)
    if existing_report.fecha_finalizacion is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a report that's already finalized"
        )
    
    update_data = report.dict(exclude_unset=True)
    
    response = supabase.table("informes").update(update_data).eq("id", report_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    return Report(**response.data[0])

async def finalize_report(report_id: str, user_id: str) -> Report:
    # Verificar que el informe existe y pertenece al usuario
    existing_report = await get_report(report_id)
    if not existing_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    if str(existing_report.usuario_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to finalize this report"
        )
    
    # Solo se puede finalizar un informe en proceso (sin fecha de finalización)
    if existing_report.fecha_finalizacion is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot finalize a report that's already finalized"
        )
    
    # Verificar que todos los items obligatorios tienen un estado asignado
    checklist = await get_checklist_with_groups(format_uuid(existing_report.checklist_id))
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {existing_report.checklist_id} not found"
        )
    
    # Obtener todos los items obligatorios
    obligatory_items = []
    for group in checklist.grupos:
        for item in group.items:
            if item.obligatorio:
                obligatory_items.append(str(item.id))
    
    # Obtener los detalles del informe
    details_response = supabase.table("detalles_informe").select("item_checklist_id").eq("informe_id", report_id).execute()
    
    completed_items = set([detail["item_checklist_id"] for detail in details_response.data])
    
    # Verificar que todos los items obligatorios están completados
    missing_items = [item_id for item_id in obligatory_items if item_id not in completed_items]
    
    if missing_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"There are {len(missing_items)} obligatory items not filled"
        )
    
    # Actualizar el informe como finalizado estableciendo la fecha de finalización
    update_data = {
        "fecha_finalizacion": datetime.now().isoformat()
    }
    
    response = supabase.table("informes").update(update_data).eq("id", report_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    return Report(**response.data[0])

async def delete_report(report_id: str, is_admin: bool) -> Dict:
    # Verificar que el informe existe
    existing_report = await get_report(report_id)
    if not existing_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    # Solo un administrador puede eliminar un informe finalizado
    if existing_report.fecha_finalizacion is not None and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an administrator can delete a finalized report"
        )
    
    # Eliminar los detalles del informe
    supabase.table("detalles_informe").delete().eq("informe_id", report_id).execute()
    
    # Eliminar el informe
    response = supabase.table("informes").delete().eq("id", report_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    return {"ok": True}

# Servicios para Detalles de Informe
async def get_report_details(report_id: str) -> List[ReportDetail]:
    response = supabase.table("detalles_informe").select("*").eq("informe_id", report_id).execute()
    return [ReportDetail(**item) for item in response.data]

async def get_report_detail(detail_id: str) -> Optional[ReportDetail]:
    response = supabase.table("detalles_informe").select("*").eq("id", detail_id).execute()
    
    if not response.data:
        return None
    
    return ReportDetail(**response.data[0])

async def create_report_detail(detail: ReportDetailCreate, user_id: str) -> ReportDetail:
    # Verificar que el informe existe
    report = await get_report(format_uuid(detail.informe_id))
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {detail.informe_id} not found"
        )
    
    # Verificar que el usuario es el dueño del informe
    if str(report.usuario_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add details to this report"
        )
    
    # Verificar que el informe está en proceso (sin fecha de finalización)
    if report.fecha_finalizacion is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add details to a report that's already finalized"
        )
    
    # Verificar que el item existe
    item = await get_item(format_uuid(detail.item_checklist_id))
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item with ID {detail.item_checklist_id} not found"
        )
    
    # Verificar que el estado existe
    state = await get_possible_state(format_uuid(detail.estado_id))
    if not state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Possible state with ID {detail.estado_id} not found"
        )
    
    # Verificar si ya existe un detalle para este item en este informe
    existing_detail = supabase.table("detalles_informe").select("id").eq("informe_id", detail.informe_id).eq("item_checklist_id", detail.item_checklist_id).execute()
    
    if existing_detail.data:
        # Si ya existe, actualizarlo en lugar de crear uno nuevo
        detail_id = existing_detail.data[0]["id"]
        return await update_report_detail(detail_id, ReportDetailUpdate(
            estado_id=detail.estado_id, 
            observaciones_internas=detail.observaciones_internas,
            observaciones_cliente=detail.observaciones_cliente
        ), user_id)
    
    data = detail.dict()
    # Convertir UUIDs a strings para evitar problemas de serialización
    data["informe_id"] = str(data["informe_id"])
    data["item_checklist_id"] = str(data["item_checklist_id"])
    data["estado_id"] = str(data["estado_id"])
    
    response = supabase.table("detalles_informe").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating report detail"
        )
    
    return ReportDetail(**response.data[0])

async def update_report_detail(detail_id: str, detail: ReportDetailUpdate, user_id: str) -> ReportDetail:
    # Verificar que el detalle existe
    existing_detail = await get_report_detail(detail_id)
    if not existing_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report detail with ID {detail_id} not found"
        )
    
    # Verificar que el informe existe
    report = await get_report(format_uuid(existing_detail.informe_id))
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {existing_detail.informe_id} not found"
        )
    
    # Verificar que el usuario es el dueño del informe
    if str(report.usuario_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update details in this report"
        )
    
    # Verificar que el informe está en proceso (sin fecha de finalización)
    if report.fecha_finalizacion is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update details in a report that's already finalized"
        )
    
    # Si se actualiza el estado, verificar que existe
    if detail.estado_id:
        state = await get_possible_state(format_uuid(detail.estado_id))
        if not state:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Possible state with ID {detail.estado_id} not found"
            )
    
    update_data = detail.dict(exclude_unset=True)
    
    # Convertir UUID a string para evitar problemas de serialización
    if "estado_id" in update_data:
        update_data["estado_id"] = str(update_data["estado_id"])
    
    response = supabase.table("detalles_informe").update(update_data).eq("id", detail_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report detail with ID {detail_id} not found"
        )
    
    return ReportDetail(**response.data[0])

async def delete_report_detail(detail_id: str, user_id: str, is_admin: bool = False) -> Dict:
    # Verificar que el detalle existe
    existing_detail = await get_report_detail(detail_id)
    if not existing_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report detail with ID {detail_id} not found"
        )
    
    # Si no es admin, verificar permisos
    if not is_admin:
        # Verificar que el informe existe
        report = await get_report(format_uuid(existing_detail.informe_id))
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {existing_detail.informe_id} not found"
            )
        
        # Verificar que el usuario es el dueño del informe
        if str(report.usuario_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete details from this report"
            )
        
        # Verificar que el informe está en proceso (sin fecha de finalización)
        if report.fecha_finalizacion is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete details from a report that's already finalized"
            )
    
    response = supabase.table("detalles_informe").delete().eq("id", detail_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report detail with ID {detail_id} not found"
        )
    
    return {"ok": True}

# Añadir después de get_report_details
async def get_report_details_grouped(report_id: str) -> ReportDetailsGrouped:
    """
    Obtiene los detalles del informe agrupados por grupo y con los nombres de los ítems y estados
    """
    # Obtener el informe para verificar que existe
    report = await get_report(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {report_id} not found"
        )
    
    # Obtener el checklist completo con sus grupos e ítems
    checklist = await get_checklist_with_groups(format_uuid(report.checklist_id))
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist with ID {report.checklist_id} not found"
        )
    
    # Obtener todos los detalles del informe
    details_response = supabase.table("detalles_informe").select("*").eq("informe_id", report_id).execute()
    if not details_response.data:
        # Si no hay detalles, devolver grupos vacíos
        groups = []
        for grupo in checklist.grupos:
            groups.append(GroupedReportDetails(
                grupo_nombre=grupo.nombre,
                items=[]
            ))
        return ReportDetailsGrouped(informe_id=report.id, grupos=groups)
    
    # Crear un diccionario para mapear item_id -> detalle
    details_map = {detail["item_checklist_id"]: detail for detail in details_response.data}
    
    # Crear grupos para la respuesta
    grouped_details = []
    
    # Para cada grupo en el checklist
    for grupo in checklist.grupos:
        grupo_items = []
        
        # Para cada ítem en el grupo
        for item in grupo.items:
            item_id = str(item.id)
            
            # Si hay un detalle para este ítem
            if item_id in details_map:
                detail = details_map[item_id]
                
                # Obtener el estado para conseguir su nombre
                estado_response = supabase.table("estados_posibles").select("nombre").eq("id", detail["estado_id"]).execute()
                estado_nombre = ""
                if estado_response.data and len(estado_response.data) > 0:
                    estado_nombre = estado_response.data[0]["nombre"]
                
                # Crear el detalle con nombres
                detail_with_names = ReportDetailWithNames(
                    id=detail["id"],
                    informe_id=detail["informe_id"],
                    item_id=item_id,
                    item_nombre=item.nombre,
                    estado_id=detail["estado_id"],
                    estado_nombre=estado_nombre,
                    observaciones_internas=detail.get("observaciones_internas"),
                    observaciones_cliente=detail.get("observaciones_cliente")
                )
                
                grupo_items.append(detail_with_names)
        
        # Añadir el grupo a la respuesta
        grouped_details.append(GroupedReportDetails(
            grupo_nombre=grupo.nombre,
            items=grupo_items
        ))
    
    return ReportDetailsGrouped(informe_id=report.id, grupos=grouped_details) 

async def create_batch_report_details(batch: BatchReportDetailCreate, user_id: str) -> Dict:
    """
    Crea múltiples detalles de informe en una sola operación (versión optimizada)
    """
    # Verificar que el informe existe
    report = await get_report(format_uuid(batch.informe_id))
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID {batch.informe_id} not found"
        )
    
    # Verificar que el usuario es el dueño del informe
    if str(report.usuario_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add details to this report"
        )
    
    # Verificar que el informe está en proceso (sin fecha de finalización)
    if report.fecha_finalizacion is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add details to a report that's already finalized"
        )
    
    # Si no hay detalles para procesar, retornar respuesta vacía
    if not batch.detalles:
        return {
            "processed": 0,
            "total": 0,
            "details": []
        }
    
    # Extraer todos los IDs de items y estados para verificarlos en lote
    item_ids = [str(detail.item_checklist_id) for detail in batch.detalles]
    state_ids = [str(detail.estado_id) for detail in batch.detalles]
    
    # Verificar que todos los items existen (en una sola consulta)
    items_response = supabase.table("items_checklist").select("id").in_("id", item_ids).execute()
    valid_item_ids = set(item["id"] for item in items_response.data)
    
    # Verificar que todos los estados existen (en una sola consulta)
    states_response = supabase.table("estados_posibles").select("id").in_("id", state_ids).execute()
    valid_state_ids = set(state["id"] for state in states_response.data)
    
    # Obtener los detalles existentes para este informe
    existing_details_response = supabase.table("detalles_informe").select("item_checklist_id, id").eq("informe_id", str(batch.informe_id)).execute()
    existing_details = {detail["item_checklist_id"]: detail["id"] for detail in existing_details_response.data}
    
    # Preparar los lotes para actualización e inserción
    update_batch = []
    insert_batch = []
    
    # Filtrar y preparar los datos para operaciones en lote
    for detail in batch.detalles:
        item_id_str = str(detail.item_checklist_id)
        state_id_str = str(detail.estado_id)
        
        # Verificar que tanto el item como el estado son válidos
        if item_id_str not in valid_item_ids or state_id_str not in valid_state_ids:
            continue
        
        # Preparar datos del detalle
        detail_data = {
            "item_checklist_id": item_id_str,
            "estado_id": state_id_str,
            "observaciones_internas": detail.observaciones_internas,
            "observaciones_cliente": detail.observaciones_cliente
        }
        
        # Separar entre actualizaciones e inserciones
        if item_id_str in existing_details:
            update_batch.append({
                "id": existing_details[item_id_str],
                **detail_data
            })
        else:
            insert_batch.append({
                "informe_id": str(batch.informe_id),
                **detail_data
            })
    
    processed_details = []
    
    # Realizar actualizaciones en lote (si hay)
    if update_batch:
        # Actualizar registros existentes con upsert
        update_response = supabase.table("detalles_informe").upsert(update_batch).execute()
        if update_response.data:
            processed_details.extend(update_response.data)
    
    # Realizar inserciones en lote (si hay)
    if insert_batch:
        insert_response = supabase.table("detalles_informe").insert(insert_batch).execute()
        if insert_response.data:
            processed_details.extend(insert_response.data)
    
    return {
        "processed": len(processed_details),
        "total": len(batch.detalles),
        "details": processed_details
    }