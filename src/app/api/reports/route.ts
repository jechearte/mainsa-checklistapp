import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FormularioInforme, Checklist } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    // Verificar la sesión del usuario
    const session = await getServerSession(authOptions);
    
    console.log('Sesión actual en POST /api/reports:', {
      user: session?.user,
      hasAccessToken: !!session?.accessToken,
    });
    
    // Verificar que tenemos un token de acceso y el ID del usuario
    if (!session?.accessToken) {
      console.error('No hay token de acceso en la sesión:', session);
      return NextResponse.json({ error: 'No autorizado - Token no encontrado' }, { status: 401 });
    }

    if (!session?.user?.id) {
      console.error('No se encontró el ID del usuario en la sesión:', session?.user);
      return NextResponse.json({ error: 'No autorizado - ID de usuario no encontrado' }, { status: 401 });
    }
    
    // Obtener datos del formulario
    const formulario: FormularioInforme = await request.json();
    console.log('Datos recibidos para crear informe:', formulario);
    
    // Verificar que los datos necesarios están presentes
    if (!formulario.maquina_id || !formulario.tipo_maquina_id || !formulario.items || formulario.items.length === 0) {
      console.error('Datos incompletos para crear informe:', formulario);
      return NextResponse.json({ error: 'Datos incompletos para crear informe' }, { status: 400 });
    }
    
    // URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Primero, obtener el checklist para el tipo de máquina
    const checklistUrl = `${apiUrl}/api/checklists/by-machine-type/${formulario.tipo_maquina_id}/`;
    
    console.log('Obteniendo checklist para el tipo de máquina:', formulario.tipo_maquina_id);
    
    const checklistResponse = await fetch(checklistUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!checklistResponse.ok) {
      console.error('Error al obtener checklist:', {
        status: checklistResponse.status,
        statusText: checklistResponse.statusText,
        url: checklistUrl
      });
      return NextResponse.json({ error: 'Error al obtener el checklist' }, { status: 500 });
    }
    
    const checklistData = await checklistResponse.json();
    let checklistId: string;
    
    // La respuesta puede ser un array o un objeto único
    if (Array.isArray(checklistData)) {
      // Buscar el checklist activo, o tomar el primero si no hay ninguno activo
      const checklistActivo = checklistData.find((c: Checklist) => c.activo) || checklistData[0];
      checklistId = checklistActivo.id;
    } else {
      checklistId = checklistData.id;
    }
    
    console.log('Checklist ID obtenido:', checklistId);
    
    // Crear el objeto de informe con el formato esperado por la API
    const informeData = {
      maquina_id: formulario.maquina_id,
      usuario_id: session.user.id,
      checklist_id: checklistId,
      comentarios: formulario.comentarios || ""
    };
    
    // Log detallado del objeto informeData y la sesión del usuario
    console.log('Datos de la sesión del usuario:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    });
    console.log('Objeto informeData completo:', JSON.stringify(informeData, null, 2));
    
    // URL de la API para crear informes
    const createReportUrl = `${apiUrl}/api/reports/`;
    
    console.log('Enviando petición para crear informe a:', createReportUrl);
    console.log('Datos del informe:', informeData);
    
    // Hacer la petición para crear el informe
    const reportResponse = await fetch(createReportUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(informeData)
    });
    
    if (!reportResponse.ok) {
      const errorData = await reportResponse.json().catch(() => null);
      console.error('Error al crear informe:', {
        status: reportResponse.status,
        statusText: reportResponse.statusText,
        url: createReportUrl,
        errorData
      });
      throw new Error(`Error al crear informe: ${reportResponse.status}`);
    }
    
    // Obtener la respuesta con el ID del informe creado
    const reportResult = await reportResponse.json();
    const informeId = reportResult.id;
    
    console.log('Informe creado con éxito, ID:', informeId);
    
    // Usar el nuevo endpoint batch para crear todos los detalles en una sola llamada
    const createDetailsBatchUrl = `${apiUrl}/api/reports/details/batch/`;
    console.log('Creando detalles del informe en batch...');
    
    // Preparar los datos para la petición batch
    const batchData = {
        informe_id: informeId,
      detalles: formulario.items.map(item => ({
        item_checklist_id: item.item_id,
        estado_id: item.estado_id,
        observaciones_internas: item.observaciones_internas || "",
        observaciones_cliente: item.observaciones_cliente || ""
      }))
    };
    
    // Hacer la petición batch para crear todos los detalles
    const batchResponse = await fetch(createDetailsBatchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      body: JSON.stringify(batchData)
      });
      
    if (!batchResponse.ok) {
      const errorData = await batchResponse.json().catch(() => null);
      console.error('Error al crear detalles del informe en batch:', {
        status: batchResponse.status,
        statusText: batchResponse.statusText,
        url: createDetailsBatchUrl,
          errorData
        });
      return NextResponse.json(
        { error: 'Error al crear detalles del informe' },
        { status: batchResponse.status }
      );
      }
    
    // Obtener el resultado de la operación batch
    const batchResult = await batchResponse.json();
    
    console.log('Detalles creados en batch:', {
      total: formulario.items.length,
      resultado: batchResult
    });
    
    // Devolver la respuesta con el ID del informe
    return NextResponse.json({
      id: informeId,
      detalles: {
        total: formulario.items.length,
        procesados: batchResult.procesados || batchResult.count || formulario.items.length
      }
    });
    
  } catch (error) {
    console.error('Error en POST /api/reports:', error);
    return NextResponse.json(
      { error: 'Error al guardar el informe' },
      { status: 500 }
    );
  }
} 