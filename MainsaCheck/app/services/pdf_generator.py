from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable, ListItem, Image
from reportlab.lib.units import inch
from io import BytesIO
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict
import os

from app.services.reports import get_report_complete, get_report_details_grouped
from app.models.reports import ReportComplete, GroupedReportDetails, ReportDetailWithNames

async def generate_report_pdf(report_id: str, db=None) -> BytesIO:
    """
    Genera un PDF con la información completa de un informe
    
    Args:
        report_id: ID del informe a generar
        db: Parámetro ignorado, mantenido por compatibilidad
    
    Returns:
        BytesIO: Buffer con el contenido del PDF
    """
    # Obtener los datos completos del informe usando la función existente
    # Esta función ya usa Supabase internamente
    report_data = await get_report_complete(report_id)
    
    # Obtener los detalles del informe agrupados por grupo
    # Esta función gestiona correctamente la agrupación por grupo
    report_details_grouped = await get_report_details_grouped(report_id)
    
    # Crear un buffer para el PDF
    buffer = BytesIO()
    
    # Crear el documento PDF
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
        title=report_id,
        author="MAINSA PLATAFORMAS, S.L.",
        subject="Informe de Revisión de Maquinaria",
        creator="MainsaCheck"
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    # En lugar de añadir un nuevo estilo con el mismo nombre, modificamos el existente
    styles['Heading2'].spaceAfter = 6
    
    # Añadir solo estilos que no existan
    styles.add(ParagraphStyle(
        name='Normal_Bold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold'
    ))
    
    # Elementos que irán en el PDF
    elements = []
    
    # HEADER - Información de la empresa
    # Intentar cargar el logo
    logo_path = os.path.join("app", "static", "images", "logo.png")
    logo_element = None
    
    if os.path.exists(logo_path):
        try:
            # Si el logo existe, crear elemento Image con proporciones correctas
            # Dimensiones originales: 364x94 (ratio ≈ 3.87:1)
            # Reducimos el tamaño para un header más compacto
            logo_width = 2*inch  # Reducido de 2.5 a 2 pulgadas
            logo_height = logo_width * (94/364)  # Mantener proporción original
            logo_element = Image(logo_path, width=logo_width, height=logo_height)
        except Exception as e:
            # Si hay error cargando la imagen, usar texto
            logo_element = Paragraph("<b>MAINSA</b><br/><font size=10>Plataformas</font><br/><font size=8><i>Alquiler de plataformas elevadoras</i></font>", styles['Normal'])
    else:
        # Si no existe el logo, usar texto
        logo_element = Paragraph("<b>MAINSA</b><br/><font size=10>Plataformas</font><br/><font size=8><i>Alquiler de plataformas elevadoras</i></font>", styles['Normal'])
    
    header_data = [
        [
            # Columna izquierda - Logo o texto de la empresa
            logo_element,
            # Columna derecha - Información de contacto con texto más pequeño
            Paragraph("<font size=10><b>MAINSA PLATAFORMAS, S.L.</b></font><br/><font size=8>Recta de Heras, Km.-11  C.P. 39792 HERAS (Cantabria)</font><br/><font size=8><b>Tfno: 942 55 95 94</b>          <b>www.grupomainsa.es</b></font>", styles['Normal'])
        ]
    ]
    
    # Crear tabla del header
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])  # Más espacio para el logo
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),    # Logo/nombre alineado a la izquierda
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),   # Información de contacto alineada a la derecha
        ('TOPPADDING', (0, 0), (-1, -1), 1),    # Reducido de 3 a 1
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8), # Aumentado de 3 a 8 para más espacio
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        # Línea inferior para separar el header
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.black),
    ]))
    header_table.hAlign = 'LEFT'
    
    elements.append(header_table)
    elements.append(Spacer(1, 0.08*inch))  # Reducido de 0.15 a 0.08
    
    # Crear sección combinada: Fecha de Revisión, Técnico y Aviso/Llamada
    fecha_revision = report_data.fecha_creacion.strftime("%d/%m/%Y %H:%M")
    
    # Preparar datos del técnico
    tecnico_info = f"{report_data.usuario.nombre} {report_data.usuario.apellidos}"
    if report_data.fecha_finalizacion:
        tecnico_info += f"\nFecha de Finalización: {report_data.fecha_finalizacion.strftime('%d/%m/%Y %H:%M')}"
    
    # Preparar datos del aviso/llamada
    aviso_info = report_data.aviso_llamada or "No especificado"
    
    # Crear tabla con Fecha de Revisión, Técnico y Aviso/Llamada
    fecha_tecnico_data = [
        [
            # Columna izquierda - Fecha de Revisión
            Paragraph("<b>Fecha de Revisión</b><br/>" + fecha_revision, styles['Normal']),
            # Columna centro - Técnico
            Paragraph("<b>Técnico</b><br/>" + tecnico_info, styles['Normal']),
            # Columna derecha - Aviso/Llamada
            Paragraph("<b>Aviso/Llamada</b><br/>" + aviso_info, styles['Normal'])
        ]
    ]
    
    # Ajustar anchos de columna para 3 columnas - reducir ancho de Técnico para acercar Aviso/Llamada
    fecha_tecnico_table = Table(fecha_tecnico_data, colWidths=[1.8*inch, 2.0*inch, 3.2*inch])
    fecha_tecnico_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),   # Todas las columnas alineadas a la izquierda
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 6),   # 6 puntos entre Fecha y Técnico
        ('RIGHTPADDING', (1, 0), (1, 0), 6),   # 6 puntos entre Técnico y Aviso/Llamada - MISMO ESPACIO
        ('RIGHTPADDING', (2, 0), (2, 0), 0),   # Sin padding derecho en la última columna
    ]))
    fecha_tecnico_table.hAlign = 'LEFT'
    
    elements.append(fecha_tecnico_table)
    elements.append(Spacer(1, 0.1*inch))
    
    # Función para crear el formato "nombre: valor" con nombre en negrita
    def field_with_bold_name(name, value):
        return f"<b>{name}:</b> {value}"
    
    # Añadir título para la información de la máquina
    elements.append(Paragraph("Información sobre la máquina", styles['Heading2']))
    
    # Crear una tabla con 2 columnas para los datos de la máquina
    machine_data = [
        [field_with_bold_name("Cliente", report_data.maquina.cliente or "No especificado"), 
         field_with_bold_name("Matrícula", report_data.maquina.numero_matricula or "No especificado")],
        
        [field_with_bold_name("Zona", report_data.maquina.zona or "No especificada"), 
         field_with_bold_name("Flota", report_data.maquina.numero_flota or "No especificado")],
        
        [field_with_bold_name("Número de bastidor", report_data.maquina.numero_bastidor or "No especificado"), 
         field_with_bold_name("Horas", str(report_data.maquina.numero_horas) if report_data.maquina.numero_horas is not None else "No especificado")],
        
        [field_with_bold_name("Número de fabricación", report_data.maquina.numero_fabricacion or "No especificado"), 
         field_with_bold_name("Kilómetros", str(report_data.maquina.numero_kilometros) if report_data.maquina.numero_kilometros is not None else "No especificado")],
        
        [field_with_bold_name("Capacidad", report_data.maquina.capacidad or "No especificada"), 
         ""]  # Segunda columna vacía para mantener la estructura
    ]
    
    # Convertir textos a párrafos para manejar correctamente el HTML (negrita)
    for i in range(len(machine_data)):
        for j in range(len(machine_data[i])):
            machine_data[i][j] = Paragraph(machine_data[i][j], styles['Normal'])
    
    # Crear la tabla
    machine_table = Table(machine_data, colWidths=[3*inch, 3*inch])
    machine_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 1),    # Reducido de 3 a 1
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1), # Reducido de 3 a 1
        ('LEFTPADDING', (0, 0), (-1, -1), 0),   # Mantener en 0
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),  # Reducido de 5 a 2
    ]))
    machine_table.hAlign = 'LEFT'  # Forzar alineación izquierda de la tabla
    
    elements.append(machine_table)
    elements.append(Spacer(1, 0.1*inch))  # Reducido de 0.15 a 0.1
    
    # Checklist items agrupados
    elements.append(Paragraph("Checklist", styles['Heading2']))
    
    # Función auxiliar para crear una tabla de grupo
    def create_group_table(grupo):
        # Cabecera de la tabla con el nombre del grupo
        items_data = [[grupo.grupo_nombre, "Estado"]]
        
        # Datos de los items
        for detail in grupo.items:
            items_data.append([
                detail.item_nombre,
                detail.estado_nombre
            ])
        
        # Crear tabla
        items_table = Table(items_data, colWidths=[2.5*inch, 0.6*inch])  # Reducido para ajustarse al nuevo espacio
        
        # Crear lista de estilos base
        table_styles = [
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),  # Reducido de 9 a 8
            ('SPAN', (0, 0), (0, 0)),  # El título del grupo ocupa solo la primera celda
            ('TOPPADDING', (0, 0), (-1, -1), 1),    # Añadido padding reducido
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1), # Añadido padding reducido
            ('LEFTPADDING', (0, 0), (-1, -1), 3),   # Cambiado de 0 a 3 para dar margen al texto
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),  # Añadido padding mínimo
        ]
        
        # Añadir colores basados en el estado
        for i, detail in enumerate(grupo.items):
            row_index = i + 1  # +1 porque la primera fila es el header
            if detail.estado_nombre.lower() == "bien":
                # Verde para "Bien"
                table_styles.append(('TEXTCOLOR', (1, row_index), (1, row_index), colors.green))
            else:
                # Rojo para cualquier otro valor
                table_styles.append(('TEXTCOLOR', (1, row_index), (1, row_index), colors.red))
        
        items_table.setStyle(TableStyle(table_styles))
        items_table.hAlign = 'LEFT'  # Forzar alineación izquierda de la tabla
        
        return items_table
    
    # Organizar grupos en pares para mostrar en 2 columnas
    grupos = report_details_grouped.grupos
    for i in range(0, len(grupos), 2):
        # Grupo izquierdo
        left_group = grupos[i]
        left_table = create_group_table(left_group)
        
        # Grupo derecho (si existe)
        if i + 1 < len(grupos):
            right_group = grupos[i + 1]
            right_table = create_group_table(right_group)
            
            # Crear una tabla que contenga ambos grupos lado a lado
            groups_table_data = [[left_table, right_table]]
            groups_table = Table(groups_table_data, colWidths=[3.3*inch, 3.3*inch])  # Reducido de 3.5 a 3.3 para crear espacio
            groups_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            groups_table.hAlign = 'LEFT'  # Forzar alineación izquierda de la tabla
            
            elements.append(groups_table)
        else:
            # Si solo hay un grupo, añadirlo solo
            elements.append(left_table)
        
        elements.append(Spacer(1, 0.1*inch))  # Reducido de 0.15 a 0.1
    
    elements.append(Spacer(1, 0.15*inch))  # Reducido de 0.25 a 0.15
    
    # Observaciones
    elements.append(Paragraph("Observaciones", styles['Heading2']))
    
    has_observations = False
    observation_count = 0
    
    # Usar los detalles agrupados para las observaciones
    for grupo in report_details_grouped.grupos:
        for detail in grupo.items:
            if detail.observaciones_internas or detail.observaciones_cliente:
                has_observations = True
                observation_count += 1
                
                # Si hay más de una observación, añadir línea de separación antes de la segunda y siguientes
                if observation_count > 1:
                    # Crear una línea de separación
                    line_data = [["_" * 80, ""]]  # Línea de guiones bajos
                    line_table = Table(line_data, colWidths=[6*inch, 0.5*inch])
                    line_table.setStyle(TableStyle([
                        ('FONTSIZE', (0, 0), (-1, -1), 8),
                        ('TEXTCOLOR', (0, 0), (-1, -1), colors.grey),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 0),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                        ('TOPPADDING', (0, 0), (-1, -1), 2),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ]))
                    line_table.hAlign = 'LEFT'
                    elements.append(line_table)
                    elements.append(Spacer(1, 0.05*inch))
                
                # Crear una tabla individual para cada observación (3 filas x 2 columnas)
                obs_data = [
                    [field_with_bold_name("Item", detail.item_nombre), ""],
                    [field_with_bold_name("Observación Interna", detail.observaciones_internas or "Sin observaciones"), ""],
                    [field_with_bold_name("Observación Cliente", detail.observaciones_cliente or "Sin observaciones"), ""]
                ]
                
                # Convertir textos a párrafos para manejar correctamente el HTML (negrita) y texto multilínea
                for i in range(len(obs_data)):
                    for j in range(len(obs_data[i])):
                        if obs_data[i][j]:  # Solo convertir si no está vacío
                            obs_data[i][j] = Paragraph(obs_data[i][j], styles['Normal'])
                
                # Crear tabla individual para esta observación
                obs_table = Table(obs_data, colWidths=[6*inch, 0.5*inch])  # Segunda columna muy pequeña o vacía
                obs_table.setStyle(TableStyle([
                    # Sin bordes - eliminamos todas las líneas GRID
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # TOP para texto multilínea
                    ('TOPPADDING', (0, 0), (-1, -1), 2),    # Reducido para mejor espaciado
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2), # Reducido para mejor espaciado
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                ]))
                obs_table.hAlign = 'LEFT'
                
                elements.append(obs_table)
                elements.append(Spacer(1, 0.1*inch))  # Espacio entre observaciones
    
    if not has_observations:
        elements.append(Paragraph("No hay observaciones registradas", styles['Normal']))
    
    # Comentarios generales
    if report_data.comentarios:
        elements.append(Spacer(1, 0.15*inch))  # Reducido de 0.25 a 0.15
        elements.append(Paragraph("Comentarios Generales", styles['Heading2']))
        elements.append(Paragraph(report_data.comentarios, styles['Normal']))
    
    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer 