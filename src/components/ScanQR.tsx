import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { validateQRPayload } from '@/lib/qr'
import { useTurnos } from '@/features/turnos/hooks/useTurnos'
import { Loading } from './Loading'
import { TurnoCard } from './TurnoCard'
import type { Turno } from '@/types/turno'

export function ScanQR() {
  const [scanning, setScanning] = useState(true)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    expired: boolean
    error?: string
  } | null>(null)
  const [turno, setTurno] = useState<Turno | null>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { getTurnoById, updateTurnoEstado } = useTurnos()

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false
      )

      scanner.render(
        async (decodedText) => {
          if (scanning) {
            setScanning(false)
            setScannedData(decodedText)

            try {
              const payload = JSON.parse(decodedText)
              const validation = validateQRPayload(payload)

              setValidationResult(validation)

              if (validation.valid) {
                const { data } = await getTurnoById(payload.turno_id)
                if (data) {
                  setTurno(data)
                }
              }
            } catch (error) {
              setValidationResult({
                valid: false,
                expired: false,
                error: 'QR inválido o formato incorrecto',
              })
            }

            scanner.clear()
            scannerRef.current = null
          }
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      )

      scannerRef.current = scanner
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [scanning])

  function handleReset() {
    setScanning(true)
    setScannedData(null)
    setValidationResult(null)
    setTurno(null)
  }

  async function handleAtender() {
    if (turno) {
      await updateTurnoEstado(turno.id, 'atendiendo')
      setTurno({ ...turno, estado: 'atendiendo' })
    }
  }

  async function handleCompletar() {
    if (turno) {
      await updateTurnoEstado(turno.id, 'completado')
      setTurno({ ...turno, estado: 'completado' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Escanear QR</CardTitle>
          <CardDescription>Escanea el código QR de un turno para validarlo</CardDescription>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-lg overflow-hidden">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none z-10" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Apunta la cámara al código QR del turno
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {validationResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 p-4 rounded-lg"
                >
                  {validationResult.valid ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-success" />
                      <span className="font-medium text-success">QR Válido</span>
                    </>
                  ) : (
                    <>
                      {validationResult.expired ? (
                        <XCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-500" />
                      )}
                      <span className="font-medium text-red-500">
                        {validationResult.error || 'QR Inválido'}
                      </span>
                    </>
                  )}
                </motion.div>
              )}

              {scannedData && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-mono break-all">{scannedData}</p>
                </div>
              )}

              <Button onClick={handleReset} variant="outline" className="w-full">
                Escanear otro QR
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {turno && validationResult?.valid && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <TurnoCard turno={turno} onAtender={handleAtender} onCompletar={handleCompletar} />
        </motion.div>
      )}
    </div>
  )
}
