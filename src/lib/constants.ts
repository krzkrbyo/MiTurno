/**
 * Constantes de la aplicación
 */

export const APP_NAME = 'MiTurno'

export const ROLES = {
  ADMIN: 'admin',
  AGENTE: 'agente',
  CLIENTE: 'cliente',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ESTADOS_TURNO = {
  PENDIENTE: 'pendiente',
  EN_COLA: 'en_cola',
  ATENDIENDO: 'atendiendo',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
} as const

export type EstadoTurno = (typeof ESTADOS_TURNO)[keyof typeof ESTADOS_TURNO]

export const ESTADOS_TURNO_LABELS: Record<EstadoTurno, string> = {
  pendiente: 'Pendiente',
  en_cola: 'En Cola',
  atendiendo: 'Atendiendo',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

export const ESTADOS_TURNO_COLORS: Record<EstadoTurno, string> = {
  pendiente: 'bg-gray-100 text-gray-800',
  en_cola: 'bg-blue-100 text-blue-800',
  atendiendo: 'bg-yellow-100 text-yellow-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

// Tiempo de expiración del QR (24 horas en segundos)
export const QR_EXPIRATION_SECONDS = 24 * 60 * 60

