import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileAvatar } from './ProfileAvatar'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { APP_NAME } from '@/lib/constants'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4 flex-1">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-primary">{APP_NAME}</h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <ProfileAvatar size="sm" />
                <span className="text-muted-foreground">{profile.full_name || 'Usuario'}</span>
              </Link>
              <Badge variant="secondary" className="text-xs">
                {profile.role}
              </Badge>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Cerrar sesión">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

