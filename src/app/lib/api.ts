import axios from 'axios';
import { 
  TipoMaquina, 
  Maquina, 
  Checklist, 
  Grupo, 
  ItemChecklist, 
  EstadoPosible,
  FormularioInforme
} from './types';

// URL base de la API (en producción se debería obtener de las variables de entorno)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cliente axios configurado
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación
apiClient.interceptors.request.use(
  async (config) => {
    // Si estamos en el navegador, intentamos obtener el token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación (token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 (Unauthorized) y no estamos ya intentando refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Aquí podríamos implementar la lógica para refrescar el token
        // Por ahora, simplemente redirigimos al login
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        // Si falla el refresh, redirigimos al login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper para manejar errores de fetch
const handleFetchError = (error: any, entityName: string): never => {
  console.error(`Error al obtener ${entityName}:`, error);
  throw new Error(`Error al obtener ${entityName}`);
};

// Endpoints implementados en API Routes
export const getTiposMaquinas = async (): Promise<TipoMaquina[]> => {
  try {
    const response = await fetch('/api/machine-types');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch (error) {
    return handleFetchError(error, 'tipos de máquina');
  }
};

export const getMaquinasPorTipo = async (tipoId: string): Promise<Maquina[]> => {
  try {
    console.log('Obteniendo máquinas para el tipo:', tipoId);
    const response = await fetch(`/api/machines/by-type/${tipoId}`);
    if (!response.ok) {
      console.error('Error al obtener máquinas:', {
        status: response.status,
        statusText: response.statusText,
        tipoId
      });
      throw new Error(`Error al obtener máquinas: ${response.status}`);
    }
    const data = await response.json();
    console.log('Máquinas obtenidas:', {
      count: data.length,
      tipoId
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'máquinas');
  }
};

export const getMaquina = async (id: string): Promise<Maquina> => {
  try {
    console.log('Obteniendo detalle de máquina:', id);
    const response = await fetch(`/api/machines/${id}`);
    if (!response.ok) {
      console.error('Error al obtener detalle de máquina:', {
        status: response.status,
        statusText: response.statusText,
        id
      });
      throw new Error(`Error al obtener detalle de máquina: ${response.status}`);
    }
    const data = await response.json();
    console.log('Detalle de máquina obtenido:', {
      id: data.id,
      numero_bastidor: data.numero_bastidor
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'detalle de máquina');
  }
};

export const getChecklistPorTipoMaquina = async (tipoId: string): Promise<Checklist> => {
  try {
    console.log('Obteniendo checklist para el tipo:', tipoId);
    const response = await fetch(`/api/checklists/by-machine-type/${tipoId}`);
    if (!response.ok) {
      console.error('Error al obtener checklist:', {
        status: response.status,
        statusText: response.statusText,
        tipoId
      });
      throw new Error(`Error al obtener checklist: ${response.status}`);
    }
    const data = await response.json();
    
    // La respuesta es un array, tomamos el primer checklist activo
    if (!Array.isArray(data) || data.length === 0) {
      console.error('No se encontró ningún checklist para el tipo de máquina:', tipoId);
      throw new Error('No se encontró ningún checklist para este tipo de máquina');
    }
    
    const checklistActivo = data.find(c => c.activo) || data[0];
    console.log('Checklist obtenido:', {
      id: checklistActivo.id,
      nombre: checklistActivo.nombre,
      tipoId
    });
    
    return checklistActivo;
  } catch (error) {
    return handleFetchError(error, 'checklist');
  }
};

export const getGruposPorChecklist = async (checklistId: string): Promise<Grupo[]> => {
  try {
    console.log('Obteniendo grupos para el checklist:', checklistId);
    const response = await fetch(`/api/checklists/${checklistId}/groups`);
    if (!response.ok) {
      console.error('Error al obtener grupos:', {
        status: response.status,
        statusText: response.statusText,
        checklistId
      });
      throw new Error(`Error al obtener grupos: ${response.status}`);
    }
    const data = await response.json();
    console.log('Grupos obtenidos:', {
      count: data.length,
      checklistId
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'grupos');
  }
};

export const getItemsPorGrupo = async (grupoId: string): Promise<ItemChecklist[]> => {
  try {
    console.log('Obteniendo items para el grupo:', grupoId);
    const response = await fetch(`/api/checklists/groups/${grupoId}/items`);
    if (!response.ok) {
      console.error('Error al obtener items:', {
        status: response.status,
        statusText: response.statusText,
        grupoId
      });
      throw new Error(`Error al obtener items: ${response.status}`);
    }
    const data = await response.json();
    console.log('Items obtenidos:', {
      count: data.length,
      grupoId
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'items');
  }
};

export const getEstadosPosiblesPorTipoMaquina = async (tipoId: string): Promise<EstadoPosible[]> => {
  try {
    console.log('Obteniendo estados posibles para el tipo:', tipoId);
    const response = await fetch(`/api/states/by-machine-type/${tipoId}`);
    if (!response.ok) {
      console.error('Error al obtener estados:', {
        status: response.status,
        statusText: response.statusText,
        tipoId
      });
      throw new Error(`Error al obtener estados: ${response.status}`);
    }
    const data = await response.json();
    console.log('Estados obtenidos:', {
      count: data.length,
      tipoId
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'estados posibles');
  }
};

export const guardarInforme = async (informe: FormularioInforme): Promise<{ id: string }> => {
  try {
    console.log('Guardando informe:', informe);
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(informe)
    });

    if (!response.ok) {
      console.error('Error al guardar informe:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Error al guardar informe: ${response.status}`);
    }

    const data = await response.json();
    console.log('Informe guardado:', {
      id: data.id
    });
    return data;
  } catch (error) {
    return handleFetchError(error, 'guardar informe');
  }
};

// Nuevas funciones para obtener informes
export interface FiltrosInforme {
  tipo_maquina_id?: string; // Internamente se mapea a 'machine_type_id' en la API externa
  numero_bastidor?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
}

export interface InformeListItem {
  id: string;
  fecha_creacion: string;
  fecha_finalizacion: string | null;
  maquina_id: string;
  tipo_maquina: string;
  numero_bastidor: string;
}

export interface InformesResponse {
  data: InformeListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const obtenerInformes = async (filtros?: FiltrosInforme): Promise<InformesResponse> => {
  try {
    let url = '/api/reports/list';
    
    // Añadir filtros a la URL si existen
    if (filtros) {
      const params = new URLSearchParams();
      
      if (filtros.tipo_maquina_id) {
        params.append('tipo_maquina_id', filtros.tipo_maquina_id);
      }
      
      if (filtros.numero_bastidor) {
        params.append('numero_bastidor', filtros.numero_bastidor);
      }
      
      if (filtros.fecha_desde) {
        params.append('fecha_desde', filtros.fecha_desde);
      }
      
      if (filtros.fecha_hasta) {
        params.append('fecha_hasta', filtros.fecha_hasta);
      }
      
      // Agregar parámetros de paginación
      if (filtros.page !== undefined) {
        params.append('page', filtros.page.toString());
      }
      
      if (filtros.page_size !== undefined) {
        params.append('page_size', filtros.page_size.toString());
      }
      
      const paramsString = params.toString();
      if (paramsString) {
        url += `?${paramsString}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Error al obtener informes:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Error al obtener informes: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return handleFetchError(error, 'informes');
  }
};

export const obtenerDetalleInforme = async (id: string) => {
  try {
    const response = await fetch(`/api/reports/${id}`);
    
    if (!response.ok) {
      console.error(`Error al obtener detalle del informe ${id}:`, {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Error al obtener detalle del informe: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return handleFetchError(error, 'detalle del informe');
  }
}; 