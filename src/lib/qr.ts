import CryptoJS from 'crypto-js'
import { QR_EXPIRATION_SECONDS } from './constants'

/**
 * Genera una firma HMAC-SHA256 para el QR del empleado
 */
export function generateQRSignature(empleadoId: string, expTimestamp: number): string {
  const secret = import.meta.env.VITE_QR_SIGN_SECRET || 'default-secret-change-in-production'
  const payload = `${empleadoId}|${expTimestamp}`
  return CryptoJS.HmacSHA256(payload, secret).toString()
}

/**
 * Valida la firma HMAC del QR
 */
export function validateQRSignature(
  empleadoId: string,
  expTimestamp: number,
  signature: string
): boolean {
  const expectedSignature = generateQRSignature(empleadoId, expTimestamp)
  return expectedSignature === signature
}

/**
 * Genera el código QR para empleados (solo contiene el PIN de 4 dígitos)
 */
export function generateQRCode(pin: string): string {
  if (!pin || !/^\d{4}$/.test(pin)) {
    throw new Error('PIN debe ser de 4 dígitos')
  }
  return pin
}

/**
 * Genera el payload del QR con firma y expiración para turnos
 * (mantenido para compatibilidad con el sistema de turnos)
 */
export function generateQRPayload(turnoId: string): {
  turno_id: string
  exp_ts: number
  firma: string
} {
  const expTimestamp = Math.floor(Date.now() / 1000) + QR_EXPIRATION_SECONDS
  const firma = generateQRSignature(turnoId, expTimestamp)

  return {
    turno_id: turnoId,
    exp_ts: expTimestamp,
    firma,
  }
}

/**
 * Valida si el QR ha expirado
 */
export function isQRExpired(expTimestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  return now > expTimestamp
}

/**
 * Valida el payload completo del QR de empleado
 */
export function validateQRPayload(payload: {
  empleado_id?: string
  turno_id?: string // Mantener compatibilidad temporal
  exp_ts: number
  firma: string
}): { valid: boolean; expired: boolean; empleadoId?: string; error?: string } {
  const empleadoId = payload.empleado_id || payload.turno_id // Compatibilidad temporal
  
  if (!empleadoId || !payload.exp_ts || !payload.firma) {
    return {
      valid: false,
      expired: false,
      error: 'Payload incompleto',
    }
  }

  const expired = isQRExpired(payload.exp_ts)
  if (expired) {
    return {
      valid: false,
      expired: true,
      error: 'QR expirado',
    }
  }

  const signatureValid = validateQRSignature(empleadoId, payload.exp_ts, payload.firma)
  if (!signatureValid) {
    return {
      valid: false,
      expired: false,
      error: 'Firma inválida',
    }
  }

  return {
    valid: true,
    expired: false,
    empleadoId,
  }
}

