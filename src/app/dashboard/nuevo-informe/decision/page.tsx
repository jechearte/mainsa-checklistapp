'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInformeStore } from '@/app/lib/store';

export default function DecisionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    tipoMaquinaId, 
    maquinaId, 
    items,
    checklistCompleto,
    resetForm
  } = useInformeStore();
  
  // Verificar si hay un informe en progreso
  useEffect(() => {
    const hayInformePendiente = 
      tipoMaquinaId !== null && 
      (maquinaId !== null || items.length > 0);
    
    // Si no hay ningún informe en progreso, redirige directamente a nuevo-informe
    if (!hayInformePendiente) {
      router.push('/dashboard/nuevo-informe');
    } else {
      setIsLoading(false);
    }
  }, [tipoMaquinaId, maquinaId, items, router]);
  
  // Continuar con el informe existente
  const handleContinuar = () => {
    if (maquinaId && checklistCompleto) {
      // Si el checklist está marcado como completo, ir directamente a la página de resumen
      console.log('Checklist completo, redirigiendo a resumen');
      router.push('/dashboard/nuevo-informe/resumen');
    } else if (maquinaId) {
      // Si seleccionó la máquina pero el checklist no está completo, ir a checklist
      console.log('Checklist incompleto, redirigiendo a checklist');
      router.push('/dashboard/nuevo-informe/checklist');
    } else if (tipoMaquinaId) {
      // Si solo seleccionó el tipo de máquina, ir a datos de máquina
      router.push('/dashboard/nuevo-informe/datos-maquina');
    }
  };
  
  // Crear un nuevo informe (resetear el formulario)
  const handleNuevoInforme = () => {
    resetForm();
    router.push('/dashboard/nuevo-informe');
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#001A3D] mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold">Cargando...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="p-4">
          <div className="text-center mb-2">
            <div className="bg-yellow-100 w-12 h-12 rounded-full inline-flex items-center justify-center mb-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-yellow-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Informe en progreso
            </h1>
            <p className="text-gray-600 text-sm">
              Hemos detectado que tienes un informe que no has finalizado.
              ¿Qué deseas hacer?
            </p>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={handleContinuar}
              className="w-full bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none flex items-center justify-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Continuar con el informe existente
            </button>
            
            <button
              onClick={handleNuevoInforme}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none flex items-center justify-center"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              Crear un nuevo informe
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-gray-500 py-2 px-4 rounded-md hover:bg-gray-100 focus:outline-none text-sm"
            >
              Volver al dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
