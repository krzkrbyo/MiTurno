import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, QrCode, Building2, Settings, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ROLES } from '@/lib/constants'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation()
  const { isAdmin, isAgente } = useAuth()

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      roles: [ROLES.ADMIN, ROLES.AGENTE, ROLES.CLIENTE],
    },
    {
      label: 'Turnos',
      icon: Calendar,
      path: '/turnos',
      roles: [ROLES.ADMIN, ROLES.AGENTE, ROLES.CLIENTE],
    },
    {
      label: 'Nuevo Turno',
      icon: Calendar,
      path: '/turnos/nuevo',
      roles: [ROLES.ADMIN, ROLES.AGENTE, ROLES.CLIENTE],
    },
    {
      label: 'Escanear QR',
      icon: QrCode,
      path: '/turnos/scan',
      roles: [ROLES.ADMIN, ROLES.AGENTE],
    },
    {
      label: 'Mi Perfil',
      icon: User,
      path: '/profile',
      roles: [ROLES.ADMIN, ROLES.AGENTE, ROLES.CLIENTE],
    },
    {
      label: 'Sucursales',
      icon: Building2,
      path: '/admin/sucursales',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Servicios',
      icon: Settings,
      path: '/admin/servicios',
      roles: [ROLES.ADMIN],
    },
    {
      label: 'Usuarios',
      icon: Users,
      path: '/admin/usuarios',
      roles: [ROLES.ADMIN],
    },
  ]

  const visibleItems = menuItems.filter((item) => {
    if (item.roles.includes(ROLES.ADMIN) && isAdmin) return true
    if (item.roles.includes(ROLES.AGENTE) && isAgente) return true
    if (item.roles.includes(ROLES.CLIENTE)) return true
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

