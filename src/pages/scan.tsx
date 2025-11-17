import { ScanQR } from '@/components/ScanQR'

/**
 * Página pública de escaneo QR para empleados
 * No requiere autenticación
 */
export function ScanPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold font-heading mb-2">Registro de Asistencia</h1>
          <p className="text-muted-foreground">Ingresa tu PIN de 4 dígitos o escanea tu código QR</p>
        </div>
        <ScanQR />
      </div>
    </div>
  )
}

