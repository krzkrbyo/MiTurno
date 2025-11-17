import { create } from 'zustand'
import type { User, Profile } from '@/types/auth'
import { supabase } from './supabase'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

/**
 * Store de autenticación con Zustand
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false, // Cambiar a false por defecto
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false })
  },
}))
