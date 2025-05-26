'use client';

import { useInformeStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MaquinaForm from '@/app/components/maquinas/MaquinaForm';
import ProgressSteps from '@/app/components/ui/ProgressSteps';
import { informeSteps } from '../page';

export default function DatosMaquinaPage() {
  const router = useRouter();
  const tipoMaquinaId = useInformeStore(state => state.tipoMaquinaId);
  
  useEffect(() => {
    if (!tipoMaquinaId) {
      router.push('/dashboard/nuevo-informe');
    }
  }, [tipoMaquinaId, router]);
  
  if (!tipoMaquinaId) {
    return null;
  }
  
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
        
        <ProgressSteps currentStep={2} steps={informeSteps} />
        
        <div className="py-4">
          <MaquinaForm />
        </div>
      </div>
    </div>
  );
} 