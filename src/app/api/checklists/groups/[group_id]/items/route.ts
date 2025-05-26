import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { group_id: string } }
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

    const groupId = params.group_id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const itemsUrl = `${apiUrl}/api/checklists/groups/${groupId}/items/`;
    
    console.log('Haciendo petición a:', itemsUrl);
    
    // Hacer la petición al backend con el token
    const response = await fetch(itemsUrl, {
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
        url: itemsUrl,
        errorData
      });
      throw new Error(`Error al obtener los items: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta exitosa de items:', {
      count: Array.isArray(data) ? data.length : 'N/A',
      url: itemsUrl
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error en GET /api/checklists/groups/[id]/items:', error);
    return NextResponse.json(
      { error: 'Error al obtener los items' },
      { status: 500 }
    );
  }
} 