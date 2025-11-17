import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TurnoList } from '@/components/TurnoList'
import { toast } from 'sonner'
import type { Turno } from '@/types/turno'

export function TurnosPage() {
  const navigate = useNavigate()

  function handleLlamar(turno: Turno) {
    toast.success(`Llamando a ${turno.cliente} - Turno ${turno.codigo}`)
  }

  function handleAtender(turno: Turno) {
    toast.success(`Atendiendo a ${turno.cliente} - Turno ${turno.codigo}`)
  }

  function handleCompletar(turno: Turno) {
    toast.success(`Turno ${turno.codigo} completado`)
  }

  function handleCancelar(turno: Turno) {
    toast.info(`Turno ${turno.codigo} cancelado`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Turnos</h1>
          <p className="text-muted-foreground">Gestiona los turnos del sistema</p>
        </div>
        <Button onClick={() => navigate('/turnos/nuevo')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Turno
        </Button>
      </div>

      <TurnoList
        onLlamar={handleLlamar}
        onAtender={handleAtender}
        onCompletar={handleCompletar}
        onCancelar={handleCancelar}
      />
    </div>
  )
}

