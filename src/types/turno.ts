import { EstadoTurno } from '@/lib/constants'

/**
 * Tipo de turno con relaciones expandidas
 */
export interface Turno {
  id: string
  codigo: string
  cliente: string
  servicio_id: string
  sucursal_id: string
  estado: EstadoTurno
  scheduled_for: string | null
  atendido_at: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  // Relaciones expandidas (opcionales)
  servicio?: {
    id: string
    nombre: string
    duracion_min: number
  }
  sucursal?: {
    id: string
    nombre: string
    codigo: string
  }
  creador?: {
    id: string
    full_name: string | null
  }
}

/**
 * Formulario de creación de turno
 */
export interface TurnoFormData {
  cliente: string
  servicio_id: string
  sucursal_id: string
  scheduled_for?: string | null
  notas?: string
}

/**
 * Filtros para la lista de turnos
 */
export interface TurnoFilters {
  sucursal_id?: string
  estado?: EstadoTurno
  search?: string
}

