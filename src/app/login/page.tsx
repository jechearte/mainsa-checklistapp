'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import LoginForm from '../components/auth/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard');
    }
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001A3D] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image 
            src="/logo_mainsa_header.png" 
            alt="Mainsa Logo" 
            width={400} 
            height={110} 
            priority
            className="mx-auto"
          />
          <h2 className="mt-2 text-xl font-medium text-gray-200">
            Aplicación de mantenimiento
          </h2>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
} 