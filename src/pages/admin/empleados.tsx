import { useState } from 'react'
import { Plus, Edit, Trash2, QrCode, User, Printer, Database as DatabaseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEmpleados } from '@/features/empleados/hooks/useEmpleados'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Loading } from '@/components/Loading'
import { QRCodeSVG } from 'qrcode.react'
import { generateQRCode } from '@/lib/qr'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { populateSampleData } from '@/lib/sample-data'
import type { Database } from '@/types/db'

type Empleado = Database['public']['Tables']['empleados']['Row']

export function EmpleadosPage() {
  const { empleados, loading, createEmpleado, updateEmpleado, deleteEmpleado, loadEmpleados } = useEmpleados()
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
  const [loadingSample, setLoadingSample] = useState(false)

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

        if (result.success) {
          const empleadoData = (result as { success: true; data: Empleado }).data
          const empleadoId = empleadoData.id
          setNewEmpleadoId(empleadoId)

          // Subir foto si existe
          if (formData.foto) {
            fotoUrl = await uploadFoto(formData.foto, empleadoId)
            // Actualizar empleado con la URL de la foto
            await updateEmpleado(empleadoId, { foto_url: fotoUrl })
          }

          // Generar QR con el PIN del empleado
          if (empleadoData.pin) {
            const qrCode = generateQRCode(empleadoData.pin)
            setQrPreview(qrCode)
            setQrDialogOpen(true) // Mostrar diálogo de QR
          }
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

  const handlePopulateSampleData = async () => {
    if (!user?.id) {
      toast.error('Usuario no autenticado')
      return
    }

    if (!confirm('¿Estás seguro? Esto creará 15 empleados de ejemplo y registros de asistencia para los últimos 7 días. Si ya existen empleados, se cancelará la operación.')) {
      return
    }

    setLoadingSample(true)
    try {
      const result = await populateSampleData(user.id, 7)
      if (result.success) {
        await loadEmpleados()
      }
    } catch (error: any) {
      console.error('Error populating sample data:', error)
      toast.error('Error al poblar datos de ejemplo')
    } finally {
      setLoadingSample(false)
    }
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePopulateSampleData}
            disabled={loadingSample}
          >
            <DatabaseIcon className="mr-2 h-4 w-4" />
            {loadingSample ? 'Cargando...' : 'Datos de Ejemplo'}
          </Button>
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
                {empleado.pin && (
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">PIN</p>
                    <p className="text-lg font-bold font-mono">{empleado.pin}</p>
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
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Badge de Identificación - {empleado.nombre_completo}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Vista previa del badge */}
                      <div id={`badge-${empleado.id}`} className="badge-print bg-white border-2 border-gray-300 rounded-xl p-8 mx-auto max-w-sm shadow-lg">
                        <div className="flex flex-col items-center space-y-5">
                          {/* Foto circular */}
                          {empleado.foto_url ? (
                            <img
                              src={empleado.foto_url}
                              alt={empleado.nombre_completo}
                              className="w-36 h-36 rounded-full object-cover border-4 border-primary shadow-md"
                            />
                          ) : (
                            <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary shadow-md">
                              <span className="text-6xl font-bold text-primary">
                                {empleado.nombre_completo.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {/* Nombre completo */}
                          <div className="text-center w-full">
                            <h3 className="text-2xl font-bold font-heading text-gray-900 leading-tight">
                              {empleado.nombre_completo}
                            </h3>
                            {empleado.pin && (
                              <p className="text-sm text-muted-foreground mt-2 font-mono">PIN: {empleado.pin}</p>
                            )}
                          </div>
                          
                          {/* Código QR */}
                          <div className="flex flex-col items-center space-y-2 pt-2">
                            <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                              <QRCodeSVG 
                                value={empleado.pin ? generateQRCode(empleado.pin) : ''} 
                                size={180}
                                level="M"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-center font-medium">
                              Código de Identificación
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="flex gap-2 justify-center print:hidden">
                        <Button
                          onClick={() => {
                            const badgeElement = document.getElementById(`badge-${empleado.id}`)
                            if (badgeElement) {
                              // Ocultar todos los badges excepto el que se va a imprimir
                              document.querySelectorAll('.badge-print').forEach((el) => {
                                if (el.id !== `badge-${empleado.id}`) {
                                  el.classList.add('hidden')
                                }
                              })
                              setTimeout(() => {
                                window.print()
                                // Restaurar visibilidad después de imprimir
                                document.querySelectorAll('.badge-print').forEach((el) => {
                                  el.classList.remove('hidden')
                                })
                              }, 100)
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Imprimir Badge
                        </Button>
                      </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Badge de Identificación Generado</DialogTitle>
          </DialogHeader>
          {qrPreview && newEmpleadoId && (() => {
            const nuevoEmpleado = empleados.find(e => e.id === newEmpleadoId)
            if (!nuevoEmpleado) return null
            
            return (
              <div className="space-y-4">
                {/* Vista previa del badge */}
                <div id={`badge-new-${newEmpleadoId}`} className="badge-print bg-white border-2 border-gray-300 rounded-xl p-8 mx-auto max-w-sm shadow-lg">
                  <div className="flex flex-col items-center space-y-5">
                    {/* Foto circular */}
                    {nuevoEmpleado.foto_url ? (
                      <img
                        src={nuevoEmpleado.foto_url}
                        alt={nuevoEmpleado.nombre_completo}
                        className="w-36 h-36 rounded-full object-cover border-4 border-primary shadow-md"
                      />
                    ) : (
                      <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary shadow-md">
                        <span className="text-6xl font-bold text-primary">
                          {nuevoEmpleado.nombre_completo.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Nombre completo */}
                    <div className="text-center w-full">
                      <h3 className="text-2xl font-bold font-heading text-gray-900 leading-tight">
                        {nuevoEmpleado.nombre_completo}
                      </h3>
                      {nuevoEmpleado.pin && (
                        <p className="text-sm text-muted-foreground mt-2 font-mono">PIN: {nuevoEmpleado.pin}</p>
                      )}
                    </div>
                    
                    {/* Código QR */}
                    <div className="flex flex-col items-center space-y-2 pt-2">
                      <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
                        <QRCodeSVG 
                          value={qrPreview} 
                          size={180}
                          level="M"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center font-medium">
                        Código de Identificación
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-2 justify-center print:hidden">
                  <Button
                    onClick={() => {
                      const badgeElement = document.getElementById(`badge-new-${newEmpleadoId}`)
                      if (badgeElement) {
                        // Ocultar todos los badges excepto el que se va a imprimir
                        document.querySelectorAll('.badge-print').forEach((el) => {
                          if (el.id !== `badge-new-${newEmpleadoId}`) {
                            el.classList.add('hidden')
                          }
                        })
                        setTimeout(() => {
                          window.print()
                          // Restaurar visibilidad después de imprimir
                          document.querySelectorAll('.badge-print').forEach((el) => {
                            el.classList.remove('hidden')
                          })
                        }, 100)
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Badge
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrDialogOpen(false)
                      setIsDialogOpen(false) // Cerrar también el diálogo de creación
                      setQrPreview(null)
                      setNewEmpleadoId(null)
                      setEditingEmpleado(null)
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
      
      {/* Estilos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .badge-print:not(.hidden),
          .badge-print:not(.hidden) * {
            visibility: visible;
          }
          .badge-print:not(.hidden) {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 85.6mm; /* Tamaño estándar de tarjeta de identificación */
            max-width: 85.6mm;
            page-break-after: always;
            page-break-inside: avoid;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

