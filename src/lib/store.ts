import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Profile } from '@/types/auth'
import { supabase } from './supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signOut: () => Promise<void>
}

/**
 * Store de autenticación con Zustand y persistencia en localStorage usando middleware
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true, // Iniciar con loading true para verificar sesión
      initialized: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),
      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null, loading: false, initialized: false })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir user y profile, no loading ni initialized
        user: state.user,
        profile: state.profile,
      }),
      // Sincronizar cambios entre pestañas
      onRehydrateStorage: () => (state) => {
        console.log('Store rehydrated from localStorage:', {
          hasUser: !!state?.user,
          hasProfile: !!state?.profile,
        })
        // El estado se rehidrata, pero loading e initialized se resetean
        if (state) {
          state.loading = true
          state.initialized = false
        }
      },
    }
  )
)

// Sincronizar cambios entre pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth-storage' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue)
        const currentState = useAuthStore.getState()
        
        // Solo actualizar si hay cambios reales
        if (
          JSON.stringify(currentState.user) !== JSON.stringify(newState.state?.user) ||
          JSON.stringify(currentState.profile) !== JSON.stringify(newState.state?.profile)
        ) {
          console.log('Storage event: Syncing auth state from another tab')
          useAuthStore.setState({
            user: newState.state?.user || null,
            profile: newState.state?.profile || null,
          })
        }
      } catch (error) {
        console.error('Error parsing storage event:', error)
      }
    }
  })
}
