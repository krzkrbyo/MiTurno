/**
 * Constantes de la aplicación
 */

export const APP_NAME = 'Control de Asistencia'

export const ROLES = {
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const TIPOS_EVENTO = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  SALIDA_ALMUERZO: 'salida_almuerzo',
  ENTRADA_ALMUERZO: 'entrada_almuerzo',
} as const

export type TipoEvento = (typeof TIPOS_EVENTO)[keyof typeof TIPOS_EVENTO]

export const TIPOS_EVENTO_LABELS: Record<TipoEvento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  salida_almuerzo: 'Salida a Almuerzo',
  entrada_almuerzo: 'Entrada de Almuerzo',
}

export const TIPOS_EVENTO_COLORS: Record<TipoEvento, string> = {
  entrada: 'bg-green-100 text-green-800',
  salida: 'bg-red-100 text-red-800',
  salida_almuerzo: 'bg-yellow-100 text-yellow-800',
  entrada_almuerzo: 'bg-blue-100 text-blue-800',
}

// Tiempo de expiración del QR (no expira para empleados, pero mantenemos validación)
export const QR_EXPIRATION_SECONDS = 365 * 24 * 60 * 60 // 1 año

