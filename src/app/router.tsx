import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layout'
import { PrivateRoute } from '@/features/auth/components/PrivateRoute'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { TurnosPage } from '@/pages/turnos'
import { NuevoTurnoPage } from '@/pages/turnos/nuevo'
import { ScanQRPage } from '@/pages/turnos/scan'
import { ProfilePage } from '@/pages/profile'
import { ROLES } from '@/lib/constants'

// Páginas de administración (básicas)
function AdminSucursalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading mb-2">Sucursales</h1>
      <p className="text-muted-foreground">Gestión de sucursales (próximamente)</p>
    </div>
  )
}

function AdminServiciosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading mb-2">Servicios</h1>
      <p className="text-muted-foreground">Gestión de servicios (próximamente)</p>
    </div>
  )
}

function AdminUsuariosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading mb-2">Usuarios</h1>
      <p className="text-muted-foreground">Gestión de usuarios (próximamente)</p>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'turnos',
        element: <TurnosPage />,
      },
      {
        path: 'turnos/nuevo',
        element: <NuevoTurnoPage />,
      },
      {
        path: 'turnos/scan',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.AGENTE]}>
            <ScanQRPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'admin/sucursales',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminSucursalesPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'admin/servicios',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminServiciosPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'admin/usuarios',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminUsuariosPage />
          </PrivateRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
], {
  future: {
    v7_startTransition: true,
  },
})
