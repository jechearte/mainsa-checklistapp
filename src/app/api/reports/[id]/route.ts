import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Definir interfaces para los tipos de datos
interface GrupoResponse {
  grupo_nombre: string;
  items: ItemResponse[];
}

interface ItemResponse {
  id: string;
  informe_id: string;
  item_id: string;
  item_nombre: string;
  estado_id: string;
  estado_nombre: string;
  observaciones: string;
}

interface DetailsResponse {
  informe_id: string;
  grupos?: GrupoResponse[];
}

interface Grupo {
  id: string;
  nombre: string;
  orden: number;
  checklist_id: string;
}

interface Item {
  id: string;
  nombre: string;
  descripcion: string;
  grupo_id: string;
  checklist_id: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID de informe no proporcionado' }, { status: 400 });
    }

    // URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // URL para obtener los detalles del informe
    const reportUrl = `${apiUrl}/api/reports/${id}/`;
    
    // Hacer la petición para obtener el informe
    const reportResponse = await fetch(reportUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!reportResponse.ok) {
      return NextResponse.json(
        { error: 'Error al obtener el informe' },
        { status: reportResponse.status }
      );
    }
    
    // Obtener los datos del informe
    const report = await reportResponse.json();
    
    // URL para obtener los detalles (items) del informe
    const detailsUrl = `${apiUrl}/api/reports/${id}/details/`;
    
    // Hacer la petición para obtener los detalles
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!detailsResponse.ok) {
      return NextResponse.json(
        { error: 'Error al obtener los detalles del informe' },
        { status: detailsResponse.status }
      );
    }
    
    // Obtener los detalles del informe con la nueva estructura
    const detailsData: DetailsResponse = await detailsResponse.json();
    
    // Verificar si los detalles vienen en el nuevo formato (con grupos e items)
    if (detailsData && detailsData.grupos) {
      console.log('Procesando respuesta en nuevo formato con grupos estructurados');
      
      // Extraer todos los items de todos los grupos en un solo array
      const allItems: Item[] = [];
      const grupos: Grupo[] = [];
      
      // Procesar cada grupo
      detailsData.grupos.forEach((grupo: GrupoResponse, index: number) => {
        // Crear objeto de grupo con el formato esperado por el frontend
        const grupoObj: Grupo = {
          id: `grupo-${index}-${grupo.grupo_nombre.toLowerCase().replace(/\s+/g, '-')}`, // ID más descriptivo
          nombre: grupo.grupo_nombre,
          orden: index, // Orden basado en el índice
          checklist_id: report.checklist.id
        };
        
        grupos.push(grupoObj);
        
        // Procesar los items de este grupo
        if (grupo.items && Array.isArray(grupo.items)) {
          grupo.items.forEach((item: ItemResponse) => {
            // Añadir al array general de items con el formato esperado
            allItems.push({
              id: item.item_id, // Usar el mismo ID que en los detalles
              nombre: item.item_nombre,
              descripcion: '',
              grupo_id: grupoObj.id,
              checklist_id: report.checklist.id
            });
          });
        }
      });
      
      console.log('Grupos procesados:', grupos.map(g => ({id: g.id, nombre: g.nombre})));
      console.log('Número total de items:', allItems.length);
      
      // Devolver la respuesta completa con la estructura adaptada
      return NextResponse.json({
        ...report,
        detalles: detailsData.grupos.flatMap((g: GrupoResponse) => 
          g.items.map(item => ({
            ...item,
            item_checklist_id: item.item_id, // Añadir explícitamente esta propiedad para compatibilidad
            estado_nombre: item.estado_nombre // Incluir el nombre del estado directamente de la respuesta
          }))
        ),
        grupos: grupos,
        items: allItems
      });
    } else {
      // Si aún viene en el formato antiguo, mantener la respuesta original
      console.log('Procesando respuesta en formato estándar');
      return NextResponse.json({
        ...report,
        detalles: detailsData
      });
    }
    
  } catch (error) {
    console.error(`Error en GET /api/reports/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener el informe' },
      { status: 500 }
    );
  }
} 