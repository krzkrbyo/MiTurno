# MiTurno - Sistema de Gestión de Turnos con QR

Aplicación web moderna para la gestión de turnos con generación y escaneo de códigos QR, desarrollada con React, TypeScript, Supabase y Tailwind CSS.

## 🚀 Características

- ✅ Autenticación con Supabase (Email/Password)
- ✅ Gestión de turnos en tiempo real
- ✅ Generación de códigos QR con firma HMAC
- ✅ Escaneo de QR para validación
- ✅ Dashboard con estadísticas
- ✅ Roles: Admin, Agente, Cliente
- ✅ Realtime updates con Supabase
- ✅ UI moderna con Tailwind CSS + shadcn/ui
- ✅ Responsive design

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita)
- Git

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd MiTurno
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_QR_SIGN_SECRET=tu_secreto_para_firmar_qr
```

**Obtén las credenciales de Supabase:**
1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Settings → API
3. Copia `Project URL` y `anon public` key

**Genera un secreto para QR:**
```bash
# En Linux/Mac
openssl rand -hex 32

# O usa cualquier string aleatorio seguro
```

### 4. Configurar la base de datos

1. Ve a tu proyecto en Supabase
2. SQL Editor → New Query
3. Copia y ejecuta el contenido de `supabase/schema.sql`
4. Esto creará todas las tablas, políticas RLS y triggers necesarios

### 5. Crear usuario administrador

Después de ejecutar el schema, crea tu primer usuario:

1. Ve a Authentication → Users en Supabase
2. Crea un nuevo usuario con email/password
3. En SQL Editor, ejecuta:

```sql
-- Reemplaza 'tu-user-id' con el UUID del usuario creado
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'tu-user-id';
```

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
MiTurno/
├── src/
│   ├── app/              # Router y layout
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes shadcn/ui
│   │   └── ...           # Componentes de negocio
│   ├── features/         # Features organizados
│   │   ├── auth/         # Autenticación
│   │   └── turnos/       # Lógica de turnos
│   ├── lib/              # Utilidades y config
│   ├── pages/            # Páginas de la app
│   ├── styles/           # Estilos globales
│   └── types/            # Tipos TypeScript
├── supabase/            # Scripts SQL
└── ...
```

## 🗄️ Esquema de Base de Datos

### Tablas principales:

- **profiles**: Perfiles de usuario con roles
- **sucursales**: Sucursales del negocio
- **servicios**: Catálogo de servicios
- **turnos**: Turnos con estados y relaciones

### Estados de turno:

- `pendiente`: Turno creado, esperando
- `en_cola`: Llamado a ventanilla
- `atendiendo`: En proceso de atención
- `completado`: Finalizado
- `cancelado`: Cancelado

## 🔐 Seguridad QR

Los códigos QR incluyen:
- `turno_id`: ID del turno
- `exp_ts`: Timestamp de expiración (24 horas)
- `firma`: HMAC-SHA256 para validación

El secreto se almacena en `VITE_QR_SIGN_SECRET` y nunca se expone en el cliente.

## 🚢 Despliegue en Vercel

### 1. Preparar el proyecto

```bash
npm run build
```

### 2. Conectar con Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Sigue las instrucciones

### 3. Configurar variables de entorno en Vercel

En el dashboard de Vercel:
- Settings → Environment Variables
- Agrega:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_QR_SIGN_SECRET`

### 4. GitHub Actions (CI/CD)

El proyecto incluye configuración para GitHub Actions. Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

Configura los secrets en GitHub:
- `VERCEL_TOKEN`: Token de Vercel
- `VERCEL_ORG_ID`: ID de organización
- `VERCEL_PROJECT_ID`: ID del proyecto

## 🧪 Testing

```bash
npm test
```

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter
- `npm run format` - Formatear código
- `npm test` - Ejecutar tests

## 🎨 Personalización

### Colores

Edita `tailwind.config.js` para cambiar la paleta:

```js
colors: {
  primary: { DEFAULT: '#2563EB', ... },
  secondary: { DEFAULT: '#60A5FA', ... },
  // ...
}
```

### Fuentes

Las fuentes Poppins e Inter se cargan desde Google Fonts en `index.html`.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para problemas o preguntas:
1. Revisa la documentación de [Supabase](https://supabase.com/docs)
2. Revisa los issues del proyecto
3. Crea un nuevo issue si es necesario

## 🗺️ Roadmap

- [ ] CRUD completo de sucursales y servicios
- [ ] Gestión de usuarios desde la UI
- [ ] Notificaciones push
- [ ] Reportes y estadísticas avanzadas
- [ ] Exportación de datos
- [ ] Multi-idioma
- [ ] Modo oscuro

---

Desarrollado con ❤️ usando React, TypeScript y Supabase

