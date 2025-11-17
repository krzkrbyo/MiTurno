import CryptoJS from 'crypto-js'

/**
 * Genera una firma HMAC-SHA256 para el QR del turno
 */
export function generateQRSignature(turnoId: string, expTimestamp: number): string {
  const secret = import.meta.env.VITE_QR_SIGN_SECRET || 'default-secret-change-in-production'
  const payload = `${turnoId}|${expTimestamp}`
  return CryptoJS.HmacSHA256(payload, secret).toString()
}

/**
 * Valida la firma HMAC del QR
 */
export function validateQRSignature(
  turnoId: string,
  expTimestamp: number,
  signature: string
): boolean {
  const expectedSignature = generateQRSignature(turnoId, expTimestamp)
  return expectedSignature === signature
}

/**
 * Genera el payload del QR con firma y expiración
 */
export function generateQRPayload(turnoId: string): {
  turno_id: string
  exp_ts: number
  firma: string
} {
  const expTimestamp = Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 horas
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
 * Valida el payload completo del QR
 */
export function validateQRPayload(payload: {
  turno_id: string
  exp_ts: number
  firma: string
}): { valid: boolean; expired: boolean; error?: string } {
  if (!payload.turno_id || !payload.exp_ts || !payload.firma) {
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

  const signatureValid = validateQRSignature(payload.turno_id, payload.exp_ts, payload.firma)
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
  }
}

