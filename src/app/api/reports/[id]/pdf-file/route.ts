import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Buscar el archivo PDF en la carpeta public/pdfs
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    
    // Buscar archivos que empiecen con el ID del informe
    const files = fs.readdirSync(pdfDir);
    const pdfFile = files.find(file => file.startsWith(`${id}_`) && file.endsWith('.pdf'));
    
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF no encontrado' },
        { status: 404 }
      );
    }
    
    const filePath = path.join(pdfDir, pdfFile);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Archivo PDF no encontrado' },
        { status: 404 }
      );
    }
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Devolver el archivo con headers apropiados
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfFile}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
      },
    });
    
  } catch (error) {
    console.error('Error al servir PDF:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 