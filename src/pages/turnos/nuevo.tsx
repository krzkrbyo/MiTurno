import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TurnoForm } from '@/components/TurnoForm'
import { useTurnos } from '@/features/turnos/hooks/useTurnos'
import type { TurnoFormData } from '@/types/turno'

export function NuevoTurnoPage() {
  const navigate = useNavigate()
  const { createTurno } = useTurnos()

  async function handleSubmit(data: TurnoFormData) {
    const result = await createTurno(data)
    if (result.success) {
      navigate('/turnos')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/turnos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Nuevo Turno</h1>
          <p className="text-muted-foreground">Crea un nuevo turno en el sistema</p>
        </div>
      </div>

      <TurnoForm onSubmit={handleSubmit} onCancel={() => navigate('/turnos')} />
    </div>
  )
}

