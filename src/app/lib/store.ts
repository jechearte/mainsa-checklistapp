import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ItemRespuesta, FormularioInforme } from './types';

interface InformeState {
  // Datos del tipo de máquina seleccionado
  tipoMaquinaId: string | null;
  tipoMaquinaNombre: string | null;
  setTipoMaquina: (id: string, nombre: string) => void;
  
  // Datos de la máquina específica
  maquinaId: string | null;
  setMaquinaId: (id: string) => void;
  
  // Checklist seleccionado
  checklistId: string | null;
  setChecklistId: (id: string) => void;
  
  // Aviso de llamada
  avisoLlamada: string;
  setAvisoLlamada: (aviso: string) => void;
  
  // Respuestas del checklist
  items: ItemRespuesta[];
  addItem: (item: ItemRespuesta) => void;
  updateItem: (item: ItemRespuesta) => void;
  
  // Comentarios generales
  comentarios: string;
  setComentarios: (comentarios: string) => void;
  
  // Indica si el checklist está completo
  checklistCompleto: boolean;
  setChecklistCompleto: (completo: boolean) => void;
  
  // Limpiar formulario
  resetForm: () => void;
  
  // Obtener formulario completo
  getFormulario: () => Partial<FormularioInforme>;
}

// Añadiendo persistencia con localStorage
export const useInformeStore = create<InformeState>()(
  persist(
    (set, get) => ({
      tipoMaquinaId: null,
      tipoMaquinaNombre: null,
      setTipoMaquina: (id, nombre) => set({ tipoMaquinaId: id, tipoMaquinaNombre: nombre }),
      
      maquinaId: null,
      setMaquinaId: (id) => set({ maquinaId: id }),
      
      checklistId: null,
      setChecklistId: (id) => set({ checklistId: id }),
      
      avisoLlamada: '',
      setAvisoLlamada: (aviso) => {
        console.log('Guardando aviso de llamada:', aviso);
        set({ avisoLlamada: aviso });
      },
      
      items: [],
      addItem: (item) => set((state) => {
        console.log('Añadiendo item al store:', item);
        return { items: [...state.items, item] };
      }),
      updateItem: (item) => set((state) => {
        console.log('Actualizando item en el store:', item);
        return {
          items: state.items.map(i => 
            i.item_id === item.item_id ? item : i
          )
        };
      }),
      
      comentarios: '',
      setComentarios: (comentarios) => {
        console.log('Guardando comentarios:', comentarios);
        set({ comentarios });
      },
      
      checklistCompleto: false,
      setChecklistCompleto: (completo) => {
        console.log('Estableciendo checklistCompleto:', completo);
        set({ checklistCompleto: completo });
      },
      
      resetForm: () => {
        console.log('Reseteando formulario');
        set({
          tipoMaquinaId: null,
          tipoMaquinaNombre: null,
          maquinaId: null,
          checklistId: null,
          avisoLlamada: '',
          items: [],
          comentarios: '',
          checklistCompleto: false
        });
      },
      
      getFormulario: () => {
        const { tipoMaquinaId, maquinaId, checklistId, avisoLlamada, items, comentarios } = get();
        console.log('getFormulario - datos actuales:', {
          tipoMaquinaId,
          maquinaId,
          checklistId,
          avisoLlamada,
          itemsCount: items.length,
          comentarios: comentarios ? 'presente' : 'vacío'
        });
        
        if (!tipoMaquinaId || !maquinaId) {
          return {};
        }
        
        return {
          tipo_maquina_id: tipoMaquinaId,
          maquina_id: maquinaId,
          aviso_llamada: avisoLlamada,
          items,
          comentarios: comentarios || undefined
        };
      }
    }),
    {
      name: 'informe-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tipoMaquinaId: state.tipoMaquinaId,
        tipoMaquinaNombre: state.tipoMaquinaNombre,
        maquinaId: state.maquinaId,
        checklistId: state.checklistId,
        avisoLlamada: state.avisoLlamada,
        items: state.items,
        comentarios: state.comentarios,
        checklistCompleto: state.checklistCompleto
      }),
    }
  )
); 