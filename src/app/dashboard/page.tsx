'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Sección de bienvenida */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 p-8 rounded-2xl shadow-lg text-white">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenido, {session?.user?.name || 'Usuario'}
            </h1>
            <p className="text-white/80 mt-2 text-lg">
              Aplicación de mantenimiento de máquinas de Mainsa
            </p>
          </div>
        </div>
      </div>

      {/* Sección de acciones */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          ¿Qué deseas hacer hoy?
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/dashboard/nuevo-informe/decision" 
            className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-[#001A3D] text-white p-3 rounded-lg mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <span className="text-lg font-medium text-gray-800">Crear nuevo informe</span>
            <p className="text-gray-600 text-center mt-2 text-sm">
              Iniciar un nuevo informe de mantenimiento para una máquina
            </p>
          </Link>

          <Link 
            href="/dashboard/informes" 
            className="flex flex-col items-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-amber-500 text-white p-3 rounded-lg mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <span className="text-lg font-medium text-gray-800">Ver informes</span>
            <p className="text-gray-600 text-center mt-2 text-sm">
              Consultar historial de informes y estados
            </p>
          </Link>

          <Link 
            href="/dashboard/maquinas" 
            className="flex flex-col items-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            <div className="bg-emerald-600 text-white p-3 rounded-lg mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
              </svg>
            </div>
            <span className="text-lg font-medium text-gray-800">Editar checklists</span>
            <p className="text-gray-600 text-center mt-2 text-sm">
              Editar los items de una checklist
            </p>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-10">
        <p>© 2023 MainsaCheck - Versión 1.0</p>
      </div>
    </div>
  );
} 