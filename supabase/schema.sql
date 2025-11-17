-- ============================================
-- Sistema de Control de Asistencia de Empleados
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role = 'admin') DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABLA: empleados
-- ============================================
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_qr TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  foto_url TEXT,
  pin TEXT UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empleados_codigo_qr ON empleados(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_empleados_pin ON empleados(pin);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(activo);
CREATE INDEX IF NOT EXISTS idx_empleados_created_by ON empleados(created_by);

-- ============================================
-- TABLA: registros_asistencia
-- ============================================
CREATE TABLE IF NOT EXISTS registros_asistencia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('entrada', 'salida', 'salida_almuerzo', 'entrada_almuerzo')),
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_empleado ON registros_asistencia(empleado_id);
CREATE INDEX IF NOT EXISTS idx_registros_fecha_hora ON registros_asistencia(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_registros_tipo_evento ON registros_asistencia(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_registros_empleado_fecha ON registros_asistencia(empleado_id, fecha_hora DESC);

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

-- Función helper para verificar si el usuario es admin
-- Usa SECURITY DEFINER para evitar recursión en políticas RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================
-- TRIGGER: Crear perfil automáticamente
-- ============================================

-- Función para crear perfil automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para ejecutar la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_asistencia ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS: profiles
-- ============================================

-- Cada usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin puede ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Admin puede actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Permitir que los usuarios creen su propio perfil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- POLÍTICAS RLS: empleados
-- ============================================

-- Solo admin puede ver todos los empleados
CREATE POLICY "Admins can view all empleados"
  ON empleados FOR SELECT
  USING (public.is_admin());

-- Solo admin puede crear empleados
CREATE POLICY "Admins can insert empleados"
  ON empleados FOR INSERT
  WITH CHECK (public.is_admin());

-- Solo admin puede actualizar empleados
CREATE POLICY "Admins can update empleados"
  ON empleados FOR UPDATE
  USING (public.is_admin());

-- Solo admin puede eliminar empleados
CREATE POLICY "Admins can delete empleados"
  ON empleados FOR DELETE
  USING (public.is_admin());

-- ============================================
-- POLÍTICAS RLS: registros_asistencia
-- ============================================

-- Solo admin puede ver todos los registros
CREATE POLICY "Admins can view all registros"
  ON registros_asistencia FOR SELECT
  USING (public.is_admin());

-- Permitir insertar registros sin autenticación (para el escáner QR)
-- Esto permite que el escáner funcione sin login
CREATE POLICY "Allow insert registros"
  ON registros_asistencia FOR INSERT
  WITH CHECK (true);

-- Solo admin puede eliminar registros
CREATE POLICY "Admins can delete registros"
  ON registros_asistencia FOR DELETE
  USING (public.is_admin());
