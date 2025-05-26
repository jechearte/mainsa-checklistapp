from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel
import base64

from app.models.reports import (
    Report, ReportCreate, ReportUpdate, ReportComplete, ReportTable,
    ReportDetail, ReportDetailCreate, ReportDetailUpdate, ReportDetailsGrouped,
    BatchReportDetailCreate
)
from app.models.users import User
from app.dependencies import get_current_active_user, check_admin, check_mechanic, get_db
from app.services.reports import (
    get_reports, get_report, get_report_complete, count_reports,
    create_report, update_report, finalize_report, delete_report,
    get_report_details, get_report_detail, get_report_details_grouped,
    create_report_detail, update_report_detail, delete_report_detail,
    create_batch_report_details
)
from app.services.pdf_generator import generate_report_pdf

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
    responses={404: {"description": "Not found"}},
)

# Modelo para respuesta paginada
class PaginatedResponse(BaseModel):
    data: List[ReportTable]
    total: int
    page: int
    page_size: int
    total_pages: int

# Modelo para respuesta del PDF
class PDFResponse(BaseModel):
    filename: str
    content: str  # PDF en base64
    content_type: str

# Endpoints para Informes
@router.get("/", response_model=PaginatedResponse)
async def read_reports(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(20, ge=1, le=100, description="Número de elementos por página"),
    user_email: Optional[str] = None,
    machine_id: Optional[str] = None,
    machine_type_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener informes con paginación y filtros opcionales.
    Devuelve información resumida para mostrar en una tabla:
    - id
    - fecha_creacion
    - fecha_finalizacion
    - maquina_id
    - tipo_maquina
    - numero_bastidor
    """
    # Si el usuario no es administrador, solo puede ver sus propios informes
    if current_user.tipo != "administrativo" and user_email and user_email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own reports"
        )
    
    # Si el usuario no es administrador y no se especifica un usuario, mostrar solo los propios
    if current_user.tipo != "administrativo" and not user_email:
        user_email = current_user.email
    
    # Convertir fechas a formato ISO si se proporcionan
    from_date_str = from_date.isoformat() if from_date else None
    to_date_str = to_date.isoformat() if to_date else None
    
    # Calcular skip basado en la página actual
    skip = (page - 1) * page_size
    
    # Obtener los informes para la página actual
    reports = await get_reports(
        skip=skip, 
        limit=page_size, 
        user_email=user_email,
        machine_id=machine_id,
        machine_type_id=machine_type_id,
        from_date=from_date_str,
        to_date=to_date_str,
        status=status
    )
    
    # Obtener el conteo total de informes para calcular el total de páginas
    total_reports = await count_reports(
        user_email=user_email,
        machine_id=machine_id,
        machine_type_id=machine_type_id,
        from_date=from_date_str,
        to_date=to_date_str,
        status=status
    )
    
    # Calcular el total de páginas
    total_pages = (total_reports + page_size - 1) // page_size
    
    # Devolver los datos paginados
    return {
        "data": reports,
        "total": total_reports,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{report_id}", response_model=ReportComplete)
async def read_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener un informe completo con detalles
    """
    report = await get_report_complete(report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Si el usuario no es administrador, solo puede ver sus propios informes
    if current_user.tipo != "administrativo" and str(report.usuario_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this report"
        )
    
    return report

@router.post("/", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_new_report(
    report: ReportCreate,
    current_user: User = Depends(check_mechanic)
):
    """
    Crear un nuevo informe (solo mecánicos)
    """
    return await create_report(report, str(current_user.id))

@router.put("/{report_id}", response_model=Report)
async def update_report_details(
    report_id: str,
    report_update: ReportUpdate,
    current_user: User = Depends(check_mechanic)
):
    """
    Actualizar un informe (solo mecánicos)
    """
    return await update_report(report_id, report_update, str(current_user.id))

@router.put("/{report_id}/finalize", response_model=Report)
async def finalize_report_endpoint(
    report_id: str,
    current_user: User = Depends(check_mechanic)
):
    """
    Finalizar un informe (solo mecánicos)
    """
    return await finalize_report(report_id, str(current_user.id))

@router.delete("/{report_id}")
async def delete_report_endpoint(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Eliminar un informe (mecánico si está en proceso, administrador en cualquier caso)
    """
    is_admin = current_user.tipo == "administrativo"
    return await delete_report(report_id, is_admin)

# Endpoints para Detalles de Informe
@router.get("/{report_id}/details", response_model=ReportDetailsGrouped)
async def read_report_details(
    report_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Obtener detalles de un informe agrupados por grupo y con nombres de ítems y estados
    """
    # Verificar que el usuario tiene permiso para ver este informe
    report = await get_report(report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Si el usuario no es administrativo, solo puede ver sus propios informes
    if current_user.tipo != "administrativo" and str(report.usuario_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view details of this report"
        )
    
    return await get_report_details_grouped(report_id)

@router.post("/details", response_model=ReportDetail, status_code=status.HTTP_201_CREATED)
async def create_new_report_detail(
    detail: ReportDetailCreate,
    current_user: User = Depends(check_mechanic)
):
    """
    Crear un nuevo detalle de informe (solo mecánicos)
    """
    return await create_report_detail(detail, str(current_user.id))

@router.put("/details/{detail_id}", response_model=ReportDetail)
async def update_report_detail_endpoint(
    detail_id: str,
    detail_update: ReportDetailUpdate,
    current_user: User = Depends(check_mechanic)
):
    """
    Actualizar un detalle de informe (solo mecánicos)
    """
    return await update_report_detail(detail_id, detail_update, str(current_user.id))

@router.delete("/details/{detail_id}")
async def delete_report_detail_endpoint(
    detail_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Eliminar un detalle de informe (mecánico si el informe está en proceso, administrador en cualquier caso)
    """
    is_admin = current_user.tipo == "administrativo"
    return await delete_report_detail(detail_id, str(current_user.id), is_admin) 

@router.post("/details/batch", status_code=status.HTTP_201_CREATED)
async def create_batch_details(
    batch: BatchReportDetailCreate,
    current_user: User = Depends(check_mechanic)
):
    """
    Crear múltiples detalles de informe en una sola operación (solo mecánicos)
    """
    return await create_batch_report_details(batch, str(current_user.id))

@router.get("/{report_id}/pdf", response_model=PDFResponse)
async def generate_pdf_from_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    db = Depends(get_db)
):
    """
    Genera un PDF con la información completa del informe
    Devuelve el PDF en base64 junto con el nombre del archivo
    """
    # Verificar que el usuario tiene permiso para acceder a este informe
    report = await get_report_complete(report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Si el usuario no es administrativo, solo puede ver sus propios informes
    if current_user.tipo != "administrativo" and str(report.usuario_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this report"
        )
    
    # Generar el PDF
    pdf_bytes = await generate_report_pdf(report_id, db)
    
    # Función para limpiar nombre de archivo
    def clean_filename(text: str) -> str:
        if not text:
            return ""
        # Mantener solo caracteres alfanuméricos, guiones, guiones bajos y puntos
        cleaned = "".join(c for c in text if c.isalnum() or c in ('-', '_', '.')).strip()
        return cleaned if cleaned else "SinNombre"
    
    # Usar el nombre del informe como nombre del archivo PDF
    if report.nombre and report.nombre.strip():
        filename = clean_filename(report.nombre)
        # Asegurar que termine en .pdf
        if not filename.endswith('.pdf'):
            filename = f"{filename}.pdf"
    else:
        # Fallback: generar nombre con el formato original
        aviso_llamada = report.aviso_llamada or "SinAviso"
        numero_bastidor = report.maquina.numero_bastidor or "SinBastidor"
        fecha_formato = report.fecha_creacion.strftime("%y%m%d")
        
        # Limpiar caracteres especiales para el nombre del archivo
        aviso_llamada_clean = clean_filename(aviso_llamada)
        numero_bastidor_clean = clean_filename(numero_bastidor)
        
        filename = f"{aviso_llamada_clean}_{numero_bastidor_clean}_{fecha_formato}.pdf"
    
    # Convertir el PDF a base64
    pdf_base64 = base64.b64encode(pdf_bytes.getvalue()).decode('utf-8')
    
    # Devolver el PDF y el nombre del archivo en JSON
    return PDFResponse(
        filename=filename,
        content=pdf_base64,
        content_type="application/pdf"
    )