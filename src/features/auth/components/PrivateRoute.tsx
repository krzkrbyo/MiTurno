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
  const { loading } = useAuthStore()
  const location = useLocation()
  const [initialCheck, setInitialCheck] = useState(true)

  // Esperar un momento para que la inicialización termine
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheck(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Mostrar loading solo durante la verificación inicial
  if (initialCheck && loading) {
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
