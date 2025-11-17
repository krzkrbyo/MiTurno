import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Save, User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ESTADOS_TURNO_LABELS } from '@/lib/constants'

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { profile, setProfile, user } = useAuth()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
  })

  // Actualizar formulario cuando cambie el perfil
  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name || '' })
    }
  }, [profile, reset])

  async function onSubmit(data: ProfileFormData) {
    if (!profile) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, full_name: data.full_name })
      toast.success('Perfil actualizado correctamente')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y foto de perfil</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Foto de perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Foto de Perfil</CardTitle>
            <CardDescription>Actualiza tu foto de perfil</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProfileAvatar size="lg" showUpload />
            <p className="text-sm text-muted-foreground text-center">
              Haz clic en la foto para subir una nueva imagen. Formatos: JPG, PNG, WEBP, GIF
              (máx. 5MB)
            </p>
          </CardContent>
        </Card>

        {/* Información del perfil */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Información Personal</CardTitle>
            <CardDescription>Actualiza tu información de perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  El email no se puede cambiar desde aquí
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Tu nombre completo"
                    className="pl-10"
                    {...register('full_name')}
                    aria-invalid={errors.full_name ? 'true' : 'false'}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-red-500" role="alert">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {profile.role === 'admin'
                      ? 'Administrador'
                      : profile.role === 'agente'
                        ? 'Agente'
                        : 'Cliente'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  El rol es asignado por un administrador
                </p>
              </div>

              <div className="space-y-2">
                <Label>Miembro desde</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

