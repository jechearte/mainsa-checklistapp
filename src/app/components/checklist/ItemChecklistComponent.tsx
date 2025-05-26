'use client';

import { useState, useEffect } from 'react';
import { ItemChecklist, EstadoPosible, ItemRespuesta } from '@/app/lib/types';

interface ItemChecklistComponentProps {
  item: ItemChecklist;
  estadosPosibles: EstadoPosible[];
  respuestas: ItemRespuesta[];
  onChangeItem: (respuesta: ItemRespuesta) => void;
  onValidationChange?: (itemId: string, isValid: boolean) => void;
}

export default function ItemChecklistComponent({
  item,
  estadosPosibles,
  respuestas,
  onChangeItem,
  onValidationChange
}: ItemChecklistComponentProps) {
  const [estadoId, setEstadoId] = useState<string>('');
  const [observacionesInternas, setObservacionesInternas] = useState<string>('');
  const [observacionesCliente, setObservacionesCliente] = useState<string>('');
  const [showObservaciones, setShowObservaciones] = useState(false);
  
  useEffect(() => {
    if (onValidationChange) {
      const needsObservaciones = checkIfNeedsObservaciones(estadoId);
      const hasObservaciones = needsObservaciones ? observacionesInternas.trim() !== '' : true;
      const hasSelectedEstado = estadoId !== '';
      
      const isValid = hasSelectedEstado && hasObservaciones;
      onValidationChange(item.id, isValid);
    }
  }, [estadoId, observacionesInternas, item.id, onValidationChange]);
  
  const checkIfNeedsObservaciones = (id: string): boolean => {
    if (!id) return false;
    const estado = estadosPosibles.find(e => e.id === id);
    const estadoNombre = estado?.nombre.toLowerCase() || '';
    return !['bien', 'correcto', 'ok'].some(val => estadoNombre.includes(val));
  };
  
  useEffect(() => {
    const respuestaExistente = respuestas.find(r => r.item_id === item.id);
    if (respuestaExistente) {
      setEstadoId(respuestaExistente.estado_id);
      setObservacionesInternas(respuestaExistente.observaciones_internas || '');
      setObservacionesCliente(respuestaExistente.observaciones_cliente || '');
      
      const needsObservaciones = checkIfNeedsObservaciones(respuestaExistente.estado_id);
      setShowObservaciones(needsObservaciones);
    }
  }, [item.id, respuestas, estadosPosibles]);
  
  const handleEstadoSelect = (newEstadoId: string) => {
    setEstadoId(newEstadoId);
    
    const needsObservaciones = checkIfNeedsObservaciones(newEstadoId);
    setShowObservaciones(needsObservaciones);
    
    onChangeItem({
      item_id: item.id,
      estado_id: newEstadoId,
      observaciones_internas: needsObservaciones ? observacionesInternas : undefined,
      observaciones_cliente: needsObservaciones ? observacionesCliente : undefined
    });
  };
  
  const handleObservacionesInternasChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newObservaciones = e.target.value;
    setObservacionesInternas(newObservaciones);
    
    onChangeItem({
      item_id: item.id,
      estado_id: estadoId,
      observaciones_internas: newObservaciones,
      observaciones_cliente: observacionesCliente
    });
  };
  
  const handleObservacionesClienteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newObservaciones = e.target.value;
    setObservacionesCliente(newObservaciones);
    
    onChangeItem({
      item_id: item.id,
      estado_id: estadoId,
      observaciones_internas: observacionesInternas,
      observaciones_cliente: newObservaciones
    });
  };
  
  const getEstadoColorClasses = (nombreEstado: string, isSelected: boolean): string => {
    const nombre = nombreEstado.toLowerCase();
    
    if (nombre === 'bien' || nombre === 'correcto' || nombre.includes('ok')) {
      return isSelected 
        ? 'bg-green-500 text-white border-green-600' 
        : 'bg-white text-green-700 border-green-500 hover:bg-green-50';
    }
    
    if (nombre === 'mal' || nombre === 'incorrecto' || nombre.includes('defectuoso')) {
      return isSelected 
        ? 'bg-red-500 text-white border-red-600' 
        : 'bg-white text-red-700 border-red-500 hover:bg-red-50';
    }
    
    if (nombre.includes('revisar') || nombre.includes('atención')) {
      return isSelected 
        ? 'bg-yellow-400 text-black border-yellow-500' 
        : 'bg-white text-yellow-700 border-yellow-400 hover:bg-yellow-50';
    }
    
    return isSelected 
      ? 'bg-gray-400 text-white border-gray-500' 
      : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50';
  };
  
  const isItemInvalid = (estadoId !== '' && showObservaciones && observacionesInternas.trim() === '');
  
  return (
    <div className={`border rounded-md p-4 bg-white ${isItemInvalid ? 'border-red-300' : ''}`}>
      <div className="mb-3">
        <h4 className="font-medium text-gray-800">{item.nombre}</h4>
        <p className="text-sm text-gray-600">{item.descripcion}</p>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        {estadosPosibles.map((estado) => {
          const isSelected = estadoId === estado.id;
          const colorClasses = getEstadoColorClasses(estado.nombre, isSelected);
          
          return (
            <button
              key={estado.id}
              type="button"
              onClick={() => handleEstadoSelect(estado.id)}
              className={`px-4 py-2 rounded-md border-2 font-medium transition-all ${colorClasses} ${
                isSelected ? 'ring-2 ring-offset-1 ring-[#001A3D] shadow-sm' : ''
              }`}
            >
              {estado.nombre}
            </button>
          );
        })}
      </div>
      
      {showObservaciones && (
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor={`observaciones-internas-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones internas <span className="text-red-500">*</span>
          </label>
          <textarea
              id={`observaciones-internas-${item.id}`}
              value={observacionesInternas}
              onChange={handleObservacionesInternasChange}
            rows={2}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[#001A3D] focus:border-[#001A3D] ${
                showObservaciones && observacionesInternas.trim() === '' ? 'border-red-300' : 'border-gray-300'
            }`}
              placeholder="Describe la incidencia o problema encontrado (solo visible para personal interno)"
            required={true}
            aria-required="true"
          ></textarea>
          </div>
          
          <div>
            <label htmlFor={`observaciones-cliente-${item.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones para el cliente
            </label>
            <textarea
              id={`observaciones-cliente-${item.id}`}
              value={observacionesCliente}
              onChange={handleObservacionesClienteChange}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#001A3D] focus:border-[#001A3D]"
              placeholder="Información que se mostrará al cliente"
            ></textarea>
          </div>
        </div>
      )}
    </div>
  );
} 