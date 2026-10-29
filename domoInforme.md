# DOMO INFORME — Registro de auditoría del proyecto pruebadomo

**Proyecto:** pruebadomo  
**Ubicación:** D:\pruebadomo  
**Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS)  
**Base de datos / Auth:** Supabase (PostgreSQL + Supabase Auth)  
**Despliegue:** Vercel (pendiente)  
**Repositorio:** GitHub (pendiente)  
**Estado:** Desarrollo — Paso 1 y Paso 2 (Login/Registro) completados  
**Última actualización:** 28/10/2026

---

## 1. RESUMEN EJECUTIVO

Se ha creado el proyecto Next.js `pruebadomo` en el disco D, conectado con Supabase para autenticación segura. Al entrar a la aplicación se muestra primero el login; tras autenticarse, el usuario accede al dashboard (home protegido). El proyecto incluye:

- Login y registro de usuarios vía Supabase Auth.
- Middleware de protección de rutas.
- Clientes de Supabase para server, client y middleware.
- Página de callback para OAuth/confirmación de email.
- Documentación en este archivo `domoInforme.md`, actualizado en cada modificación.

**Resultado de verificación:**
- `npm run lint`: ✅ Sin errores
- `npm run build`: ✅ Compilación exitosa (producción)
- TypeScript: ✅ Sin errores de tipos

---

## 2. ESTRUCTURA DE ARCHIVOS

```
D:\pruebadomo\
├── .env.local                  # Variables de entorno (Supabase URL y Anon Key)
├── package.json                # Dependencias del proyecto
├── next.config.ts              # Configuración de Next.js
├── tsconfig.json               # Configuración de TypeScript
├── eslint.config.mjs           # Configuración de ESLint
├── src\
│   ├── app\
│   │   ├── layout.tsx          # Layout raíz (idioma español, metadatos)
│   │   ├── page.tsx            # Página de login/registro (ruta por defecto "/")
│   │   ├── globals.css         # Estilos globales Tailwind
│   │   ├── dashboard\
│   │   │   └── page.tsx        # Home protegido (ruta "/dashboard")
│   │   └── auth\
│   │       └── callback\
│   │           └── route.ts    # Callback de autenticación Supabase
│   ├── lib\
│   │   └── supabase\
│   │       ├── client.ts       # Cliente Supabase para componentes cliente
│   │       ├── server.ts       # Cliente Supabase para componentes servidor
│   │       └── middleware.ts   # Cliente Supabase para middleware
│   └── middleware.ts           # Middleware de protección de rutas
└── domoInforme.md              # Este archivo de auditoría
```

---

## 3. DOCUMENTACIÓN DE FUNCIONES Y COMPONENTES

### 3.1 `src/lib/supabase/client.ts`

**Función:** `createClient()`

**Propósito:** Crea y retorna una instancia del cliente de Supabase optimizada para componentes de cliente (Client Components) del App Router de Next.js.

