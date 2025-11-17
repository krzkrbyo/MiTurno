import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSucursales } from '@/features/turnos/hooks/useSucursales'
import { useServicios } from '@/features/turnos/hooks/useServicios'
import { LoadingSpinner } from '@/components/Loading'

const turnoSchema = z.object({
  cliente: z.string().min(1, 'El nombre del cliente es requerido'),
  servicio_id: z.string().min(1, 'Debe seleccionar un servicio'),
  sucursal_id: z.string().min(1, 'Debe seleccionar una sucursal'),
  scheduled_for: z.string().optional().nullable(),
  notas: z.string().optional(),
})

type TurnoFormData = z.infer<typeof turnoSchema>

interface TurnoFormProps {
  onSubmit: (data: TurnoFormData) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<TurnoFormData>
}

export function TurnoForm({ onSubmit, onCancel, initialData }: TurnoFormProps) {
  const { sucursales, loading: loadingSucursales } = useSucursales()
  const { servicios, loading: loadingServicios } = useServicios()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    defaultValues: initialData || {
      cliente: '',
      servicio_id: '',
      sucursal_id: '',
      scheduled_for: null,
      notas: '',
    },
  })

  const servicioId = watch('servicio_id')
  const sucursalId = watch('sucursal_id')

  async function handleFormSubmit(data: TurnoFormData) {
    await onSubmit(data)
  }

  if (loadingSucursales || loadingServicios) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner className="mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Nuevo Turno</CardTitle>
          <CardDescription>Complete los datos para crear un nuevo turno</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Input
                id="cliente"
                {...register('cliente')}
                placeholder="Nombre del cliente"
                aria-invalid={errors.cliente ? 'true' : 'false'}
              />
              {errors.cliente && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.cliente.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sucursal_id">Sucursal *</Label>
              <Select
                value={sucursalId}
                onValueChange={(value) => setValue('sucursal_id', value)}
              >
                <SelectTrigger id="sucursal_id" aria-invalid={errors.sucursal_id ? 'true' : 'false'}>
                  <SelectValue placeholder="Seleccione una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((sucursal) => (
                    <SelectItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sucursal_id && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.sucursal_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="servicio_id">Servicio *</Label>
              <Select
                value={servicioId}
                onValueChange={(value) => setValue('servicio_id', value)}
              >
                <SelectTrigger id="servicio_id" aria-invalid={errors.servicio_id ? 'true' : 'false'}>
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.nombre} ({servicio.duracion_min} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servicio_id && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.servicio_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_for">Fecha y Hora Programada (Opcional)</Label>
              <Input
                id="scheduled_for"
                type="datetime-local"
                {...register('scheduled_for')}
                aria-invalid={errors.scheduled_for ? 'true' : 'false'}
              />
              {errors.scheduled_for && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.scheduled_for.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas (Opcional)</Label>
              <Input
                id="notas"
                {...register('notas')}
                placeholder="Notas adicionales"
                aria-invalid={errors.notas ? 'true' : 'false'}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creando...' : 'Crear Turno'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

