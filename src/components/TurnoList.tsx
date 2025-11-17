import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TurnoCard } from './TurnoCard'
import { EmptyState } from './EmptyState'
import { Loading } from './Loading'
import { FileQuestion } from 'lucide-react'
import type { Turno, TurnoFilters } from '@/types/turno'
import { ESTADOS_TURNO, ESTADOS_TURNO_LABELS, type EstadoTurno } from '@/lib/constants'
import { useSucursales } from '@/features/turnos/hooks/useSucursales'
import { useTurnos } from '@/features/turnos/hooks/useTurnos'

interface TurnoListProps {
  onLlamar?: (turno: Turno) => void
  onAtender?: (turno: Turno) => void
  onCompletar?: (turno: Turno) => void
  onCancelar?: (turno: Turno) => void
}

export function TurnoList({
  onLlamar,
  onAtender,
  onCompletar,
  onCancelar,
}: TurnoListProps) {
  const [filters, setFilters] = useState<TurnoFilters>({})
  const [searchTerm, setSearchTerm] = useState('')

  const { sucursales } = useSucursales()
  const { turnos, loading, updateTurnoEstado } = useTurnos({
    ...filters,
    search: searchTerm || undefined,
  })

  async function handleAtender(turno: Turno) {
    await updateTurnoEstado(turno.id, 'atendiendo')
    onAtender?.(turno)
  }

  async function handleLlamar(turno: Turno) {
    await updateTurnoEstado(turno.id, 'en_cola')
    onLlamar?.(turno)
  }

  async function handleCompletar(turno: Turno) {
    await updateTurnoEstado(turno.id, 'completado')
    onCompletar?.(turno)
  }

  async function handleCancelar(turno: Turno) {
    await updateTurnoEstado(turno.id, 'cancelado')
    onCancelar?.(turno)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.sucursal_id || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, sucursal_id: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {sucursales.map((sucursal) => (
              <SelectItem key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.estado || 'all'}
          onValueChange={(value) =>
            setFilters({ ...filters, estado: value === 'all' ? undefined : (value as EstadoTurno) })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ESTADOS_TURNO_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de turnos */}
      {turnos.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="No se encontraron turnos"
          description="No hay turnos que coincidan con los filtros seleccionados"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turnos.map((turno) => (
            <TurnoCard
              key={turno.id}
              turno={turno}
              onLlamar={handleLlamar}
              onAtender={handleAtender}
              onCompletar={handleCompletar}
              onCancelar={handleCancelar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