**Detalles técnicos:**
- Utiliza `createBrowserClient` de `@supabase/ssr`.
- Lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` de las variables de entorno.
- Lanza un error descriptivo si faltan las variables de entorno.
- Maneja el estado de autenticación en el navegador mediante `localStorage`.

**Uso:** Importar en componentes cliente que necesiten llamar a `supabase.auth` directamente (login, registro, logout, obtener sesión).

---

### 3.2 `src/lib/supabase/server.ts`

**Función:** `createSupabaseServerClient()` (async)

**Propósito:** Crea y retorna una instancia del cliente de Supabase optimizada para componentes de servidor (Server Components) y Server Actions.

**Detalles técnicos:**
- Utiliza `createServerClient` de `@supabase/ssr`.
- Lee las cookies mediante `cookies()` de `next/headers` (await, Next.js 15+).
- Implementa los métodos `get`, `set` y `remove` de cookies requeridos por Supabase SSR.
- Lanza un error descriptivo si faltan las variables de entorno.

**Uso:** Importar en Server Components o Route Handlers que necesiten verificar la sesión del usuario en el servidor.

---

### 3.3 `src/lib/supabase/middleware.ts`

**Función:** `createSupabaseMiddlewareClient()` (async)

**Propósito:** Crea y retorna una instancia del cliente de Supabase específicamente para el middleware de Next.js.

**Detalles técnicos:**
- Idéntico a `createSupabaseServerClient` pero separado por responsabilidad clara: uso exclusivo en `src/middleware.ts`.
- Lee y manipula cookies para mantener la sesión durante la evaluación del middleware.

**Uso:** Importar únicamente en `src/middleware.ts`.

---

### 3.4 `src/app/layout.tsx`

**Componente:** `RootLayout`

**Propósito:** Layout raíz de la aplicación. Define el idioma (español), las fuentes y los metadatos globales.

**Detalles técnicos:**
- `metadata.title`: "DomoApp".
- `metadata.description`: "Aplicación con autenticación segura mediante Supabase".
- Idioma: `lang="es"`.
- Envuelve todos los hijos (`children`) en `<body>` con clases Tailwind para layout completo.

**Uso:** Aplicado automáticamente a todas las rutas de la aplicación.

---

### 3.5 `src/app/page.tsx` (Página de Login / Registro)

**Componente:** `LoginPage`

**Propósito:** Página de inicio por defecto (`/`). Muestra el formulario de login o registro según el modo seleccionado. Es la primera página que ve el usuario al entrar.

**Funciones internas:**

1. **`getSupabase()`**
   - Crea el cliente de Supabase de forma lazy (solo al invocarse).
   - Captura errores de configuración y los almacena en estado para mostrar mensaje al usuario.
   - Evita llamar a `createClient()` durante el prerenderizado (build), lo que permite compilar incluso sin credenciales reales.

2. **`switchMode(nextMode: AuthMode)`**
   - Alterna entre modo `"login"` y `"register"`.
   - Limpia mensajes de error, éxito y configuración al cambiar de modo.

3. **`handleSubmit(e: React.FormEvent)`**
   - Maneja el envío del formulario.
   - En modo login: llama a `supabase.auth.signInWithPassword({ email, password })`.
   - En modo registro: valida que las contraseñas coincidan, luego llama a `supabase.auth.signUp({ email, password })`.
   - Si tiene éxito, muestra mensaje y redirige a `/dashboard` tras un breve retraso.
   - Si falla, captura el error y lo muestra en pantalla.

**Flujo:**
- Usuario llega a `/`.
- Si no tiene sesión, ve el formulario de login/registro.
- Si faltan credenciales de Supabase, se muestra un mensaje de configuración requerida.
- Al autenticarse, es redirigido a `/dashboard`.

---

### 3.6 `src/app/dashboard/page.tsx`

**Componente:** `DashboardPage`

**Propósito:** Página de inicio protegida (`/dashboard`). Solo accesible si el usuario tiene una sesión válida de Supabase.

**Funciones internas:**

1. **`useEffect` (inicialización de Supabase y sesión)**
   - Al montar, crea el cliente de Supabase y llama a `supabase.auth.getSession()` para obtener el usuario actual.
   - Maneja errores de configuración mostrando un mensaje claro.
   - Incluye bandera `mounted` para evitar actualizaciones de estado en componente desmontado.

2. **`useEffect` (suscripción a cambios de auth)**
   - Se suscribe a `supabase.auth.onAuthStateChange` para detectar cambios de sesión en tiempo real.
   - Si la sesión se cierra, redirige automáticamente a `/`.
   - Limpia la suscripción al desmontar el componente.

3. **`handleLogout()`**
   - Llama a `supabase.auth.signOut()` para cerrar la sesión.
   - Redirige al usuario a `/` (login).

**Detalles técnicos:**
- Muestra un indicador de carga mientras se verifica la sesión.
- Si no hay usuario, redirige a `/` y retorna `null`.
- Muestra el email del usuario, estado de autenticación y botón de cerrar sesión.

---

### 3.7 `src/app/auth/callback/route.ts`

**Handler:** `GET(request: NextRequest)`

**Propósito:** Ruta de callback de Supabase Auth. Procesa el código de autorización recibido después de un inicio de sesión OAuth o confirmación de email.

**Detalles técnicos:**
- Extrae el parámetro `code` de la URL.
- Si existe `code`, llama a `supabase.auth.exchangeCodeForSession(code)` para intercambiarlo por una sesión.
- Redirige al usuario de vuelta al origen de la aplicación.
- `createSupabaseServerClient()` es async, por lo que se hace `await` antes de usarlo.

**Uso:** Configurar esta URL como callback en el panel de Supabase (Authentication > URL Configuration).

---

### 3.8 `src/middleware.ts`

**Función:** `middleware(request: NextRequest)`

**Propósito:** Protege las rutas de la aplicación verificando la sesión de Supabase antes de procesar la solicitud.

**Funciones internas:**

1. **Verificación de sesión**
   - Obtiene la sesión mediante `supabase.auth.getSession()`.
   - Si no hay sesión y el usuario no está en `/`, redirige a `/` (login).
   - Si hay sesión y el usuario está en `/`, redirige a `/dashboard`.

**Configuración:**
- `matcher`: `["/", "/dashboard/:path*"]` — el middleware solo se ejecuta en la raíz y en el dashboard.

**Nota:** Next.js 16 muestra una advertencia de que la convención de archivo `middleware` está obsoleta y sugiere usar `proxy`. Esto es solo una advertencia, no un error. El middleware funciona correctamente.

---

## 4. VARIABLES DE ENTORNO (`.env.local`)

| Variable | Valor actual | Descripción |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `tu_supabase_url_aqui` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `tu_supabase_anon_key_aqui` | Clave pública anónima de Supabase |

**Nota:** Estos son valores de placeholder. Deben reemplazarse con las credenciales reales del proyecto de Supabase antes de que la autenticación funcione. Sin credenciales reales, la aplicación muestra un mensaje de "Configuración requerida".

---

## 5. FLUJO DE AUTENTICACIÓN

1. Usuario entra a `/`.
2. Middleware verifica si hay sesión.
   - No hay sesión → se muestra `LoginPage`.
   - Hay sesión → redirige a `/dashboard`.
3. Usuario completa login o registro en `LoginPage`.
4. Supabase Auth crea la sesión y establece cookies.
5. Usuario es redirigido a `/dashboard`.
6. `DashboardPage` verifica la sesión y muestra el panel protegido.
7. Al cerrar sesión, se redirige a `/`.

---

## 6. AUDITORÍA Y SEGUIMIENTO

| Fecha | Acción | Responsable | Estado |
|-------|--------|-------------|--------|
| 28/10/2026 | Creación del proyecto Next.js `pruebadomo` en D:\ | Asistente | Completado |
| 28/10/2026 | Instalación de `@supabase/supabase-js` y `@supabase/ssr` | Asistente | Completado |
| 28/10/2026 | Creación de clientes Supabase (client, server, middleware) | Asistente | Completado |
| 28/10/2026 | Creación de página de login/registro (`/`) | Asistente | Completado |
| 28/10/2026 | Creación de dashboard protegido (`/dashboard`) | Asistente | Completado |
| 28/10/2026 | Creación de middleware de protección de rutas | Asistente | Completado |
| 28/10/2026 | Creación de ruta de callback de auth | Asistente | Completado |
| 28/10/2026 | Creación de `domoInforme.md` | Asistente | Completado |
| 28/10/2026 | Refactorización: clientes lazy para evitar errores de build | Asistente | Completado |
| 28/10/2026 | `npm run lint`: sin errores | Asistente | Completado |
| 28/10/2026 | `npm run build`: compilación exitosa | Asistente | Completado |
| — | Configuración de variables de entorno (placeholders) | Pendiente credenciales reales del usuario | Pendiente |
| — | Inicializar git, conectar GitHub, desplegar en Vercel | Pendiente aprobación del usuario | Pendiente |

---

## 7. PRÓXIMOS PASOS (PENDIENTE DE APROBACIÓN DEL USUARIO)

1. **Credenciales de Supabase:** El usuario debe proporcionar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` reales para reemplazar los placeholders en `.env.local`.
2. **Configurar callback en Supabase:** Añadir `https://tu-dominio.vercel.app/auth/callback` en Authentication > URL Configuration.
3. **Confirmar commit y push a GitHub:** Proporcionar URL del repositorio GitHub.
4. **Desplegar en Vercel:** Conectar el repositorio a Vercel y agregar las variables de entorno.

**Este archivo se actualizará en cada modificación del proyecto.** No se hará commit ni despliegue sin la autorización explícita del usuario.
