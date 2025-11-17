import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loading } from '@/components/Loading'
import { ROLES, type Role } from '@/lib/constants'
import { useAuthStore } from '@/lib/store'
import { useEffect, useState } from 'react'

interface PrivateRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

/**
 * Componente para proteger rutas que requieren autenticación
 */
export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, profile } = useAuth()
  const { loading, initialized } = useAuthStore()
  const location = useLocation()

  // Mostrar loading mientras se inicializa o carga
  if (loading || !initialized) {
    return <Loading />
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar roles si se especifican
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
