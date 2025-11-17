import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, LogIn, LogOut, UtensilsCrossed, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateQRPayload } from '@/lib/qr'
import { useEmpleados } from '@/features/empleados/hooks/useEmpleados'
import { useRegistrosAsistencia } from '@/features/empleados/hooks/useRegistrosAsistencia'
import { Loading } from './Loading'
import { TIPOS_EVENTO, TIPOS_EVENTO_LABELS } from '@/lib/constants'
import { toast } from 'sonner'
import type { Database } from '@/types/db'

type Empleado = Database['public']['Tables']['empleados']['Row']

export function ScanQR() {
  const [codigoInput, setCodigoInput] = useState('')
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [loadingEmpleado, setLoadingEmpleado] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { getEmpleadoByQR, getEmpleadoById, getEmpleadoByPIN } = useEmpleados()
  const { createRegistro } = useRegistrosAsistencia()

  async function handleBuscarEmpleado() {
    if (!codigoInput.trim()) {
      setError('Por favor ingresa un código o PIN')
      return
    }

    setLoadingEmpleado(true)
    setError(null)
    setEmpleado(null)

    try {
      const input = codigoInput.trim()

      // Intentar buscar por PIN (4 dígitos)
      if (/^\d{4}$/.test(input)) {
        const { data, error: pinError } = await getEmpleadoByPIN(input)
        if (data) {
          setEmpleado(data)
          setCodigoInput('') // Limpiar input después de encontrar
          return
        }
        if (pinError) {
          setError('PIN no encontrado')
        }
      }

      // Intentar buscar por código QR (si es JSON)
      try {
        const payload = JSON.parse(input)
        const validation = validateQRPayload(payload)

        if (validation.valid && validation.empleadoId) {
          const { data: empleadoData } = await getEmpleadoById(validation.empleadoId)
          if (empleadoData) {
            setEmpleado(empleadoData)
            setCodigoInput('') // Limpiar input después de encontrar
            return
          }
        }
        setError(validation.error || 'QR inválido')
      } catch {
        // Si no es JSON, intentar buscar directamente por código QR
        const { data: empleadoByQR } = await getEmpleadoByQR(input)
        if (empleadoByQR) {
          setEmpleado(empleadoByQR)
          setCodigoInput('') // Limpiar input después de encontrar
          return
        }
        setError('Código o PIN no encontrado')
      }
    } catch (err: any) {
      console.error('Error buscando empleado:', err)
      setError('Error al buscar empleado')
    } finally {
      setLoadingEmpleado(false)
    }
  }

  function handleReset() {
    setCodigoInput('')
    setEmpleado(null)
    setError(null)
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
        // Resetear después de 1.5 segundos para permitir otro registro
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

  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleBuscarEmpleado()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Registro de Asistencia</CardTitle>
          <CardDescription>
            Ingresa el PIN de 4 dígitos o escanea el código QR del empleado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Input de búsqueda */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ingresa PIN (4 dígitos) o escanea código QR"
                    value={codigoInput}
                    onChange={(e) => {
                      setCodigoInput(e.target.value)
                      setError(null)
                      setEmpleado(null)
                    }}
                    onKeyPress={handleKeyPress}
                    className="pl-10 text-lg h-14"
                    autoFocus
                    disabled={loadingEmpleado || registrando}
                  />
                </div>
                <Button
                  onClick={handleBuscarEmpleado}
                  disabled={loadingEmpleado || registrando || !codigoInput.trim()}
                  size="lg"
                  className="h-14 px-6"
                >
                  {loadingEmpleado ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-50"
                >
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium text-red-500">{error}</span>
                </motion.div>
              )}
            </div>

            {/* Loading */}
            {loadingEmpleado && (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            )}

            {/* Información del empleado y botones */}
            {empleado && !loadingEmpleado && (
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
                    {empleado.pin && (
                      <p className="text-sm text-muted-foreground mt-1">PIN: {empleado.pin}</p>
                    )}
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

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                  disabled={registrando}
                >
                  {registrando ? 'Registrando...' : 'Buscar otro empleado'}
                </Button>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
