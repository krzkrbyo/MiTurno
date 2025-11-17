import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, LogIn, LogOut, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { validateQRPayload } from '@/lib/qr'
import { useEmpleados } from '@/features/empleados/hooks/useEmpleados'
import { useRegistrosAsistencia } from '@/features/empleados/hooks/useRegistrosAsistencia'
import { Loading } from './Loading'
import { TIPOS_EVENTO, TIPOS_EVENTO_LABELS } from '@/lib/constants'
import { toast } from 'sonner'
import type { Database } from '@/types/db'

type Empleado = Database['public']['Tables']['empleados']['Row']

export function ScanQR() {
  const [scanning, setScanning] = useState(true)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    expired: boolean
    error?: string
    empleadoId?: string
  } | null>(null)
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [loadingEmpleado, setLoadingEmpleado] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const { getEmpleadoByQR, getEmpleadoById } = useEmpleados()
  const { createRegistro } = useRegistrosAsistencia()

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

              if (validation.valid && validation.empleadoId) {
                setLoadingEmpleado(true)
                // Buscar empleado por ID
                const { data: empleadoData } = await getEmpleadoById(validation.empleadoId)
                if (empleadoData) {
                  setEmpleado(empleadoData)
                } else {
                  setValidationResult({
                    ...validation,
                    valid: false,
                    error: 'Empleado no encontrado',
                  })
                }
                setLoadingEmpleado(false)
              }
            } catch (error) {
              // Si no es JSON válido, mostrar error
              setValidationResult({
                valid: false,
                expired: false,
                error: 'QR inválido. El código debe ser un QR generado por el sistema.',
              })
              setLoadingEmpleado(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  function handleReset() {
    setScanning(true)
    setScannedData(null)
    setValidationResult(null)
    setEmpleado(null)
    setLoadingEmpleado(false)
  }

  async function handleRegistrarEvento(tipoEvento: typeof TIPOS_EVENTO[keyof typeof TIPOS_EVENTO]) {
    if (!empleado) return

    setRegistrando(true)
    try {
      const result = await createRegistro({
        empleado_id: empleado.id,
        tipo_evento: tipoEvento,
        fecha_hora: new Date().toISOString(),
      })

      if (result.success) {
        toast.success(`${TIPOS_EVENTO_LABELS[tipoEvento]} registrada correctamente`)
        // Resetear después de 1.5 segundos para permitir otro escaneo
        setTimeout(() => {
          handleReset()
        }, 1500)
      } else {
        toast.error(result.error || 'Error al registrar el evento')
      }
    } catch (error: any) {
      console.error('Error in handleRegistrarEvento:', error)
      toast.error(error.message || 'Error al registrar evento')
    } finally {
      setRegistrando(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Escanear QR de Empleado</CardTitle>
          <CardDescription>Escanea el código QR del empleado para registrar asistencia</CardDescription>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto aspect-square bg-black rounded-lg overflow-hidden">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none z-10" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Apunta la cámara al código QR del empleado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loadingEmpleado ? (
                <Loading />
              ) : validationResult && !validationResult.valid ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 p-4 rounded-lg bg-red-50"
                >
                  {validationResult.expired ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  <span className="font-medium text-red-500">
                    {validationResult.error || 'QR Inválido'}
                  </span>
                </motion.div>
              ) : empleado ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center space-y-4">
                    {empleado.foto_url ? (
                      <img
                        src={empleado.foto_url}
                        alt={empleado.nombre_completo}
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {empleado.nombre_completo.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold font-heading">{empleado.nombre_completo}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Selecciona el tipo de registro</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => handleRegistrarEvento(TIPOS_EVENTO.ENTRADA)}
                      disabled={registrando}
                      className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      {TIPOS_EVENTO_LABELS[TIPOS_EVENTO.ENTRADA]}
                    </Button>

                    <Button
                      onClick={() => handleRegistrarEvento(TIPOS_EVENTO.SALIDA_ALMUERZO)}
                      disabled={registrando}
                      variant="outline"
                      className="w-full h-16 text-lg border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                      size="lg"
                    >
                      <UtensilsCrossed className="mr-2 h-5 w-5" />
                      {TIPOS_EVENTO_LABELS[TIPOS_EVENTO.SALIDA_ALMUERZO]}
                    </Button>

                    <Button
                      onClick={() => handleRegistrarEvento(TIPOS_EVENTO.ENTRADA_ALMUERZO)}
                      disabled={registrando}
                      variant="outline"
                      className="w-full h-16 text-lg border-blue-500 text-blue-700 hover:bg-blue-50"
                      size="lg"
                    >
                      <UtensilsCrossed className="mr-2 h-5 w-5" />
                      {TIPOS_EVENTO_LABELS[TIPOS_EVENTO.ENTRADA_ALMUERZO]}
                    </Button>

                    <Button
                      onClick={() => handleRegistrarEvento(TIPOS_EVENTO.SALIDA)}
                      disabled={registrando}
                      variant="destructive"
                      className="w-full h-16 text-lg"
                      size="lg"
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      {TIPOS_EVENTO_LABELS[TIPOS_EVENTO.SALIDA]}
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              <Button onClick={handleReset} variant="outline" className="w-full" disabled={registrando}>
                {registrando ? 'Registrando...' : 'Escanear otro QR'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
