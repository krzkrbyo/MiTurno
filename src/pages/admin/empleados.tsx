import { useState } from 'react'
import { Plus, Edit, Trash2, QrCode, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEmpleados } from '@/features/empleados/hooks/useEmpleados'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Loading } from '@/components/Loading'
import { QRCodeSVG } from 'qrcode.react'
import { generateQRPayload } from '@/lib/qr'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Database } from '@/types/db'

type Empleado = Database['public']['Tables']['empleados']['Row']

export function EmpleadosPage() {
  const { empleados, loading, createEmpleado, updateEmpleado, deleteEmpleado } = useEmpleados()
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    foto: null as File | null,
  })
  const [uploading, setUploading] = useState(false)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [newEmpleadoId, setNewEmpleadoId] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, foto: e.target.files[0] })
    }
  }

  const uploadFoto = async (file: File, empleadoId: string): Promise<string | null> => {
    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${empleadoId}-${Date.now()}.${fileExt}`
      const filePath = `empleados/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('empleados')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('empleados').getPublicUrl(filePath)
      return data.publicUrl
    } catch (error: any) {
      console.error('Error uploading foto:', error)
      toast.error('Error al subir la foto')
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setUploading(true)
      let fotoUrl: string | null = null

      if (editingEmpleado) {
        // Actualizar empleado
        // Subir foto si existe
        if (formData.foto) {
          fotoUrl = await uploadFoto(formData.foto, editingEmpleado.id)
        }

        await updateEmpleado(editingEmpleado.id, {
          nombre_completo: formData.nombre_completo,
          foto_url: fotoUrl || editingEmpleado.foto_url,
        })

        // Si es edición, cerrar el diálogo normalmente
        setIsDialogOpen(false)
        setFormData({ nombre_completo: '', foto: null })
        setEditingEmpleado(null)
      } else {
        // Crear nuevo empleado primero
        const codigo_qr = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const result = await createEmpleado({
          nombre_completo: formData.nombre_completo,
          codigo_qr,
          foto_url: null, // Se actualizará después de subir la foto
          created_by: user.id,
        })

        if (result.success && result.data) {
          const empleadoId = result.data.id
          setNewEmpleadoId(empleadoId)

          // Subir foto si existe
          if (formData.foto) {
            fotoUrl = await uploadFoto(formData.foto, empleadoId)
            // Actualizar empleado con la URL de la foto
            await updateEmpleado(empleadoId, { foto_url: fotoUrl })
          }

          // Generar QR con el ID del empleado
          const qrPayload = generateQRPayload(empleadoId)
          setQrPreview(JSON.stringify(qrPayload))
          setQrDialogOpen(true) // Mostrar diálogo de QR
          // No cerrar el diálogo de creación, solo resetear el formulario
          setFormData({ nombre_completo: '', foto: null })
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar empleado')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado)
    setFormData({
      nombre_completo: empleado.nombre_completo,
      foto: null,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      await deleteEmpleado(id)
    }
  }

  const handleToggleActivo = async (empleado: Empleado) => {
    await updateEmpleado(empleado.id, { activo: !empleado.activo })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Empleados</h1>
          <p className="text-muted-foreground">Gestiona los empleados y sus códigos QR</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEmpleado(null)
              setFormData({ nombre_completo: '', foto: null })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">Foto de Perfil</Label>
                <Input
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading} className="flex-1">
                  {uploading ? 'Guardando...' : editingEmpleado ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleados.map((empleado) => (
          <Card key={empleado.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{empleado.nombre_completo}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(empleado)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(empleado.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {empleado.foto_url ? (
                  <img
                    src={empleado.foto_url}
                    alt={empleado.nombre_completo}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${empleado.activo ? 'text-green-600' : 'text-red-600'}`}>
                    {empleado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActivo(empleado)}
                  >
                    {empleado.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <QrCode className="mr-2 h-4 w-4" />
                      Ver QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>QR de {empleado.nombre_completo}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4">
                      <QRCodeSVG value={JSON.stringify(generateQRPayload(empleado.id))} size={256} />
                      <p className="text-sm text-muted-foreground text-center">
                        Código QR único para {empleado.nombre_completo}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empleados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay empleados registrados</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Empleado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diálogo para mostrar QR después de crear empleado */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Generado</DialogTitle>
          </DialogHeader>
          {qrPreview && newEmpleadoId && (
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG value={qrPreview} size={256} />
              <p className="text-sm text-muted-foreground text-center">
                Guarda este QR para el empleado. Puedes imprimirlo o descargarlo.
              </p>
              <Button
                onClick={() => {
                  setQrDialogOpen(false)
                  setIsDialogOpen(false) // Cerrar también el diálogo de creación
                  setQrPreview(null)
                  setNewEmpleadoId(null)
                  setEditingEmpleado(null)
                }}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

