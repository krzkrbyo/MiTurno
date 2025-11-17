import { useEffect, useState } from 'react'
import { useRegistrosAsistencia } from '@/features/empleados/hooks/useRegistrosAsistencia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, UtensilsCrossed, LogIn } from 'lucide-react'
import { Loading } from '@/components/Loading'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function DashboardPage() {
  const { getEstadisticasDia } = useRegistrosAsistencia()
  const [estadisticas, setEstadisticas] = useState<{
    totalRegistros: number
    empleadosPresentes: number
    empleadosEnAlmuerzo: number
    registros: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    const result = await getEstadisticasDia()
    if (result.success && result.data) {
      setEstadisticas(result.data)
    }
    setLoading(false)
  }

  if (loading) {
    return <Loading />
  }

  const statsCards = [
    {
      title: 'Empleados Presentes',
      value: estadisticas?.empleadosPresentes || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Actualmente en el trabajo',
    },
    {
      title: 'En Almuerzo',
      value: estadisticas?.empleadosEnAlmuerzo || 0,
      icon: UtensilsCrossed,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Fuera por almuerzo',
    },
    {
      title: 'Total Registros Hoy',
      value: estadisticas?.totalRegistros || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: `Registros del ${format(new Date(), 'dd MMMM', { locale: es })}`,
    },
  ]

  const ultimosRegistros = estadisticas?.registros.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de asistencia del día</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Últimos Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {ultimosRegistros.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay registros para hoy
            </p>
          ) : (
            <div className="space-y-2">
              {ultimosRegistros.map((registro: any) => (
                <div
                  key={registro.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {registro.empleados?.nombre_completo || 'Empleado desconocido'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(registro.fecha_hora), 'PPpp', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {registro.tipo_evento}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
