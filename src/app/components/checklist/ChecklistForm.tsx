'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInformeStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';
import { 
  getChecklistPorTipoMaquina,
  getGruposPorChecklist,
  getEstadosPosiblesPorTipoMaquina
} from '@/app/lib/api';
import { Checklist, Grupo, EstadoPosible } from '@/app/lib/types';
import GrupoChecklist from './GrupoChecklist';

export default function ChecklistForm() {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estadosPosibles, setEstadosPosibles] = useState<EstadoPosible[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentGrupoIndex, setCurrentGrupoIndex] = useState(0);
  const [comentarios, setComentarios] = useState('');
  const [grupoValido, setGrupoValido] = useState(true);
  const [mostrarErrorValidacion, setMostrarErrorValidacion] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const router = useRouter();
  const tipoMaquinaId = useInformeStore(state => state.tipoMaquinaId);
  const maquinaId = useInformeStore(state => state.maquinaId);
  const { 
    setComentarios: setStoreComentarios, 
    setChecklistCompleto,
    setChecklistId
  } = useInformeStore();
  
  useEffect(() => {
    if (!tipoMaquinaId || !maquinaId) {
      router.push('/dashboard/nuevo-informe');
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Obtener checklist activo para el tipo de máquina
        const checklistData = await getChecklistPorTipoMaquina(tipoMaquinaId);
        
        if (!checklistData || !checklistData.id) {
          throw new Error('No se pudo obtener el ID del checklist');
        }
        
        setChecklist(checklistData);
        // Guardar el ID del checklist en el store
        setChecklistId(checklistData.id);
        
        // Obtener grupos del checklist usando el ID que acabamos de obtener
        const gruposData = await getGruposPorChecklist(checklistData.id);
        setGrupos(gruposData.sort((a, b) => a.orden - b.orden));
        
        // Obtener estados posibles
        const estadosData = await getEstadosPosiblesPorTipoMaquina(tipoMaquinaId);
        setEstadosPosibles(estadosData);
        
      } catch (err) {
        console.error('Error al cargar datos del checklist:', err);
        setError('Error al cargar los datos del checklist. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [tipoMaquinaId, maquinaId, router, setChecklistId]);
  
  // Resetear el mensaje de error de validación cuando cambiamos de grupo
  useEffect(() => {
    setMostrarErrorValidacion(false);
  }, [currentGrupoIndex]);
  
  const handleGrupoValidationChange = (isValid: boolean) => {
    setGrupoValido(isValid);
    // Si el grupo se vuelve válido, ocultamos el mensaje de error
    if (isValid) {
      setMostrarErrorValidacion(false);
    }
  };

  // Navegación al siguiente grupo
  const goToNextGroup = useCallback(() => {
    if (currentGrupoIndex < grupos.length - 1) {
      setCurrentGrupoIndex(prev => prev + 1);
    }
  }, [currentGrupoIndex, grupos.length]);

  // Navegación al grupo anterior
  const goToPreviousGroup = useCallback(() => {
    if (currentGrupoIndex > 0) {
      setCurrentGrupoIndex(prev => prev - 1);
    }
  }, [currentGrupoIndex]);

  // Navegación a la página de resumen
  const goToResumenPage = useCallback(() => {
    if (isNavigating) return; // Evitar navegación múltiple
    
    try {
      setIsNavigating(true);
      // Guardar comentarios en el store
      setStoreComentarios(comentarios);
      // Marcar el checklist como completo
      setChecklistCompleto(true);
      console.log('Marcando checklist como completo y navegando a la página de resumen...');
      
      // Navegación directa
      window.location.href = '/dashboard/nuevo-informe/resumen';
      
      // Añadir un temporizador de seguridad para resetear isNavigating si algo sale mal
      const timeoutId = setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
      
      // Limpiar el temporizador si el componente se desmonta
      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error('Error al navegar:', err);
      setIsNavigating(false);
    }
  }, [comentarios, setStoreComentarios, setChecklistCompleto, isNavigating]);

  // Navegación a la página anterior
  const goBack = useCallback(() => {
    if (isNavigating) return; // Evitar navegación múltiple
    
    try {
      setIsNavigating(true);
      console.log('Navegando a la página de datos de máquina...');
      
      // Usar navegación directa con window.location.href en lugar de router.push
      window.location.href = '/dashboard/nuevo-informe/datos-maquina';
      
      // Añadir un temporizador de seguridad para resetear isNavigating si algo sale mal
      const timeoutId = setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
      
      // Limpiar el temporizador si el componente se desmonta
      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error('Error al navegar:', err);
      setIsNavigating(false);
    }
  }, [isNavigating]);
  
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar si el grupo actual es válido antes de permitir la navegación
    if (!grupoValido) {
      setMostrarErrorValidacion(true);
      // Scroll al inicio para asegurar que el usuario ve el mensaje de error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Si es válido, procedemos con la navegación
    if (currentGrupoIndex < grupos.length - 1) {
      goToNextGroup();
    } else {
      goToResumenPage();
    }
  };
  
  const handlePrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentGrupoIndex > 0) {
      goToPreviousGroup();
    } else {
      goBack();
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#001A3D] mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">Cargando checklist...</h2>
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
  
  if (!checklist || grupos.length === 0 || estadosPosibles.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
        <h3 className="text-lg font-medium">Información no disponible</h3>
        <p>No se encontró un checklist válido para este tipo de máquina. Contacta con el administrador.</p>
        <button
          onClick={() => router.push('/dashboard/nuevo-informe')}
          className="mt-2 bg-[#001A3D]/10 hover:bg-[#001A3D]/20 text-[#001A3D] font-semibold py-2 px-4 rounded"
        >
          Volver a selección de tipo
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {mostrarErrorValidacion && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-md">
          <p className="font-medium">Revisa bien la lista, puede que te falte algún item por revisar o que hayas dejado algún apartado de observaciones vacío.</p>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4 bg-white p-3 border rounded-md shadow-sm">
        <button
          type="button"
          onClick={goToPreviousGroup}
          disabled={currentGrupoIndex === 0 || isNavigating}
          className={`p-2 rounded-full ${
            currentGrupoIndex === 0 || isNavigating
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-[#001A3D] hover:bg-[#001A3D]/5'
          }`}
          aria-label="Grupo anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-md mr-2">
            {currentGrupoIndex + 1}/{grupos.length}
          </span>
          <h3 className="text-lg font-medium text-gray-800 inline">
            {grupos[currentGrupoIndex]?.nombre || 'Grupo'}
          </h3>
        </div>
        
        <button
          type="button"
          onClick={goToNextGroup}
          disabled={currentGrupoIndex === grupos.length - 1 || isNavigating}
          className={`p-2 rounded-full ${
            currentGrupoIndex === grupos.length - 1 || isNavigating
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-[#001A3D] hover:bg-[#001A3D]/5'
          }`}
          aria-label="Grupo siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {grupos.length > 0 && (
        <GrupoChecklist
          grupo={grupos[currentGrupoIndex]}
          estadosPosibles={estadosPosibles}
          onValidationChange={handleGrupoValidationChange}
        />
      )}
      
      {currentGrupoIndex === grupos.length - 1 && (
        <div className="mt-6">
          <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 mb-1">
            Comentarios generales
          </label>
          <textarea
            id="comentarios"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#001A3D] focus:border-[#001A3D]"
            placeholder="Introduce aquí cualquier comentario general sobre la inspección"
          ></textarea>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isNavigating}
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentGrupoIndex === 0 ? 'Volver a datos de máquina' : 'Grupo anterior'}
        </button>
        
        <div className="text-gray-600">
          Grupo {currentGrupoIndex + 1} de {grupos.length}
        </div>
        
        <button
          type="button"
          onClick={handleNext}
          disabled={isNavigating || !grupoValido}
          className="bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#001A3D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentGrupoIndex === grupos.length - 1 ? 'Ir al resumen' : 'Siguiente grupo'}
        </button>
      </div>
    </div>
  );
}