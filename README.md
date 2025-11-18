# Control de Asistencia

Sistema de control de asistencia de empleados con códigos QR y PIN de 4 dígitos.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_QR_SIGN_SECRET=tu_secreto_aleatorio
```

**Obtén las credenciales:**
- Ve a tu proyecto en [Supabase](https://supabase.com)
- Settings → API
- Copia `Project URL` y `anon public` key

**Genera el secreto QR:**
```bash
openssl rand -hex 32
```

### 3. Configurar base de datos

1. Ve a tu proyecto en Supabase
2. SQL Editor → New Query
3. Copia y ejecuta el contenido de `supabase/schema.sql`

### 4. Crear usuario administrador

1. Ve a Authentication → Users en Supabase
2. Crea un nuevo usuario con email/password
3. El perfil se crea automáticamente con rol `admin`

### 5. Ejecutar

```bash
npm run dev
```

La aplicación estará en `http://localhost:5173`

## 📋 Características

- ✅ Control de asistencia con QR y PIN de 4 dígitos
- ✅ Registro de eventos: Entrada, Salida, Salida a Almuerzo, Entrada de Almuerzo
- ✅ Gestión de empleados (crear, editar, activar/desactivar)
- ✅ Estadísticas de asistencia
- ✅ Autenticación con Supabase
- ✅ Sincronización entre pestañas

## 🎯 Uso

### Administrador

1. **Iniciar sesión** con tu cuenta de administrador
2. **Crear empleados** en `/admin/empleados`
   - Subir foto de perfil
   - El sistema genera automáticamente un PIN único y código QR
3. **Registrar asistencia** en `/scan`
   - Escanear QR o ingresar PIN de 4 dígitos
   - Seleccionar tipo de evento (Entrada, Salida, etc.)
4. **Ver estadísticas** en `/admin/estadisticas`

### Empleado

- Solo necesita escanear su QR o ingresar su PIN en `/scan`
- No requiere iniciar sesión

## 🛠️ Scripts

- `npm run dev` - Desarrollo
- `npm run build` - Producción
- `npm run preview` - Previsualizar build
- `npm run lint` - Linter

## 📦 Tecnologías

- React + TypeScript + Vite
- Supabase (Auth, Database, Storage)
- Tailwind CSS + shadcn/ui
- Zustand (State Management)
- React Router
