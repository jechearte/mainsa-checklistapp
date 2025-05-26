'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerDetalleInforme, getEstadosPosiblesPorTipoMaquina } from '@/app/lib/api';
import { Informe, Maquina, EstadoPosible, ItemChecklist, Grupo } from '@/app/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InformeConDetalles extends Informe {
  detalles: any[];
  maquina: Maquina;
  tipo_maquina: {
    id: string;
    nombre: string;
  };
  checklist: {
    id: string;
    nombre: string;
  };
  grupos: Grupo[];
  items: ItemChecklist[];
}

export default function DetalleInformePage({ params }: { params: { id: string } }) {
  const [informe, setInforme] = useState<InformeConDetalles | null>(null);
  const [estadosPosibles, setEstadosPosibles] = useState<EstadoPosible[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [gruposColapsados, setGruposColapsados] = useState<Record<string, boolean>>({});
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  
  const router = useRouter();
  const { id } = params;
  
  // Función para descargar el PDF del informe
  const descargarPDF = async () => {
    try {
      // Mostrar indicador de carga solo para la descarga
      setDescargandoPDF(true);
      
      console.log('Buscando PDF local para el informe:', id);
      
      // Intentar obtener el PDF desde la carpeta local
      const response = await fetch(`/api/reports/${id}/pdf-file`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('El PDF de este informe no está disponible. Es posible que sea un informe antiguo creado antes de implementar la generación automática de PDFs.');
          return;
        }
        throw new Error('Error al obtener el PDF del informe');
      }
      
      // Obtener el nombre del archivo desde el header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `informe_${id}.pdf`; // Fallback
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches && matches[1]) {
          fileName = matches[1];
        }
      }
      
      // Convertir la respuesta a blob
      const blob = await response.blob();
      
      // Crear un objeto URL para el blob
      const url = URL.createObjectURL(blob);
      
      // Crear un elemento <a> para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar después de la descarga
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('PDF descargado exitosamente:', fileName);
    } catch (err) {
      console.error('Error al descargar el PDF:', err);
      alert('No se pudo descargar el PDF. Por favor, inténtelo de nuevo más tarde.');
    } finally {
      setDescargandoPDF(false);
    }
  };
  
  useEffect(() => {
    const fetchInformeDetalle = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Obtener detalles del informe
        const informeData = await obtenerDetalleInforme(id);
        setInforme(informeData);
        
        // Log para depurar tipo de máquina
        console.log('Tipo de máquina en objeto tipo_maquina:', informeData.tipo_maquina);
        console.log('Tipo de máquina en objeto maquina:', informeData.maquina?.tipo_maquina_nombre);
        
        // Obtener estados posibles para el tipo de máquina
        if (informeData && informeData.tipo_maquina && informeData.tipo_maquina.id) {
          const estadosData = await getEstadosPosiblesPorTipoMaquina(informeData.tipo_maquina.id);
          setEstadosPosibles(estadosData);
          
          // Inicializar estado de grupos colapsados
          const estadoInicial: Record<string, boolean> = {};
          informeData.grupos.forEach(grupo => {
            const itemsGrupo = informeData.items.filter(item => item.grupo_id === grupo.id);
            const detallesGrupo = informeData.detalles.filter(d => 
              itemsGrupo.some(item => item.id === d.item_checklist_id)
            );
            
            const tieneProblemas = detallesGrupo.some(d => {
              const estado = estadosData.find(e => e.id === d.estado_id);
              return estado && estado.nombre.toLowerCase() !== 'bien';
            });
            
            // Colapsar solo los grupos sin problemas
            estadoInicial[grupo.id] = !tieneProblemas;
          });
          
          setGruposColapsados(estadoInicial);
        }
      } catch (err) {
        console.error('Error al cargar el detalle del informe:', err);
        setError('Error al cargar los detalles del informe. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchInformeDetalle();
    }
  }, [id]);
  
  // Función para alternar el estado de colapso de un grupo
  const toggleGrupo = (grupoId: string) => {
    setGruposColapsados(prev => ({
      ...prev,
      [grupoId]: !prev[grupoId]
    }));
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      // Si la fecha viene en formato ISO (YYYY-MM-DDTHH:MM:SSZ)
      if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
        // Extraer directamente los componentes de la fecha del string sin conversiones de timezone
        const parts = dateString.split('T');
        const datePart = parts[0]; // YYYY-MM-DD
        const timePart = parts[1].split(/[Z+]/)[0]; // HH:MM:SS (quitando Z o +timezone)
        
        // Convertir YYYY-MM-DD a DD/MM/YYYY
        const [year, month, day] = datePart.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        
        // Extraer HH:MM del tiempo
        const time = timePart.substring(0, 5); // Solo queremos HH:MM
        
        return `${formattedDate} ${time}`;
      }
      
      // Fallback al método anterior si el formato no es el esperado
      const isoDate = new Date(dateString);
      return format(isoDate, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (e) {
      console.error('Error formateando fecha:', e);
      return dateString;
    }
  };
  
  // Función para obtener el nombre del estado a partir de su ID
  const getNombreEstado = (estadoId: string, detalle?: any) => {
    // Si el detalle ya tiene el nombre del estado, usarlo directamente
    if (detalle && detalle.estado_nombre) {
      return detalle.estado_nombre;
    }
    
    // Fallback al método anterior
    const estado = estadosPosibles.find(e => e.id === estadoId);
    return estado ? estado.nombre : 'Desconocido';
  };
  
  // Función para obtener el color de fondo según el estado
  const getEstadoColor = (estadoId: string, detalle?: any) => {
    // Si el detalle tiene el nombre del estado, usarlo directamente
    if (detalle && detalle.estado_nombre) {
      const nombreEstado = detalle.estado_nombre.toLowerCase();
      
      switch (nombreEstado) {
        case 'bien':
          return 'bg-green-100 text-green-800';
        case 'mal':
          return 'bg-red-100 text-red-800';
        case 'regular':
          return 'bg-yellow-100 text-yellow-800';
        case 'no aplica':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    
    // Fallback al método anterior
    const estado = estadosPosibles.find(e => e.id === estadoId);
    if (!estado) return 'bg-gray-100';
    
    switch (estado.nombre.toLowerCase()) {
      case 'bien':
        return 'bg-green-100 text-green-800';
      case 'mal':
        return 'bg-red-100 text-red-800';
      case 'regular':
        return 'bg-yellow-100 text-yellow-800';
      case 'no aplica':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Contar items con problemas
  const contarItemsConProblemas = () => {
    if (!informe || !informe.detalles) return 0;
    
    return informe.detalles.filter(d => {
      // Si el detalle ya tiene el nombre del estado, usarlo directamente
      if (d.estado_nombre) {
        return d.estado_nombre.toLowerCase() !== 'bien';
      }
      
      // Fallback al método anterior
      const estado = estadosPosibles.find(e => e.id === d.estado_id);
      return estado && estado.nombre.toLowerCase() !== 'bien';
    }).length;
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#001A3D] mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">Cargando detalles del informe...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  if (!informe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800">No se encontró el informe solicitado</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 bg-[#001A3D] text-white py-2 px-4 rounded"
        >
          Volver
        </button>
      </div>
    );
  }
  
  const itemsConProblemas = contarItemsConProblemas();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#001A3D]">Detalle del informe</h1>
        <div className="flex space-x-3">
          <button
            onClick={descargarPDF}
            disabled={descargandoPDF}
            className="bg-[#001A3D] hover:bg-[#00295e] text-white font-semibold py-2 px-4 rounded flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {descargandoPDF ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Descargando...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </>
            )}
          </button>
        <button
          onClick={() => router.push('/dashboard/informes')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Volver a la lista
        </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        {/* Información básica del informe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium text-gray-700">Fecha de creación</h3>
            <p>{formatDate(informe.fecha_creacion)}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Aviso de llamada</h3>
            <p>{informe.aviso_llamada || 'No disponible'}</p>
          </div>
        </div>
        
        {/* Tipo de máquina */}
        <div>
          <h3 className="font-medium text-gray-700">Tipo de máquina</h3>
          <p>
            {informe.maquina && informe.maquina.tipo_maquina_nombre 
              ? informe.maquina.tipo_maquina_nombre 
              : (informe.tipo_maquina 
                 ? (typeof informe.tipo_maquina === 'string' 
                    ? informe.tipo_maquina 
                    : (informe.tipo_maquina.nombre || 'No disponible')) 
                 : 'No disponible')}
          </p>
        </div>
        
        {/* Datos de la máquina */}
        <div>
          <h3 className="font-medium text-gray-700">Datos de la máquina</h3>
          {informe.maquina && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p><span className="font-medium">Cliente:</span> {informe.maquina.cliente}</p>
                <p><span className="font-medium">Zona:</span> {informe.maquina.zona}</p>
                <p><span className="font-medium">Número de bastidor:</span> {informe.maquina.numero_bastidor}</p>
                <p><span className="font-medium">Número de fabricación:</span> {informe.maquina.numero_fabricacion}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p><span className="font-medium">Matrícula:</span> {informe.maquina.numero_matricula}</p>
                <p><span className="font-medium">Flota:</span> {informe.maquina.numero_flota}</p>
                <p><span className="font-medium">Horas:</span> {informe.maquina.numero_horas?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</p>
                <p><span className="font-medium">Kilómetros:</span> {informe.maquina.numero_kilometros?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</p>
                <p><span className="font-medium">Capacidad:</span> {informe.maquina.capacidad}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Estado general */}
        <div>
          <h3 className="font-medium text-gray-700">Estado general</h3>
          <div className="mt-2 flex items-center">
            {itemsConProblemas > 0 ? (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {itemsConProblemas} {itemsConProblemas === 1 ? 'problema encontrado' : 'problemas encontrados'}
              </div>
            ) : (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Sin problemas
              </div>
            )}
          </div>
        </div>
        
        {/* Comentarios generales */}
        {informe.comentarios && (
          <div>
            <h3 className="font-medium text-gray-700">Comentarios generales</h3>
            <p className="mt-1 text-gray-600">{informe.comentarios}</p>
          </div>
        )}
        
        {/* Lista de items del checklist agrupados */}
        <div className="mt-8">
          
          <div className="border rounded-md divide-y">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#001A3D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-medium text-gray-800">Detalles del checklist</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const todosGruposColapsados = informe.grupos.reduce((acc, grupo) => {
                      acc[grupo.id] = true;
                      return acc;
                    }, {} as Record<string, boolean>);
                    setGruposColapsados(todosGruposColapsados);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Colapsar todos
                </button>
                <button 
                  type="button" 
                  onClick={() => setGruposColapsados({})}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Expandir todos
                </button>
              </div>
            </div>
          
            {informe.grupos && informe.grupos.map(grupo => {
              // Filtrar items para este grupo
              const itemsGrupo = informe.items?.filter(item => item.grupo_id === grupo.id) || [];
              
              // Filtrar detalles para los items de este grupo
              const detallesGrupo = informe.detalles?.filter(d => {
                // Verificar si d.item_id o d.item_checklist_id existen y coinciden
                const matchesItem = itemsGrupo.some(item => {
                  const matches = item.id === d.item_id || item.id === d.item_checklist_id;
                  return matches;
                });
                return matchesItem;
              }) || [];
              
              // Si no hay items o detalles en este grupo, no lo mostramos
              if (itemsGrupo.length === 0 || detallesGrupo.length === 0) return null;
              
              // Verificar si hay problemas en este grupo
              const hayProblemas = detallesGrupo.some(d => {
                // Si el detalle ya tiene el nombre del estado, usarlo directamente
                if (d.estado_nombre) {
                  return d.estado_nombre.toLowerCase() !== 'bien';
                }
                
                // Fallback al método anterior
                const estado = estadosPosibles.find(e => e.id === d.estado_id);
                return estado && estado.nombre.toLowerCase() !== 'bien';
              });
              
              // Verificar si el grupo está colapsado
              const estaColapsado = gruposColapsados[grupo.id] || false;
              
              return (
                <div key={grupo.id} className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer rounded-md py-2 px-1 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => toggleGrupo(grupo.id)}
                  >
                    <div className="flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 mr-2 transition-transform duration-200 ${estaColapsado ? '' : 'transform rotate-90'}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h4 className="font-medium">{grupo.nombre}</h4>
                    </div>
                    {hayProblemas ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
                        Con problemas
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        OK
                      </span>
                    )}
                  </div>
                  
                  {!estaColapsado && (
                    <div className="mt-4 space-y-3 pl-7">
                      {itemsGrupo.map(item => {
                        const detalle = detallesGrupo.find(d => d.item_checklist_id === item.id || d.item_id === item.id);
                        if (!detalle) return null;
                        
                        const estadoId = detalle.estado_id;
                        const estadoNombre = getNombreEstado(estadoId, detalle);
                        const estadoColor = getEstadoColor(estadoId, detalle);
                        const esProblema = estadoNombre.toLowerCase() !== 'bien';
                        
                        return (
                          <div key={item.id} className="flex items-start">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                              esProblema ? 'bg-yellow-500' : 'bg-green-500'
                            } mr-2 mt-1`}></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.nombre}</p>
                              <div className="flex items-center mt-1">
                                <p className="text-sm text-gray-600 mr-2">Estado:</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor}`}>{estadoNombre}</span>
                              </div>
                              {item.descripcion && (
                                <p className="text-sm text-gray-500 mt-1">{item.descripcion}</p>
                              )}
                              {esProblema && (
                                <div className="mt-2 space-y-2">
                                  {detalle.observaciones_internas && (
                                    <div className="bg-red-50 p-2 rounded-md border border-red-100">
                                      <p className="text-sm text-red-700">
                                        <span className="font-medium">Observación interna:</span> {detalle.observaciones_internas}
                                      </p>
                                    </div>
                                  )}
                                  {detalle.observaciones_cliente && (
                                    <div className="bg-blue-50 p-2 rounded-md border border-blue-100">
                                      <p className="text-sm text-blue-700">
                                        <span className="font-medium">Observación para el cliente:</span> {detalle.observaciones_cliente}
                                      </p>
                                    </div>
                                  )}
                                  {/* Para compatibilidad con informes antiguos */}
                                  {detalle.observaciones && !detalle.observaciones_internas && !detalle.observaciones_cliente && (
                                    <div className="bg-red-50 p-2 rounded-md border border-red-100">
                                  <p className="text-sm text-red-700">
                                    <span className="font-medium">Observación:</span> {detalle.observaciones}
                                  </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 