import { ScanQR } from '@/components/ScanQR'

export function ScanQRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Registro de Asistencia</h1>
        <p className="text-muted-foreground">Escanea el código QR del empleado para registrar entrada, salida o almuerzo</p>
      </div>
      <ScanQR />
    </div>
  )
}

