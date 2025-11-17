import { Role } from '@/lib/constants'

/**
 * Perfil de usuario
 */
export interface Profile {
  id: string
  full_name: string | null
  role: Role
  avatar_url: string | null
  created_at: string
}

/**
 * Usuario autenticado con perfil
 */
export interface User {
  id: string
  email: string | undefined
  profile: Profile | null
}

