'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInformeStore } from '@/app/lib/store';
import Link from 'next/link';

export default function ConfirmacionPage() {
  const router = useRouter();
  const resetForm = useInformeStore(state => state.resetForm);
  
  useEffect(() => {
    // Limpiar el formulario después de mostrar la confirmación
    return () => {
      resetForm();
    };
  }, [resetForm]);

  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ¡Informe guardado con éxito!
          </h1>
          
          <p className="text-gray-600 mb-8">
            El informe de mantenimiento ha sido registrado correctamente en el sistema.
          </p>

          <div className="flex flex-col items-center space-y-4">
            <Link 
              href="/dashboard/nuevo-informe/decision"
              className="inline-flex bg-[#001A3D] text-white py-2 px-6 rounded hover:bg-opacity-90 transition duration-200"
            >
              Crear nuevo informe
            </Link>
            
            <Link 
              href="/dashboard"
              className="inline-flex bg-gray-100 text-gray-700 py-2 px-6 rounded hover:bg-gray-200 transition duration-200"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 