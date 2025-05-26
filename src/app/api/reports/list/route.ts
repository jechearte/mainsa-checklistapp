import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { InformeListItem } from '@/app/lib/types';

export async function GET(request: Request) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    // URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Obtener parámetros de filtro de la URL
    const { searchParams } = new URL(request.url);
    const tipoMaquinaId = searchParams.get('tipo_maquina_id');
    const numeroBastidor = searchParams.get('numero_bastidor');
    const fechaDesde = searchParams.get('fecha_desde');
    const fechaHasta = searchParams.get('fecha_hasta');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('page_size') || '20'; // Por defecto 20 elementos por página
    
    // Construir la URL de la API con los filtros
    let listReportsUrl = `${apiUrl}/api/reports/`;
    
    // Agregar signo ? solo si hay algún filtro
    let hasFilter = false;
    
    if (tipoMaquinaId) {
      listReportsUrl += `${hasFilter ? '&' : '?'}machine_type_id=${tipoMaquinaId}`;
      hasFilter = true;
    }
    
    if (numeroBastidor) {
      listReportsUrl += `${hasFilter ? '&' : '?'}numero_bastidor=${numeroBastidor}`;
      hasFilter = true;
    }
    
    if (fechaDesde) {
      listReportsUrl += `${hasFilter ? '&' : '?'}fecha_desde=${fechaDesde}`;
      hasFilter = true;
    }
    
    if (fechaHasta) {
      listReportsUrl += `${hasFilter ? '&' : '?'}fecha_hasta=${fechaHasta}`;
      hasFilter = true;
    }
    
    // Agregar parámetros de paginación
    listReportsUrl += `${hasFilter ? '&' : '?'}page=${page}`;
    hasFilter = true;
    listReportsUrl += `&page_size=${pageSize}`;
    
    // Hacer la petición para listar los informes
    const reportsResponse = await fetch(listReportsUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!reportsResponse.ok) {
      return NextResponse.json(
        { error: 'Error al obtener los informes' },
        { status: reportsResponse.status }
      );
    }
    
    // Obtener directamente la respuesta del API y devolverla
    const responseData = await reportsResponse.json();
    
    // La respuesta ya tiene el formato correcto con data, total, page, page_size y total_pages
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error en GET /api/reports/list:', error);
    return NextResponse.json(
      { error: 'Error al obtener los informes' },
      { status: 500 }
    );
  }
} 