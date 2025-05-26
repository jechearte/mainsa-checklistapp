import os
import asyncio
from app.services.reports import get_report_complete

async def test_informe():
    # Obtener un informe específico para probar
    try:
        # Cambia este ID por uno que exista en tu base de datos
        report_id = "tu_report_id_aqui"  # Reemplaza con un ID real
        
        report = await get_report_complete(report_id)
        
        if report:
            print(f"Informe encontrado:")
            print(f"ID: {report.id}")
            print(f"Nombre: '{report.nombre}'")
            print(f"Aviso llamada: '{report.aviso_llamada}'")
            print(f"Fecha creación: {report.fecha_creacion}")
            print(f"Número bastidor: {report.maquina.numero_bastidor}")
            
            # Simular la lógica del endpoint PDF
            def clean_filename(text: str) -> str:
                if not text:
                    return ""
                cleaned = "".join(c for c in text if c.isalnum() or c in ('-', '_', '.')).strip()
                return cleaned if cleaned else "SinNombre"
            
            if report.nombre and report.nombre.strip():
                filename = clean_filename(report.nombre)
                if not filename.endswith('.pdf'):
                    filename = f"{filename}.pdf"
                print(f"Nombre de archivo generado: '{filename}'")
            else:
                print("El campo nombre está vacío o es None")
                
        else:
            print("Informe no encontrado")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Para usar este script, reemplaza 'tu_report_id_aqui' con un ID real de informe")
    print("Luego ejecuta: python test_informe_nombre.py") 