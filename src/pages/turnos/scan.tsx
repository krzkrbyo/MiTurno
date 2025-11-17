import { ScanQR } from '@/components/ScanQR'

export function ScanQRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Escanear QR</h1>
        <p className="text-muted-foreground">Escanea el código QR de un turno para validarlo</p>
      </div>
      <ScanQR />
    </div>
  )
}

