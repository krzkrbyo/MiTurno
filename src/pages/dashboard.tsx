import { useTurnos } from '@/features/turnos/hooks/useTurnos'
import { useSucursales } from '@/features/turnos/hooks/useSucursales'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { ESTADOS_TURNO } from '@/lib/constants'
import { Loading } from '@/components/Loading'
import { motion } from 'framer-motion'

export function DashboardPage() {
  const { turnos, loading } = useTurnos()
  const { sucursales } = useSucursales()

  if (loading) {
    return <Loading />
  }

  const stats = {
    total: turnos.length,
    enCola: turnos.filter((t) => t.estado === ESTADOS_TURNO.EN_COLA).length,
    atendiendo: turnos.filter((t) => t.estado === ESTADOS_TURNO.ATENDIENDO).length,
    completados: turnos.filter((t) => t.estado === ESTADOS_TURNO.COMPLETADO).length,
    cancelados: turnos.filter((t) => t.estado === ESTADOS_TURNO.CANCELADO).length,
  }

  const statsCards = [
    {
      title: 'Total Turnos',
      value: stats.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'En Cola',
      value: stats.enCola,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Atendiendo',
      value: stats.atendiendo,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Completados',
      value: stats.completados,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Cancelados',
      value: stats.cancelados,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de turnos y estadísticas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Sucursales Activas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sucursales.length === 0 ? (
              <p className="text-muted-foreground">No hay sucursales registradas</p>
            ) : (
              sucursales.map((sucursal) => (
                <Badge key={sucursal.id} variant="secondary">
                  {sucursal.nombre}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

