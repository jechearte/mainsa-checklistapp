'use client';

import { useState, useEffect } from 'react';
import { useInformeStore } from '@/app/lib/store';
import { getMaquinasPorTipo } from '@/app/lib/api';
import { Maquina } from '@/app/lib/types';
import { useRouter } from 'next/navigation';

export default function MaquinaForm() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const tipoMaquinaId = useInformeStore(state => state.tipoMaquinaId);
  const maquinaIdStore = useInformeStore(state => state.maquinaId);
  const avisoLlamadaStore = useInformeStore(state => state.avisoLlamada);
  const setMaquinaId = useInformeStore(state => state.setMaquinaId);
  const setAvisoLlamada = useInformeStore(state => state.setAvisoLlamada);
  
  // Inicializar con los valores del store
  const [selectedMaquina, setSelectedMaquina] = useState<string>(maquinaIdStore || '');
  const [avisoLlamada, setAvisoLlamadaLocal] = useState<string>(avisoLlamadaStore || '');
  
  useEffect(() => {
    if (!tipoMaquinaId) {
      router.push('/dashboard/nuevo-informe');
      return;
    }
    
    const fetchMaquinas = async () => {
      try {
        setIsLoading(true);
        const data = await getMaquinasPorTipo(tipoMaquinaId);
        setMaquinas(data);
        
        // Si hay una máquina guardada en el store pero no está seleccionada actualmente
        if (maquinaIdStore && !selectedMaquina) {
          setSelectedMaquina(maquinaIdStore);
        }
      } catch (err) {
        console.error('Error al cargar máquinas:', err);
        setError('Error al cargar las máquinas. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMaquinas();
  }, [tipoMaquinaId, router, maquinaIdStore, selectedMaquina]);
  
  const handleSelectMaquina = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMaquina(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaquina && avisoLlamada.trim()) {
      setMaquinaId(selectedMaquina);
      setAvisoLlamada(avisoLlamada.trim());
      router.push('/dashboard/nuevo-informe/checklist');
    }
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold">Cargando máquinas...</h2>
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
  
  if (maquinas.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
        <h3 className="text-lg font-medium">Sin máquinas disponibles</h3>
        <p>No hay máquinas disponibles para este tipo. Contacta con el administrador.</p>
        <button
          onClick={() => router.push('/dashboard/nuevo-informe')}
          className="mt-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-4 rounded"
        >
          Volver a selección de tipo
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="maquina" className="block text-sm font-medium text-gray-700 mb-1">
          Selecciona la máquina
        </label>
        <select
          id="maquina"
          value={selectedMaquina}
          onChange={handleSelectMaquina}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#001A3D] focus:border-[#001A3D]"
          required
        >
          <option value="">Selecciona una máquina</option>
          {maquinas.map((maquina) => (
            <option key={maquina.id} value={maquina.id}>
              {maquina.numero_bastidor} - {maquina.cliente} ({maquina.zona})
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="avisoLlamada" className="block text-sm font-medium text-gray-700 mb-1">
          Aviso/Llamada *
        </label>
        <input
          type="text"
          id="avisoLlamada"
          value={avisoLlamada}
          onChange={(e) => setAvisoLlamadaLocal(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#001A3D] focus:border-[#001A3D]"
          placeholder="Introduce el número de aviso o llamada"
          required
        />
      </div>
      
      {selectedMaquina && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-700 mb-2">Información de la máquina seleccionada</h3>
          {maquinas
            .filter((m) => m.id === selectedMaquina)
            .map((maquina) => (
              <div key={maquina.id} className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Cliente:</span> {maquina.cliente}</p>
                <p><span className="font-medium">Número de bastidor:</span> {maquina.numero_bastidor}</p>
                <p><span className="font-medium">Número de flota:</span> {maquina.numero_flota}</p>
                <p><span className="font-medium">Matrícula:</span> {maquina.numero_matricula}</p>
                <p><span className="font-medium">Zona:</span> {maquina.zona}</p>
                <p><span className="font-medium">Capacidad:</span> {maquina.capacidad}</p>
                <p><span className="font-medium">Horas:</span> {maquina.numero_horas.toLocaleString()}</p>
                <p><span className="font-medium">Kilómetros:</span> {maquina.numero_kilometros.toLocaleString()}</p>
                <p><span className="font-medium">Número de fabricación:</span> {maquina.numero_fabricacion}</p>
              </div>
            ))}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/nuevo-informe')}
          className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Atrás
        </button>
        
        <button
          type="submit"
          disabled={!selectedMaquina || !avisoLlamada.trim()}
          className="bg-[#001A3D] text-white py-2 px-4 rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#001A3D] focus:ring-offset-2 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </form>
  );
} 