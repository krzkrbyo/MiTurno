import { supabase } from './supabase'
import { useAuthStore } from './store'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User, Profile } from '@/types/auth'
import type { Database } from '@/types/db'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

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
      const profileData: ProfileInsert = {
        id: supabaseUser.id,
        full_name: supabaseUser.email?.split('@')[0] || null,
        role: 'admin',
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData as any)
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
    console.log('initializeAuth: Already initialized, skipping...')
    return
  }
  initialized = true

  console.log('initializeAuth: Starting initialization...')
  const { setLoading, setInitialized, user, profile } = useAuthStore.getState()
  
  // Verificar sesión inicial
  const checkSession = async () => {
    try {
      console.log('initializeAuth: Checking Supabase session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('initializeAuth: Error getting session:', error)
        useAuthStore.getState().setUser(null)
        useAuthStore.getState().setProfile(null)
        setLoading(false)
        setInitialized(true)
        return
      }

      if (session?.user) {
        console.log('initializeAuth: Session found, user ID:', session.user.id)
        
        // Verificar si necesitamos recargar el perfil
        const currentState = useAuthStore.getState()
        const needsReload = !currentState.user || 
                           !currentState.profile || 
                           currentState.user.id !== session.user.id
        
        if (needsReload) {
          console.log('initializeAuth: Loading profile...')
          setLoading(true)
          const loaded = await loadUserProfile(session.user)
          setLoading(false)
          
          if (!loaded) {
            console.error('initializeAuth: Failed to load profile')
            useAuthStore.getState().setUser(null)
            useAuthStore.getState().setProfile(null)
          }
        } else {
          console.log('initializeAuth: User and profile already loaded, skipping reload')
        }
      } else {
        console.log('initializeAuth: No session found')
        // Limpiar datos obsoletos
        if (user || profile) {
          console.log('initializeAuth: Clearing stale data')
          useAuthStore.getState().setUser(null)
          useAuthStore.getState().setProfile(null)
        }
      }
      
      setLoading(false)
      setInitialized(true)
    } catch (error) {
      console.error('initializeAuth: Exception in checkSession:', error)
      setLoading(false)
      setInitialized(true)
    }
  }

  // Ejecutar verificación de sesión
  checkSession()

  // Escuchar cambios de autenticación solo una vez
  if (!authSubscription) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      const { setLoading, setUser, setProfile, user: currentUser } = useAuthStore.getState()
      
      // Solo procesar eventos relevantes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Solo recargar si el usuario cambió o no hay perfil
          const needsReload = !currentUser || currentUser.id !== session.user.id
          
          if (needsReload) {
            console.log('Auth state change: Loading profile for new user')
            setLoading(true)
            const loaded = await loadUserProfile(session.user)
            setLoading(false)
            
            if (!loaded) {
              setUser(null)
              setProfile(null)
            }
          } else {
            console.log('Auth state change: User already loaded, skipping reload')
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Auth state change: User signed out')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })
    
    authSubscription = subscription
  }
}

export { loadUserProfile }
