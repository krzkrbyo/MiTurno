import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { loadUserProfile } from '@/lib/auth-init'
import { toast } from 'sonner'

/**
 * Hook para manejar la autenticación
 */
export function useAuth() {
  const { user, profile, loading, setProfile, setLoading, signOut } = useAuthStore()

  async function signIn(email: string, password: string) {
    try {
      setLoading(true)
      console.log('SignIn: Starting authentication...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('SignIn: Authentication error:', error)
        setLoading(false)
        throw error
      }

      if (!data.user) {
        console.error('SignIn: No user returned')
        setLoading(false)
        return { success: false, error: 'Error desconocido: no se recibió usuario' }
      }

      console.log('SignIn: User authenticated, loading profile...')
      
      // Esperar a que el perfil se cargue completamente
      const profileLoaded = await loadUserProfile(data.user)
      
      setLoading(false)
      
      if (profileLoaded) {
        console.log('SignIn: Profile loaded successfully')
        toast.success('Sesión iniciada correctamente')
        
        // Pequeño delay para asegurar que el estado se propaga
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return { success: true }
      } else {
        console.error('SignIn: Failed to load profile')
        toast.error('Error al cargar el perfil')
        return { success: false, error: 'Error al cargar el perfil' }
      }
    } catch (error: any) {
      console.error('SignIn: Exception:', error)
      setLoading(false)
      const errorMessage = error.message || 'Error al iniciar sesión'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async function signUp(email: string, password: string, fullName?: string) {
    try {
      setLoading(true)
      console.log('Starting sign up for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        // Manejar rate limiting específicamente
        if (error.message?.includes('rate limit') || error.message?.includes('seconds')) {
          throw new Error('Demasiados intentos. Por favor espera unos momentos antes de intentar nuevamente.')
        }
        throw error
      }

      if (!data.user) {
        console.error('No user returned from sign up')
        return { success: false, error: 'Error desconocido: no se recibió usuario' }
      }

      console.log('User created, user ID:', data.user.id)
      console.log('Session after signup:', data.session ? 'Active' : 'None (email confirmation may be required)')
      
      // El perfil se crea automáticamente mediante un trigger en la base de datos
      // Solo intentar actualizar el nombre si hay sesión activa y el perfil existe
      if (data.session) {
        // Esperar un momento para que el trigger cree el perfil
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Intentar actualizar el nombre del perfil si existe
        const { error: updateError } = await supabase
          .from('profiles')
          // @ts-expect-error - Supabase type inference issue
          .update({ full_name: fullName || null } as any)
          .eq('id', data.user.id)

        if (updateError && updateError.code !== 'PGRST116') {
          // PGRST116 = no rows updated, que es OK si el perfil aún no existe
          console.warn('Could not update profile name (may not exist yet):', updateError)
        } else {
          console.log('Profile name updated or will be created by trigger')
        }
      } else {
        console.log('No active session - email confirmation may be required. Profile will be created by trigger when user confirms email.')
      }

      // Retornar información sobre si el usuario necesita confirmar email
      return { 
        success: true, 
        requiresEmailConfirmation: !data.session,
        user: data.user 
      }
    } catch (error: any) {
      console.error('Sign up exception:', error)
      const errorMessage = error.message || 'Error al crear cuenta'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      console.log('Sign up finally: setting loading to false')
      setLoading(false)
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    setProfile,
    isAuthenticated: !!user && !!profile,
    isAdmin: profile?.role === 'admin',
  }
}
