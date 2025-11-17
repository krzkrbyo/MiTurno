import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, QrCode, Users, User, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROLES } from '@/lib/constants'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Escanear QR',
      icon: QrCode,
      path: '/scan',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Mi Perfil',
      icon: User,
      path: '/profile',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Empleados',
      icon: Users,
      path: '/admin/empleados',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Estadísticas',
      icon: BarChart3,
      path: '/admin/estadisticas',
      roles: [ROLES.ADMIN],
    },
  ]

  const visibleItems = menuItems.filter((item) => {
    if (item.roles.includes(ROLES.ADMIN) && isAdmin) return true
    return false
  })

  return (
    <>
      {/* Overlay para móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-card transition-transform duration-300 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

