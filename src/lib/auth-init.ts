import { supabase } from './supabase'
import { useAuthStore } from './store'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, Profile } from '@/types/auth'

let initialized = false
let authSubscription: any = null

async function loadUserProfile(supabaseUser: SupabaseUser): Promise<boolean> {
  const { setUser, setProfile } = useAuthStore.getState()
  
  try {
    console.log('loadUserProfile: Starting for user:', supabaseUser.id)
    
    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      profile: null,
    }

    // Cargar perfil
    console.log('loadUserProfile: Fetching profile from database...')
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    if (error) {
      console.error('loadUserProfile: Error loading profile:', error)
      console.log('loadUserProfile: Attempting to create default profile...')
      
      // Si no existe perfil, crear uno por defecto
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          full_name: supabaseUser.email?.split('@')[0] || null,
          role: 'cliente',
        })
        .select()
        .single()

      if (createError) {
        console.error('loadUserProfile: Error creating profile:', createError)
        // Si el perfil ya existe (duplicate key), intentar cargarlo de nuevo
        if (createError.code === '23505') {
          console.log('loadUserProfile: Profile already exists, loading it...')
          const { data: existingProfile, error: loadError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()
          
          if (loadError) {
            console.error('loadUserProfile: Error loading existing profile:', loadError)
            return false
          }
          
          if (existingProfile) {
            console.log('loadUserProfile: Existing profile loaded successfully')
            userData.profile = existingProfile as Profile
          } else {
            console.error('loadUserProfile: Existing profile not found after duplicate key error')
            return false
          }
        } else {
          console.error('loadUserProfile: Non-duplicate error creating profile:', createError)
          return false
        }
      } else {
        console.log('loadUserProfile: Profile created successfully')
        userData.profile = newProfile as Profile
      }
    } else {
      console.log('loadUserProfile: Profile loaded successfully')
      userData.profile = profileData as Profile
    }

    console.log('loadUserProfile: Setting user and profile in store')
    setUser(userData)
    setProfile(userData.profile)
    console.log('loadUserProfile: Successfully completed')
    return true
  } catch (error) {
    console.error('loadUserProfile: Exception caught:', error)
    return false
  }
}

export function initializeAuth() {
  if (initialized) {
    return
  }
  initialized = true

  // NO establecer loading aquí - dejar que cada componente maneje su propio loading

  // Verificar sesión inicial de forma asíncrona
  setTimeout(() => {
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        if (session?.user) {
          const { setLoading } = useAuthStore.getState()
          setLoading(true)
          loadUserProfile(session.user).finally(() => {
            setLoading(false)
          })
        }
      })
      .catch((error) => {
        console.error('Error in getSession promise:', error)
      })
  }, 100) // Pequeño delay para no bloquear el render inicial

  // Escuchar cambios de autenticación solo una vez
  if (!authSubscription) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const { setLoading, setUser, setProfile } = useAuthStore.getState()
      
      if (session?.user) {
        setLoading(true)
        await loadUserProfile(session.user)
        setLoading(false)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })
    
    authSubscription = subscription
  }
}

export { loadUserProfile }
