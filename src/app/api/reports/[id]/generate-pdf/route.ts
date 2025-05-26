import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🚀 Iniciando generación de PDF para informe:', id);
    
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      console.error('❌ No hay token de acceso en la sesión');
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }
    
    console.log('🔐 Sesión verificada, usuario:', session.user?.email);
    
    // Verificar variable de entorno
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('🌐 API URL:', apiUrl);
    
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL no está configurado');
    }
    
    const backendUrl = `${apiUrl}/api/reports/${id}/pdf/`;
    console.log('📡 Llamando al backend:', backendUrl);
    
    // Hacer petición al backend para generar el PDF
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    console.log('📊 Respuesta del backend:', backendResponse.status, backendResponse.statusText);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Error del backend:', errorText);
      throw new Error(`Error al generar el PDF en el backend: ${backendResponse.status} - ${errorText}`);
    }
    
    // Obtener el JSON con filename y content
    const data = await backendResponse.json();
    console.log('📦 Datos recibidos del backend:', {
      hasFilename: !!data.filename,
      hasContent: !!data.content,
      filenameValue: data.filename,
      contentLength: data.content ? data.content.length : 0
    });
    
    if (!data.filename || !data.content) {
      throw new Error('Respuesta inválida del backend');
    }
    
    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(data.content, 'base64');
    console.log('🔄 Buffer PDF creado, tamaño:', pdfBuffer.length, 'bytes');
    
    // Crear la ruta del archivo
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    console.log('📁 Directorio PDF:', pdfDir);
    
    // Asegurar que la carpeta existe
    if (!fs.existsSync(pdfDir)) {
      console.log('📂 Creando directorio PDF...');
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    
    // Crear nombre del archivo con el ID del informe como prefijo
    const fileName = `${id}_${data.filename}`;
    const filePath = path.join(pdfDir, fileName);
    console.log('💾 Guardando archivo en:', filePath);
    
    // Guardar el archivo
    fs.writeFileSync(filePath, pdfBuffer);
    
    // Verificar que el archivo se guardó
    const fileExists = fs.existsSync(filePath);
    const fileStats = fileExists ? fs.statSync(filePath) : null;
    
    console.log('✅ PDF guardado exitosamente:', fileName);
    console.log('📏 Tamaño del archivo guardado:', fileStats?.size, 'bytes');
    
    return NextResponse.json({ 
      success: true, 
      filename: fileName,
      message: 'PDF generado y guardado exitosamente',
      debug: {
        fileExists,
        fileSize: fileStats?.size
      }
    });
    
  } catch (error) {
    console.error('❌ Error al generar y guardar PDF:', error);
    return NextResponse.json(
      { 
        error: 'Error al generar y guardar el PDF',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 