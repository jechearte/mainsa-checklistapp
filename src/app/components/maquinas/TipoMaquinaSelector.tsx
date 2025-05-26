'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInformeStore } from '@/app/lib/store';

interface TipoMaquina {
  nombre: string;
  descripcion: string;
  id: string;
}

export default function TipoMaquinaSelector() {
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Usar directamente el valor del store para inicializar el estado local
  const tipoMaquinaIdStore = useInformeStore(state => state.tipoMaquinaId);
  const setTipoMaquina = useInformeStore(state => state.setTipoMaquina);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(tipoMaquinaIdStore);

  useEffect(() => {
    const fetchTiposMaquina = async () => {
      try {
        const response = await fetch('/api/machine-types');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener los tipos de máquina');
        }
        
        const data = await response.json();
        // Ordenar tipos de máquina alfabéticamente por nombre
        const tiposOrdenados = [...data].sort((a, b) => 
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
        setTiposMaquina(tiposOrdenados);
        
        // Si hay un tipo seleccionado en el store pero no en el estado local, actualizarlo
        if (tipoMaquinaIdStore && !tipoSeleccionado) {
          setTipoSeleccionado(tipoMaquinaIdStore);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al obtener tipos de máquina:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposMaquina();
  }, [tipoMaquinaIdStore, tipoSeleccionado]);

  const handleSeleccionTipo = (id: string) => {
    setTipoSeleccionado(id);
  };

  const handleContinuar = () => {
    if (tipoSeleccionado) {
      // Buscar el nombre del tipo de máquina seleccionado
      const tipoSeleccionadoObj = tiposMaquina.find(tipo => tipo.id === tipoSeleccionado);
      if (tipoSeleccionadoObj) {
        setTipoMaquina(tipoSeleccionado, tipoSeleccionadoObj.nombre);
      } else {
        setTipoMaquina(tipoSeleccionado, ""); // En caso de no encontrar el nombre
      }
      router.push('/dashboard/nuevo-informe/datos-maquina');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#001A3D]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#001A3D] text-white rounded-md hover:bg-opacity-90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-regular text-gray-800 mb-4">Selecciona el tipo de máquina que se va a revisar</h3>
      <div className="flex flex-col space-y-4 max-w-md w-full">
        {tiposMaquina.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => handleSeleccionTipo(tipo.id)}
            className={`py-3 px-4 rounded-lg border transition-all text-left w-full ${
              tipoSeleccionado === tipo.id 
                ? 'bg-[#001A3D] text-white border-[#001A3D]' 
                : 'bg-white text-gray-800 border-gray-800 hover:border-[#001A3D]'
            }`}
          >
            <h3 className={`text-md font-medium ${tipoSeleccionado === tipo.id ? 'text-white' : 'text-gray-800'}`}>
              {tipo.nombre}
            </h3>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-8 w-full max-w-md">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Atrás
        </button>
        
        <button
          type="button"
          onClick={handleContinuar}
          disabled={!tipoSeleccionado}
          className="bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#001A3D] focus:ring-offset-2 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
} 