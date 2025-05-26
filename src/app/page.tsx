'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from "next/image";

export default function HomePage() {
  const { status } = useSession();
  
  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard');
    } else if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);
  
  // Pantalla de carga mientras se determina el estado de autenticación
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">Cargando...</h2>
      </div>
    </div>
  );
}
