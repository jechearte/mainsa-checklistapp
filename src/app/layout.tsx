import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MainsaCheck - Sistema de mantenimiento',
  description: 'Aplicación para gestionar los checklist de mantenimiento de maquinaria industrial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
