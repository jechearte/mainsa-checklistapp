'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TipoMaquinaSelector from '@/app/components/maquinas/TipoMaquinaSelector';
import ProgressSteps from '@/app/components/ui/ProgressSteps';

// Definición de pasos constante para reutilizar en todas las páginas
export const informeSteps = [
  { number: 1, title: 'Seleccionar tipo de máquina' },
  { number: 2, title: 'Datos de la máquina' },
  { number: 3, title: 'Checklist' },
  { number: 4, title: 'Resumen y confirmación' }
];

export default function NuevoInformePage() {
  const router = useRouter();
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6">
        <div className="bg-gray-50 py-4 px-6 rounded-xl shadow-lg mb-6 border-l-4 border-[#001A3D] border border-[#001A3D]/100">
          <h1 className="text-xl font-bold text-[#001A3D] flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-7 w-7 mr-3" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
              />
            </svg>
            Nuevo informe de mantenimiento
          </h1>
        </div>
        
        <ProgressSteps currentStep={1} steps={informeSteps} />
        
        <div className="py-4">
          <TipoMaquinaSelector />
        </div>
      </div>
    </div>
  );
} 