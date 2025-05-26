'use client';

import { useState, useEffect, useRef } from 'react';
import { Grupo, EstadoPosible, ItemChecklist, ItemRespuesta } from '@/app/lib/types';
import { getItemsPorGrupo } from '@/app/lib/api';
import { useInformeStore } from '@/app/lib/store';
import ItemChecklistComponent from './ItemChecklistComponent';

interface GrupoChecklistProps {
  grupo: Grupo;
  estadosPosibles: EstadoPosible[];
  onValidationChange?: (isValid: boolean) => void;
}

export default function GrupoChecklist({ 
  grupo, 
  estadosPosibles,
  onValidationChange 
}: GrupoChecklistProps) {
  const [items, setItems] = useState<ItemChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para rastrear la validez de cada item
  const [itemValidations, setItemValidations] = useState<Record<string, boolean>>({});
  
  const { items: respuestas, addItem, updateItem } = useInformeStore();
  
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const data = await getItemsPorGrupo(grupo.id);
        setItems(data.sort((a, b) => a.orden - b.orden));
        
        // Inicializar el estado de validación para todos los items
        const initialValidations: Record<string, boolean> = {};
        data.forEach(item => {
          initialValidations[item.id] = true; // Inicialmente válido
        });
        setItemValidations(initialValidations);
      } catch (err) {
        console.error('Error al cargar items:', err);
        setError('Error al cargar los items del grupo. Por favor, inténtalo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [grupo.id]);
  
  // Reportar cualquier cambio en las validaciones al padre
  useEffect(() => {
    if (onValidationChange && items.length > 0) {
      const isValid = Object.values(itemValidations).every(isValid => isValid);
      onValidationChange(isValid);
    }
  }, [itemValidations, items.length, onValidationChange]);
  
  const handleItemChange = (item: ItemRespuesta) => {
    const existingItem = respuestas.find(r => r.item_id === item.item_id);
    if (existingItem) {
      updateItem(item);
    } else {
      addItem(item);
    }
  };
  
  const handleItemValidationChange = (itemId: string, isValid: boolean) => {
    setItemValidations(prev => ({
      ...prev,
      [itemId]: isValid
    }));
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#001A3D] mx-auto"></div>
        <p className="mt-2">Cargando items...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>{error}</p>
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
        <p>No hay items en este grupo.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {grupo.descripcion && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <p className="text-gray-600">{grupo.descripcion}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {items.map((item) => (
          <ItemChecklistComponent
            key={item.id}
            item={item}
            estadosPosibles={estadosPosibles}
            onChangeItem={handleItemChange}
            respuestas={respuestas}
            onValidationChange={handleItemValidationChange}
          />
        ))}
      </div>
    </div>
  );
} 