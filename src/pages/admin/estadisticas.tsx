import { useState, useEffect } from 'react'
import { Users, UtensilsCrossed, TrendingUp, Activity } from 'lucide-react'
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type RegistroAsistencia = Database['public']['Tables']['registros_asistencia']['Row'] & {
  empleados?: Database['public']['Tables']['empleados']['Row']
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export function EstadisticasPage() {
  const {
    getEstadisticasDia,
    getAsistenciaPorDia,
    getDistribucionEventos,
    getAsistenciaPorEmpleado,
    getKPIs,
  } = useRegistrosAsistencia()
  const [fecha, setFecha] = useState(new Date())
  const [estadisticas, setEstadisticas] = useState<{
    totalRegistros: number
    empleadosPresentes: number
    empleadosEnAlmuerzo: number
    registros: RegistroAsistencia[]
  } | null>(null)
  const [kpis, setKPIs] = useState<{
    tasaAsistencia: number
    totalEmpleados: number
    empleadosConEntrada: number
    totalRegistros: number
    entradas: number
    salidas: number
  } | null>(null)
  const [asistenciaPorDia, setAsistenciaPorDia] = useState<Array<{ fecha: string; entradas: number; salidas: number }>>([])
  const [distribucionEventos, setDistribucionEventos] = useState<Array<{ tipo: string; cantidad: number }>>([])
  const [asistenciaPorEmpleado, setAsistenciaPorEmpleado] = useState<Array<{ id: string; nombre: string; registros: number }>>([])
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    loadAllStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  const loadAllStats = async () => {
    setLoadingStats(true)
    
    // Cargar todas las estadísticas en paralelo
    const [
      statsResult,
      kpisResult,
      asistenciaDiaResult,
      distribucionResult,
      empleadosResult,
    ] = await Promise.all([
      getEstadisticasDia(fecha),
      getKPIs(fecha),
      getAsistenciaPorDia(7),
      getDistribucionEventos(fecha),
      getAsistenciaPorEmpleado(fecha),
    ])

    if (statsResult.success && statsResult.data) {
      setEstadisticas(statsResult.data)
    }

    if (kpisResult.success && kpisResult.data) {
      setKPIs(kpisResult.data)
    }

    if (asistenciaDiaResult.success && asistenciaDiaResult.data) {
      setAsistenciaPorDia(asistenciaDiaResult.data)
    }

    if (distribucionResult.success && distribucionResult.data) {
      setDistribucionEventos(distribucionResult.data)
    }

    if (empleadosResult.success && empleadosResult.data) {
      setAsistenciaPorEmpleado(empleadosResult.data)
    }

    setLoadingStats(false)
  }

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFecha = new Date(e.target.value)
    setFecha(newFecha)
  }

  // Solo mostrar loading si está cargando las estadísticas, no el auth
  if (loadingStats) {
    return <Loading />
  }

  // Formatear datos para gráficas
  const asistenciaPorDiaFormatted = asistenciaPorDia.map((item) => ({
    fecha: format(new Date(item.fecha), 'dd/MM', { locale: es }),
    entradas: item.entradas,
    salidas: item.salidas,
  }))

  const distribucionFormatted = distribucionEventos.map((item) => ({
    name: TIPOS_EVENTO_LABELS[item.tipo as keyof typeof TIPOS_EVENTO_LABELS] || item.tipo,
    value: item.cantidad,
    color: TIPOS_EVENTO_COLORS[item.tipo as keyof typeof TIPOS_EVENTO_COLORS] || '',
  }))

  const empleadosFormatted = asistenciaPorEmpleado.slice(0, 10).map((item) => ({
    nombre: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
    registros: item.registros,
  }))

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
        <Button onClick={loadAllStats} variant="outline" className="mt-6">
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.tasaAsistencia}%</div>
              <p className="text-xs text-muted-foreground">
                {kpis.empleadosConEntrada} de {kpis.totalEmpleados} empleados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empleados Presentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas?.empleadosPresentes || 0}</div>
              <p className="text-xs text-muted-foreground">Actualmente en el trabajo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Almuerzo</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas?.empleadosEnAlmuerzo || 0}</div>
              <p className="text-xs text-muted-foreground">Fuera por almuerzo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalRegistros}</div>
              <p className="text-xs text-muted-foreground">
                {kpis.entradas} entradas, {kpis.salidas} salidas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de líneas: Asistencia por día */}
        <Card>
          <CardHeader>
            <CardTitle>Asistencia por Día (Últimos 7 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={asistenciaPorDiaFormatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entradas" stroke="#10b981" name="Entradas" />
                <Line type="monotone" dataKey="salidas" stroke="#ef4444" name="Salidas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de pastel: Distribución de eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Eventos del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distribucionFormatted}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distribucionFormatted.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de barras: Eventos por tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionFormatted}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfica de barras: Asistencia por empleado */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Empleados con Más Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={empleadosFormatted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="registros" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de registros */}
      {estadisticas && (
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
      )}
    </div>
  )
}
