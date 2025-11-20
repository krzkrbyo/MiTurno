import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './layout'
import { PrivateRoute } from '@/features/auth/components/PrivateRoute'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { ScanPage } from '@/pages/scan'
import { ScanQRPage } from '@/pages/turnos/scan'
import { ProfilePage } from '@/pages/profile'
import { EmpleadosPage } from '@/pages/admin/empleados'
import { EstadisticasPage } from '@/pages/admin/estadisticas'
import { ROLES } from '@/lib/constants'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/scan',
    element: <ScanPage />, // Página pública de escaneo
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
        path: 'scan',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <ScanQRPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'admin/empleados',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <EmpleadosPage />
          </PrivateRoute>
        ),
      },
      {
        path: 'admin/estadisticas',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <EstadisticasPage />
          </PrivateRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
