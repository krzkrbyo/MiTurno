import { useState, useRef } from 'react'
import { Upload, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  showUpload?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-24 w-24',
}

export function ProfileAvatar({ size = 'md', showUpload = false, className }: ProfileAvatarProps) {
  const { profile, setProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = profile?.avatar_url
  const displayUrl = preview || avatarUrl

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    await uploadAvatar(file)
  }

  async function uploadAvatar(file: File) {
    if (!profile) {
      toast.error('No hay perfil disponible')
      return
    }

    try {
      setUploading(true)

      // Eliminar avatar anterior si existe
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // Subir nuevo avatar
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      // Actualizar estado local
      setProfile({ ...profile, avatar_url: publicUrl })
      setPreview(null)
      toast.success('Foto de perfil actualizada')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Error al subir la foto')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleRemoveAvatar() {
    if (!profile || !avatarUrl) return

    try {
      setUploading(true)

      // Eliminar de storage
      const oldPath = avatarUrl.split('/').slice(-2).join('/')
      await supabase.storage.from('avatars').remove([oldPath])

      // Actualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, avatar_url: null })
      toast.success('Foto de perfil eliminada')
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      toast.error('Error al eliminar la foto')
    } finally {
      setUploading(false)
    }
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'relative rounded-full bg-primary/10 flex items-center justify-center overflow-hidden',
          sizeClasses[size],
          size === 'lg' && 'ring-4 ring-primary/20'
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={profile?.full_name || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn('text-primary', size === 'lg' ? 'h-12 w-12' : 'h-6 w-6')} />
        )}
        {!displayUrl && (
          <span
            className={cn(
              'text-primary font-semibold',
              size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-sm' : 'text-xs'
            )}
          >
            {initials}
          </span>
        )}
      </div>

      {showUpload && profile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {avatarUrl && (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={handleRemoveAvatar}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
        </motion.div>
      )}
    </div>
  )
}

