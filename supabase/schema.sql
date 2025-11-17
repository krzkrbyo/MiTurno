-- ============================================
-- MiTurno - Esquema de Base de Datos
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'agente', 'cliente')) DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================
-- TABLA: sucursales
-- ============================================
CREATE TABLE IF NOT EXISTS sucursales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sucursales_activa ON sucursales(activa);
CREATE INDEX IF NOT EXISTS idx_sucursales_codigo ON sucursales(codigo);

-- ============================================
-- TABLA: servicios
-- ============================================
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 30,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);

-- ============================================
-- TABLA: turnos
-- ============================================
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT NOT NULL UNIQUE,
  cliente TEXT NOT NULL,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
  estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'en_cola', 'atendiendo', 'completado', 'cancelado')) DEFAULT 'pendiente',
  scheduled_for TIMESTAMPTZ,
  atendido_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_turnos_sucursal_estado ON turnos(sucursal_id, estado);
CREATE INDEX IF NOT EXISTS idx_turnos_created_at ON turnos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_turnos_codigo ON turnos(codigo);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_created_by ON turnos(created_by);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER turnos_updated_at
  BEFORE UPDATE ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para generar código único si no se proporciona
CREATE OR REPLACE FUNCTION generate_turno_codigo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'T' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER turnos_codigo_default
  BEFORE INSERT ON turnos
  FOR EACH ROW
  EXECUTE FUNCTION generate_turno_codigo();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

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

-- Admin puede ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Admin puede actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ============================================
-- POLÍTICAS RLS: sucursales
-- ============================================

-- Lectura pública para usuarios autenticados
CREATE POLICY "Authenticated users can view active sucursales"
  ON sucursales FOR SELECT
  USING (auth.role() = 'authenticated' AND activa = TRUE);

-- Admin puede ver todas las sucursales
CREATE POLICY "Admins can view all sucursales"
  ON sucursales FOR SELECT
  USING (public.is_admin());

-- Solo admin puede insertar/actualizar/eliminar
CREATE POLICY "Admins can manage sucursales"
  ON sucursales FOR ALL
  USING (public.is_admin());

-- ============================================
-- POLÍTICAS RLS: servicios
-- ============================================

-- Lectura pública para usuarios autenticados
CREATE POLICY "Authenticated users can view active servicios"
  ON servicios FOR SELECT
  USING (auth.role() = 'authenticated' AND activo = TRUE);

-- Admin puede ver todos los servicios
CREATE POLICY "Admins can view all servicios"
  ON servicios FOR SELECT
  USING (public.is_admin());

-- Solo admin puede insertar/actualizar/eliminar
CREATE POLICY "Admins can manage servicios"
  ON servicios FOR ALL
  USING (public.is_admin());

-- ============================================
-- POLÍTICAS RLS: turnos
-- ============================================

-- Función helper para verificar si el usuario es admin o agente
CREATE OR REPLACE FUNCTION public.is_admin_or_agente()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'agente')
  );
$$;

-- Función helper para verificar si el usuario es cliente
CREATE OR REPLACE FUNCTION public.is_cliente()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'cliente'
  );
$$;

-- Agentes y admin pueden ver turnos de sus sucursales
CREATE POLICY "Agents and admins can view turnos from their sucursales"
  ON turnos FOR SELECT
  USING (public.is_admin_or_agente());

-- Clientes pueden ver sus propios turnos (por created_by)
CREATE POLICY "Clients can view own turnos"
  ON turnos FOR SELECT
  USING (created_by = auth.uid() AND public.is_cliente());

-- Agentes y admin pueden insertar turnos
CREATE POLICY "Agents and admins can insert turnos"
  ON turnos FOR INSERT
  WITH CHECK (public.is_admin_or_agente());

-- Clientes pueden crear sus propios turnos
CREATE POLICY "Clients can insert own turnos"
  ON turnos FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.is_cliente());

-- Agentes y admin pueden actualizar turnos
CREATE POLICY "Agents and admins can update turnos"
  ON turnos FOR UPDATE
  USING (public.is_admin_or_agente());

-- ============================================
-- FUNCIONES AUXILIARES
-- ============================================

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
    'cliente'
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
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Insertar sucursales de ejemplo (ejecutar manualmente después de crear usuarios)
-- INSERT INTO sucursales (nombre, codigo) VALUES
--   ('Sucursal Central', 'SUC-001'),
--   ('Sucursal Norte', 'SUC-002'),
--   ('Sucursal Sur', 'SUC-003');

-- Insertar servicios de ejemplo
-- INSERT INTO servicios (nombre, duracion_min) VALUES
--   ('Consulta General', 30),
--   ('Trámite Documental', 15),
--   ('Atención Personalizada', 45);

