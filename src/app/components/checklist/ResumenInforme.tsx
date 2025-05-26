'use client';

import { useState, useEffect } from 'react';
import { useInformeStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';
import { 
  ItemRespuesta,
  TipoMaquina,
  Maquina,
  EstadoPosible,
  ItemChecklist,
  Grupo
} from '@/app/lib/types';
import { 
  getMaquina,
  getEstadosPosiblesPorTipoMaquina,
  getGruposPorChecklist,
  getItemsPorGrupo,
  guardarInforme
} from '@/app/lib/api';

export default function ResumenInforme() {
  const [tipoMaquina, setTipoMaquina] = useState<TipoMaquina | null>(null);
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [estadosPosibles, setEstadosPosibles] = useState<EstadoPosible[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [itemsChecklist, setItemsChecklist] = useState<ItemChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [gruposColapsados, setGruposColapsados] = useState<Record<string, boolean>>({});
  
  const router = useRouter();
  const { 
    tipoMaquinaId, 
    tipoMaquinaNombre,
    maquinaId, 
    checklistId,
    avisoLlamada,
    items: respuestas, 
    comentarios,
    getFormulario
  } = useInformeStore();
  
  useEffect(() => {
    if (!tipoMaquinaId || !maquinaId) {
      router.push('/dashboard/nuevo-informe');
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Usar el nombre del tipo de máquina desde el store si está disponible
        if (tipoMaquinaNombre) {
          setTipoMaquina({
            id: tipoMaquinaId,
            nombre: tipoMaquinaNombre,
            descripcion: '' // No necesitamos la descripción para el resumen
          });
        }
        
        // Obtener información de la máquina (esto sí lo necesitamos del backend)
        const maquinaData = await getMaquina(maquinaId);
        setMaquina(maquinaData);
        
        // Obtener estados posibles (necesario para mostrar nombres de estados)
        const estadosData = await getEstadosPosiblesPorTipoMaquina(tipoMaquinaId);
        setEstadosPosibles(estadosData);
        
        // Si tenemos el ID del checklist en el store, lo usamos
        if (checklistId) {
        // Obtener grupos del checklist
          const gruposData = await getGruposPorChecklist(checklistId);
        const gruposOrdenados = gruposData.sort((a, b) => a.orden - b.orden);
        setGrupos(gruposOrdenados);
        
        // Obtener items de todos los grupos
        const itemsPromises = gruposOrdenados.map(grupo => getItemsPorGrupo(grupo.id));
        const itemsResults = await Promise.all(itemsPromises);
        const todosLosItems = itemsResults.flat();
        setItemsChecklist(todosLosItems);
        }
        
      } catch (err) {
        console.error('Error al cargar datos para el resumen:', err);
        setError('Error al cargar los datos del resumen. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [tipoMaquinaId, tipoMaquinaNombre, maquinaId, checklistId, router]);
  
  // Efecto para inicializar estado de grupos colapsados
  useEffect(() => {
    if (grupos.length > 0 && estadosPosibles.length > 0 && itemsChecklist.length > 0) {
      // Inicializar el estado colapsado basado en si tienen problemas
      const estadoInicial: Record<string, boolean> = {};
      
      grupos.forEach(grupo => {
        const itemsGrupo = itemsChecklist.filter(item => item.grupo_id === grupo.id);
        const respuestasGrupo = respuestas.filter(r => 
          itemsGrupo.some(item => item.id === r.item_id)
        );
        
        const tieneProblemas = respuestasGrupo.some(r => {
          const estado = estadosPosibles.find(e => e.id === r.estado_id);
          return estado && estado.nombre.toLowerCase() !== 'bien';
        });
        
        // Colapsar solo los grupos sin problemas
        estadoInicial[grupo.id] = !tieneProblemas;
      });
      
      setGruposColapsados(estadoInicial);
    }
  }, [grupos, itemsChecklist, estadosPosibles, respuestas]);
  
  const handleGuardarInforme = async () => {
    try {
      setIsSaving(true);
      setSaveError('');
      
      const formulario = getFormulario();
      console.log('Enviando formulario al servidor:', formulario);
      
      // Verificar que se han respondido todos los items obligatorios
      const itemsObligatorios = itemsChecklist.filter(item => item.obligatorio);
      const itemsObligatoriosRespondidos = itemsObligatorios.every(item => 
        respuestas.some(r => r.item_id === item.id && r.estado_id)
      );
      
      if (!itemsObligatoriosRespondidos) {
        setSaveError('No se han completado todos los items obligatorios del checklist.');
        return;
      }
      
      // Paso 1: Guardar el informe
      const resultado = await guardarInforme(formulario as any);
      console.log('Informe guardado con éxito, ID:', resultado.id);
      
      // Paso 2: Generar y guardar el PDF
      console.log('Generando PDF para el informe:', resultado.id);
      try {
        const pdfResponse = await fetch(`/api/reports/${resultado.id}/generate-pdf`, {
          method: 'POST',
        });
        
        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json();
          console.log('PDF generado y guardado:', pdfResult.filename);
        } else {
          console.warn('No se pudo generar el PDF, pero el informe se guardó correctamente');
        }
      } catch (pdfError) {
        console.warn('Error al generar PDF:', pdfError);
        // No interrumpir el flujo si falla la generación del PDF
      }
      
      // Redireccionar a la página de confirmación
      router.push('/dashboard/nuevo-informe/confirmacion');
      
    } catch (err) {
      console.error('Error al guardar informe:', err);
      setSaveError('Error al guardar el informe. Por favor, inténtalo más tarde.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Función para alternar el estado de colapso de un grupo
  const toggleGrupo = (grupoId: string) => {
    setGruposColapsados(prev => ({
      ...prev,
      [grupoId]: !prev[grupoId]
    }));
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">Preparando resumen...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
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
    );
  }
  
  // Contar items con problemas
  const itemsConProblemas = respuestas.filter(r => {
    const estado = estadosPosibles.find(e => e.id === r.estado_id);
    return estado && estado.nombre.toLowerCase() !== 'bien';
  });
  
  return (
    <div className="space-y-6">
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{saveError}</p>
        </div>
      )}
      
      <div className="bg-gray-50 p-4 rounded-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Resumen del informe
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Tipo de máquina</h3>
            <p>{tipoMaquina?.nombre}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Datos de la máquina</h3>
            {maquina && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p><span className="font-medium">Cliente:</span> {maquina.cliente}</p>
                  <p><span className="font-medium">Zona:</span> {maquina.zona}</p>
                  <p><span className="font-medium">Número de bastidor:</span> {maquina.numero_bastidor}</p>
                  <p><span className="font-medium">Número de fabricación:</span> {maquina.numero_fabricacion}</p>
                  <p><span className="font-medium">Aviso/Llamada:</span> {avisoLlamada}</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p><span className="font-medium">Matrícula:</span> {maquina.numero_matricula}</p>
                  <p><span className="font-medium">Flota:</span> {maquina.numero_flota}</p>
                  <p><span className="font-medium">Horas:</span> {maquina.numero_horas?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</p>
                  <p><span className="font-medium">Kilómetros:</span> {maquina.numero_kilometros?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</p>
                  <p><span className="font-medium">Capacidad:</span> {maquina.capacidad}</p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Estado general</h3>
            <div className="mt-2 flex items-center">
              {itemsConProblemas.length > 0 ? (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  {itemsConProblemas.length} {itemsConProblemas.length === 1 ? 'problema encontrado' : 'problemas encontrados'}
                </div>
              ) : (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Sin problemas
                </div>
              )}
            </div>
          </div>
          
          {comentarios && (
            <div>
              <h3 className="font-medium text-gray-700">Comentarios generales</h3>
              <p className="mt-1 text-gray-600">{comentarios}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="border rounded-md divide-y">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Detalles del checklist</h3>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => {
                const todosGruposColapsados = grupos.reduce((acc, grupo) => {
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
        
        {grupos.map((grupo) => {
          // Filtrar items del grupo actual
          const itemsGrupo = itemsChecklist.filter(item => item.grupo_id === grupo.id);
          
          // Filtrar respuestas de los items del grupo
          const respuestasGrupo = respuestas.filter(r => 
            itemsGrupo.some(item => item.id === r.item_id)
          );
          
          // Verificar si hay problemas en este grupo
          const problemasEnGrupo = respuestasGrupo.some(r => {
            const estado = estadosPosibles.find(e => e.id === r.estado_id);
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
                {problemasEnGrupo ? (
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
                  {itemsGrupo.map((item) => {
                    const respuestaItem = respuestas.find(r => r.item_id === item.id);
                    const estado = respuestaItem 
                      ? estadosPosibles.find(e => e.id === respuestaItem.estado_id)
                      : null;
                    
                    const esProblema = estado && estado.nombre.toLowerCase() !== 'bien';
                    
                    if (!respuestaItem) return null;
                    
                    return (
                      <div key={item.id} className="flex items-start">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                          esProblema ? 'bg-yellow-500' : 'bg-green-500'
                        } mr-2 mt-0.5`}></div>
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          <p className="text-sm text-gray-600">Estado: {estado?.nombre || 'No completado'}</p>
                          {esProblema && (
                            <div className="mt-1 space-y-1">
                              {respuestaItem.observaciones_internas && (
                                <p className="text-sm text-red-600">
                                  Observación interna: {respuestaItem.observaciones_internas}
                                </p>
                              )}
                              {respuestaItem.observaciones_cliente && (
                                <p className="text-sm text-blue-600">
                                  Observación para cliente: {respuestaItem.observaciones_cliente}
                            </p>
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
      
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/nuevo-informe/checklist')}
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Volver al checklist
        </button>
        
        <button
          type="button"
          onClick={handleGuardarInforme}
          disabled={isSaving}
          className="bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#001A3D] focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar informe'}
        </button>
      </div>
    </div>
  );
} 