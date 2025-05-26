import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    console.log('Sesión actual en /api/machines/[id]:', {
      user: session?.user,
      hasAccessToken: !!session?.accessToken,
      machine_id: params.id
    });
    
    // Verificar que tenemos un token de acceso
    if (!session?.accessToken) {
      console.error('No hay token de acceso en la sesión:', session);
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    const machineId = params.id;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const machineUrl = `${apiUrl}/api/machines/${machineId}/`;
    
    console.log('Haciendo petición a:', machineUrl);
    
    // Hacer la petición al backend con el token
    const response = await fetch(machineUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store', // Deshabilitar caché
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error en la respuesta del backend:', {
        status: response.status,
        statusText: response.statusText,
        url: machineUrl,
        errorData
      });
      throw new Error(`Error al obtener la máquina: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta exitosa de máquina por ID:', {
      id: data.id,
      referencia: data.referencia,
      url: machineUrl
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error en GET /api/machines/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener la máquina' },
      { status: 500 }
    );
  }
} 