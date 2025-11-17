import { ScanQR } from '@/components/ScanQR'

export function ScanQRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Registro de Asistencia</h1>
        <p className="text-muted-foreground">Ingresa el PIN de 4 dígitos o escanea el código QR del empleado</p>
      </div>
      <ScanQR />
    </div>
  )
}

