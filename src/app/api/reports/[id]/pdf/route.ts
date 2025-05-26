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
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    const id = params.id;
    
    if (!id) {
      return NextResponse.json({ error: 'ID de informe no proporcionado' }, { status: 400 });
    }

    // URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // URL para obtener el PDF del informe
    const pdfUrl = `${apiUrl}/api/reports/${id}/pdf/`;
    
    console.log('Solicitando PDF del informe:', id);
    console.log('URL de petición:', pdfUrl);
    
    // Hacer la petición para obtener el PDF
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/pdf',
      },
      cache: 'no-store',
    });
    
    if (!pdfResponse.ok) {
      console.error('Error al obtener el PDF:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        url: pdfUrl
      });
      return NextResponse.json(
        { error: 'Error al generar el PDF del informe' },
        { status: pdfResponse.status }
      );
    }
    
    // Obtener el PDF como un array de bytes
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    
    // Devolver el PDF como un flujo de bytes con el tipo MIME correcto
    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${id}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error(`Error en GET /api/reports/${params.id}/pdf:`, error);
    return NextResponse.json(
      { error: 'Error al generar el PDF del informe' },
      { status: 500 }
    );
  }
} 