import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { checklist_id: string } }
) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    console.log('Sesión actual:', {
      user: session?.user,
      hasAccessToken: !!session?.accessToken,
    });
    
    // Verificar que tenemos un token de acceso
    if (!session?.accessToken) {
      console.error('No hay token de acceso en la sesión:', session);
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    const checklistId = params.checklist_id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const groupsUrl = `${apiUrl}/api/checklists/${checklistId}/groups/`;
    
    console.log('Haciendo petición a:', groupsUrl);
    
    // Hacer la petición al backend con el token
    const response = await fetch(groupsUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error en la respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        url: groupsUrl,
        errorData
      });
      throw new Error(`Error al obtener los grupos: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta exitosa de grupos:', {
      count: Array.isArray(data) ? data.length : 'N/A',
      url: groupsUrl
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error en GET /api/checklists/[id]/groups:', error);
    return NextResponse.json(
      { error: 'Error al obtener los grupos' },
      { status: 500 }
    );
  }
} 