import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const machineTypesUrl = `${apiUrl}/api/machine-types/`;
    
    console.log('Haciendo petición a:', machineTypesUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken.substring(0, 10)}...`, // Solo mostramos parte del token por seguridad
      }
    });
    
    // Hacer la petición al backend con el token
    const response = await fetch(machineTypesUrl, {
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
        url: machineTypesUrl,
        errorData,
        headers: response.headers
      });
      throw new Error(`Error al obtener los tipos de máquina: ${response.status}`);
    }

    const data = await response.json();
    console.log('Respuesta exitosa de tipos de máquina:', {
      count: Array.isArray(data) ? data.length : 'N/A',
      url: machineTypesUrl
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error en GET /api/machine-types:', error);
    return NextResponse.json(
      { error: 'Error al obtener los tipos de máquina' },
      { status: 500 }
    );
  }
} 