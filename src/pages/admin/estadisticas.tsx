import { useState, useEffect } from 'react'
import { Users, Clock, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRegistrosAsistencia } from '@/features/empleados/hooks/useRegistrosAsistencia'
import { Loading } from '@/components/Loading'
import { TIPOS_EVENTO_LABELS, TIPOS_EVENTO_COLORS } from '@/lib/constants'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/types/db'

type RegistroAsistencia = Database['public']['Tables']['registros_asistencia']['Row'] & {
  empleados?: Database['public']['Tables']['empleados']['Row']
}

export function EstadisticasPage() {
  const { loading, getEstadisticasDia } = useRegistrosAsistencia()
  const [fecha, setFecha] = useState(new Date())
  const [estadisticas, setEstadisticas] = useState<{
    totalRegistros: number
    empleadosPresentes: number
    empleadosEnAlmuerzo: number
    registros: RegistroAsistencia[]
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  const loadStats = async () => {
    setLoadingStats(true)
    const result = await getEstadisticasDia(fecha)
    if (result.success && result.data) {
      setEstadisticas(result.data)
    }
    setLoadingStats(false)
  }

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFecha = new Date(e.target.value)
    setFecha(newFecha)
  }

  if (loading || loadingStats) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Estadísticas de Asistencia</h1>
        <p className="text-muted-foreground">Consulta los registros de asistencia de los empleados</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            id="fecha"
            type="date"
            value={fecha.toISOString().split('T')[0]}
            onChange={handleFechaChange}
          />
        </div>
        <Button onClick={loadStats} variant="outline" className="mt-6">
          Actualizar
        </Button>
      </div>

      {estadisticas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empleados Presentes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.empleadosPresentes}</div>
                <p className="text-xs text-muted-foreground">Actualmente en el trabajo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Almuerzo</CardTitle>
                <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.empleadosEnAlmuerzo}</div>
                <p className="text-xs text-muted-foreground">Fuera por almuerzo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas.totalRegistros}</div>
                <p className="text-xs text-muted-foreground">Registros del día</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadisticas.registros.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay registros para esta fecha
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Empleado</th>
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-left p-2">Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.registros.map((registro) => (
                          <tr key={registro.id} className="border-b">
                            <td className="p-2">
                              {(registro as any).empleados?.nombre_completo || 'N/A'}
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  TIPOS_EVENTO_COLORS[registro.tipo_evento]
                                }`}
                              >
                                {TIPOS_EVENTO_LABELS[registro.tipo_evento]}
                              </span>
                            </td>
                            <td className="p-2">
                              {format(new Date(registro.fecha_hora), 'PPpp', { locale: es })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

