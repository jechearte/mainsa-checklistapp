// Tipos de usuario
export type UserType = 'mecánico' | 'administrativo';

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo: UserType;
}

// Tipos de máquinas
export interface TipoMaquina {
  id: string;
  nombre: string;
  descripcion: string;
}

// Máquinas
export interface Maquina {
  id: string;
  tipo_maquina_id: string;
  cliente: string;
  numero_bastidor: string;
  numero_flota: string;
  numero_horas: number;
  numero_matricula: string;
  numero_kilometros: number;
  zona: string;
  capacidad: string;
  numero_fabricacion: string;
}

// Checklists
export interface Checklist {
  id: string;
  tipo_maquina_id: string;
  nombre: string;
  descripcion: string;
  version: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  activo: boolean;
}

// Grupos
export interface Grupo {
  id: string;
  checklist_id: string;
  nombre: string;
  descripcion: string;
  orden: number;
}

// Items de checklist
export interface ItemChecklist {
  id: string;
  grupo_id: string;
  nombre: string;
  descripcion: string;
  orden: number;
  obligatorio: boolean;
}

// Estados posibles
export interface EstadoPosible {
  id: string;
  tipo_maquina_id: string;
  nombre: string;
}

// Informes
export interface Informe {
  id: string;
  maquina_id: string;
  usuario_id: string;
  checklist_id: string;
  fecha_creacion: string;
  comentarios?: string;
  fecha_finalizacion?: string;
  aviso_llamada: string;
}

// Detalles de informe
export interface DetalleInforme {
  id: string;
  informe_id: string;
  item_checklist_id: string;
  estado_id: string;
  observaciones_internas?: string;
  observaciones_cliente?: string;
}

// Item para la lista de informes
export interface InformeListItem {
  id: string;
  fecha_creacion: string;
  tipo_maquina_nombre: string;
  numero_bastidor: string;
  items_problemas: number;
  total_items: number;
}

// Para los formularios de creación de informes
export interface ItemRespuesta {
  item_id: string;
  estado_id: string;
  observaciones_internas?: string;
  observaciones_cliente?: string;
}

export interface FormularioInforme {
  tipo_maquina_id: string;
  maquina_id: string;
  aviso_llamada: string;
  items: ItemRespuesta[];
  comentarios?: string;
} 