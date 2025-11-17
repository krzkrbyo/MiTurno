import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, User, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { LoadingSpinner } from '@/components/Loading'
import { APP_NAME } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La confirmación es requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false) // Flag para prevenir múltiples registros

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const from = (location.state as any)?.from?.pathname || '/'

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('LoginPage: User is authenticated, redirecting...')
      setIsSubmitting(false) // Resetear el estado de submitting cuando se autentica
      const timer = setTimeout(() => {
        navigate(from, { replace: true })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, navigate, from])

  async function onLoginSubmit(data: LoginFormData) {
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    
    // Timeout de seguridad para evitar que se quede bloqueado
    const safetyTimeout = setTimeout(() => {
      console.warn('LoginPage: Safety timeout triggered, resetting submitting state')
      setIsSubmitting(false)
    }, 10000) // 10 segundos máximo
    
    try {
      console.log('LoginPage: Starting sign in...')
      const result = await signIn(data.email, data.password)
      console.log('LoginPage: Sign in result:', result)
      
      clearTimeout(safetyTimeout)
      
      if (result.success) {
        setSuccess('Sesión iniciada correctamente. Redirigiendo...')
        // El useEffect detectará el cambio en isAuthenticated y redirigirá
        // También reseteará isSubmitting cuando se detecte la autenticación
      } else {
        console.error('LoginPage: Sign in failed:', result.error)
        setError(result.error || 'Error al iniciar sesión')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error('LoginPage: Sign in exception:', err)
      clearTimeout(safetyTimeout)
      setError(err.message || 'Error al iniciar sesión')
      setIsSubmitting(false)
    }
  }

  async function onRegisterSubmit(data: RegisterFormData) {
    // Prevenir múltiples submits
    if (isRegistering || isSubmitting) {
      console.log('LoginPage: Registration already in progress, ignoring duplicate submit')
      return
    }

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    setIsRegistering(true)
    
    try {
      console.log('LoginPage: Starting sign up...')
      const result = await signUp(data.email, data.password, data.full_name)
      console.log('LoginPage: Sign up result:', result)
      
      if (result.success) {
        // Verificar si se requiere confirmación de email
        if ((result as any).requiresEmailConfirmation) {
          setSuccess('Cuenta creada. Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.')
          setIsSubmitting(false)
          setIsRegistering(false)
          return
        }

        // Si hay sesión activa, intentar cargar el perfil y hacer login automático
        setSuccess('Cuenta creada correctamente. Iniciando sesión...')
        
        // Esperar un momento para que el perfil se cree completamente
        setTimeout(async () => {
          console.log('LoginPage: Auto-signing in after registration...')
          setIsSubmitting(true)
          try {
            const loginResult = await signIn(data.email, data.password)
            if (!loginResult.success) {
              console.error('LoginPage: Auto-sign in failed:', loginResult.error)
              setError('Error al iniciar sesión después del registro. Por favor intenta iniciar sesión manualmente.')
            }
          } catch (err: any) {
            console.error('LoginPage: Auto-sign in exception:', err)
            // Si hay rate limiting, no mostrar error, solo sugerir login manual
            if (err.message?.includes('rate limit') || err.message?.includes('seconds')) {
              setSuccess('Cuenta creada. Por favor inicia sesión manualmente.')
            } else {
              setError('Error al iniciar sesión después del registro. Por favor intenta iniciar sesión manualmente.')
            }
          } finally {
            setIsSubmitting(false)
            setIsRegistering(false)
          }
        }, 2000) // Aumentar el delay para dar tiempo a que se cree el perfil
      } else {
        console.error('LoginPage: Sign up failed:', result.error)
        setError(result.error || 'Error al crear la cuenta')
        setIsSubmitting(false)
        setIsRegistering(false)
      }
    } catch (err: any) {
      console.error('LoginPage: Sign up exception:', err)
      setError(err.message || 'Error al crear la cuenta')
      setIsSubmitting(false)
      setIsRegistering(false)
    }
  }

  // NO mostrar loading aquí - el formulario debe mostrarse siempre
  // Solo mostrar loading durante el submit
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-heading">{APP_NAME}</CardTitle>
            <CardDescription>
              {activeTab === 'login' ? 'Inicia sesión para continuar' : 'Crea una cuenta nueva'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => {
              setActiveTab(v as 'login' | 'register')
              setError(null)
              setSuccess(null)
              setIsRegistering(false) // Resetear el flag al cambiar de tab
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              {/* Formulario de Login */}
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md" role="alert">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md" role="alert">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        {...loginForm.register('email')}
                        aria-invalid={loginForm.formState.errors.email ? 'true' : 'false'}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500" role="alert">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...loginForm.register('password')}
                        aria-invalid={loginForm.formState.errors.password ? 'true' : 'false'}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500" role="alert">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Formulario de Registro */}
              <TabsContent value="register" className="space-y-4 mt-4">
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-4"
                >
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md" role="alert">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md" role="alert">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Juan Pérez"
                        className="pl-10"
                        {...registerForm.register('full_name')}
                        aria-invalid={registerForm.formState.errors.full_name ? 'true' : 'false'}
                      />
                    </div>
                    {registerForm.formState.errors.full_name && (
                      <p className="text-sm text-red-500" role="alert">
                        {registerForm.formState.errors.full_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10"
                        {...registerForm.register('email')}
                        aria-invalid={registerForm.formState.errors.email ? 'true' : 'false'}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500" role="alert">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...registerForm.register('password')}
                        aria-invalid={registerForm.formState.errors.password ? 'true' : 'false'}
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500" role="alert">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        {...registerForm.register('confirmPassword')}
                        aria-invalid={registerForm.formState.errors.confirmPassword ? 'true' : 'false'}
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500" role="alert">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || isRegistering}
                  >
                    {isSubmitting || isRegistering ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crear Cuenta
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
