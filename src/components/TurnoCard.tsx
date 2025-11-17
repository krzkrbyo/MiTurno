import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { Phone, CheckCircle, XCircle, Clock, User, MapPin, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Turno } from '@/types/turno'
import { ESTADOS_TURNO_LABELS, ESTADOS_TURNO_COLORS } from '@/lib/constants'
import { generateQRPayload } from '@/lib/qr'
import { useAuth } from '@/features/auth/hooks/useAuth'

interface TurnoCardProps {
  turno: Turno
  onLlamar?: (turno: Turno) => void
  onAtender?: (turno: Turno) => void
  onCompletar?: (turno: Turno) => void
  onCancelar?: (turno: Turno) => void
}

export function TurnoCard({
  turno,
  onLlamar,
  onAtender,
  onCompletar,
  onCancelar,
}: TurnoCardProps) {
  const { isAdmin, isAgente } = useAuth()
  const canManage = isAdmin || isAgente

  const qrPayload = generateQRPayload(turno.id)
  const qrData = JSON.stringify(qrPayload)

  const estadoLabel = ESTADOS_TURNO_LABELS[turno.estado]
  const estadoColor = ESTADOS_TURNO_COLORS[turno.estado]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-heading">Turno {turno.codigo}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{turno.cliente}</p>
            </div>
            <Badge className={estadoColor}>{estadoLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información del turno */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Sucursal:</span>
                <span>{turno.sucursal?.nombre || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Servicio:</span>
                <span>{turno.servicio?.nombre || 'N/A'}</span>
              </div>
              {turno.scheduled_for && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Programado:</span>
                  <span>{new Date(turno.scheduled_for).toLocaleString('es-ES')}</span>
                </div>
              )}
              {turno.atendido_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-medium">Atendido:</span>
                  <span>{new Date(turno.atendido_at).toLocaleString('es-ES')}</span>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <QRCodeSVG value={qrData} size={150} level="M" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Escanea para validar
              </p>
            </div>
          </div>

          {/* Acciones */}
          {canManage && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {turno.estado === 'en_cola' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAtender?.(turno)}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Atender
                </Button>
              )}
              {turno.estado === 'pendiente' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onLlamar?.(turno)}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </Button>
              )}
              {turno.estado === 'atendiendo' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onCompletar?.(turno)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Completar
                </Button>
              )}
              {turno.estado !== 'completado' && turno.estado !== 'cancelado' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onCancelar?.(turno)}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

