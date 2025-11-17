# Guía de Setup Rápido - MiTurno

## ✅ Estado Actual

- ✅ Base de datos creada y configurada en Supabase
- ✅ Tablas: profiles, sucursales, servicios, turnos
- ✅ Políticas RLS configuradas
- ✅ Triggers y funciones creadas
- ✅ Datos iniciales insertados (3 sucursales, 3 servicios)
- ✅ Dependencias instaladas correctamente

## 🚀 Próximos Pasos

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_QR_SIGN_SECRET=tu_secreto_aleatorio
```

**Obtén las credenciales:**
- Ve a tu proyecto en Supabase
- Settings → API
- Copia `Project URL` y `anon public` key

**Genera el secreto QR:**
```bash
openssl rand -hex 32
```

### 2. Crear Usuario Administrador

1. Ve a **Authentication → Users** en Supabase
2. Crea un nuevo usuario con email/password
3. Copia el **User UID**
4. Ejecuta en SQL Editor:

```sql
-- Reemplaza 'TU-USER-ID' con el UUID del usuario
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'TU-USER-ID';
```

### 3. Ejecutar la Aplicación

```bash
npm run dev
```

La app estará en `http://localhost:5173`

## 📊 Datos Iniciales

Ya están creados:
- **Sucursales:**
  - Sucursal Central (SUC-001)
  - Sucursal Norte (SUC-002)
  - Sucursal Sur (SUC-003)

- **Servicios:**
  - Consulta General (30 min)
  - Trámite Documental (15 min)
  - Atención Personalizada (45 min)

## 🔐 Roles Disponibles

- **admin**: Acceso completo
- **agente**: Puede gestionar turnos
- **cliente**: Puede crear y ver sus propios turnos

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo después de crear `.env`

### Error: "User not found" al iniciar sesión
- Asegúrate de que el usuario existe en Supabase Auth
- Verifica que el perfil se creó automáticamente o créalo manualmente

### Error: "Permission denied" en operaciones
- Verifica que el usuario tiene el rol correcto
- Revisa las políticas RLS en Supabase

## 📝 Notas

- El sistema crea automáticamente un perfil cuando un usuario se registra
- Los turnos se generan con código único automático
- Los QR tienen expiración de 24 horas
- Las actualizaciones son en tiempo real gracias a Supabase Realtime

