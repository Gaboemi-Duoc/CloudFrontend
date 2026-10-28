# CloudEvaluacion - Frontend (React + TypeScript + Vite)

Interfaz de usuario del sistema académico **CloudEvaluacion** para la asignatura **DSY1107 Desarrollo Cloud Native**. Construida con **React + TypeScript + Vite**, implementa autenticación segura con **AWS Cognito** mediante *Authorization Code + PKCE* y se comunica con el **Backend BFF** a través de **AWS API Gateway**.

> **Nota:** este repositorio contiene **solo el frontend**. El backend BFF, los consumidores serverless y las colas se documentan en sus respectivos repositorios (`CloudEvaluacion` y `CloudLambda`).

---

## Descripción

| Rol | Experiencia |
|---|---|
| **Admin** | Panel de gestión de cursos, asignación de docentes, inscripción de alumnos y generación de reportes analíticos |
| **Teacher** | Visualización de cursos propios, gestión de alumnos inscritos y creación de tareas |
| **Student** | Cursos inscritos, catálogo de cursos disponibles con auto-inscripción y listado de tareas pendientes |

El frontend **no gestiona credenciales**: delega el login en **AWS Cognito** (Hosted UI) y usa el `id_token` emitido para autenticar cada petición al BFF. El enrutamiento está protegido por rol mediante un componente `RequireRole` que evalúa el claim `cognito:groups`.

---

## Arquitectura

El frontend participa del siguiente flujo end-to-end del sistema:

```
+--------------+    HTTPS     +--------------+    HTTP     +------------------+
|              |------------->|              |------------>|                  |
|  React SPA   |  Bearer JWT  | AWS API      |  + header   |  EC2             |
|  (Vercel)    |              | Gateway      |  X-Secret-  |  +------------+  |
|              |<-------------| (HTTP API)   |  Gateway    |  | Spring Boot|  |
|              |              |              |             |  | BFF (Docker)|  |
+--------------+              +--------------+             |  +-----+------+  |
       |                                                     +--------+--------+
       |                                                              |
       |  Authorization Code                                          |
       v                                                              |
+--------------+                                                      |
| AWS Cognito  |                                                      |
| (User Pool)  |                                                      |
+--------------+                                                      |
                                                                      |
                                        +-----------------------------+
                                        |
                                        | (Asíncrono)
                                        v
                               +------------------+
                               |    AWS SNS       |
                               |  (Topic:         |
                               | CloudStudyEvents)|
                               +--------+---------+
                                        |
                                        | Filter Policy
                                        v
                               +------------------+
                               |    AWS SQS       |
                               |  DbWriteQueue    |
                               |  NotificationQueue|
                               +--------+---------+
                                        |
                                        | (max 5 reintentos)
                                        v
                               +------------------+                            +------------------+
                               |   AWS Lambda     |                            |   Notification   |
                               |  (Consumer)      |--------------------------->|       API        |
                               +--------+---------+                            +--------+---------+
                                        |
                                        |
                                        v
     +--------------------------------------------------+
     |              Supabase (PostgreSQL)               |
     +--------------------------------------------------+
```

### Responsabilidades del frontend en este flujo

1. **Autenticación**: inicia el flujo PKCE contra Cognito y almacena el `id_token` en `localStorage`.
2. **Autorización visual**: protege rutas y muestra/oculta secciones según `cognito:groups`.
3. **Llamadas al BFF**: inyecta automáticamente `Authorization: Bearer <id_token>` y `x-secret-gateway` en cada petición.
4. **Sincronización asíncrona**: interpreta `202 Accepted` como *aceptado, no completado* y refresca la UI tras un margen de tiempo.
5. **UX resiliente**: muestra estados de carga, errores y feedback visual para cada operación.

---

## Patrón asíncrono en el frontend (EP3)

El sistema sigue una arquitectura **orientada a eventos** en la que las operaciones de escritura no bloquean al cliente. Desde la perspectiva del frontend, el flujo es:

```
Page  →  API Gateway  →  BFF  →  SNS  →  SQS  →  Lambda  →  Supabase
 (202)      (proxy)      (prod)  (topic)  (queue) (consumer)  (DB)
```

### Rol de cada operación

| Operación | Tipo | HTTP esperado | Estrategia del frontend |
|---|---|---|---|
| Listar cursos / alumnos / tareas | Síncrona (lectura) | `200 OK` | Render inmediato de la respuesta de Lambda |
| Crear curso / asignar docente | Asíncrona (escritura) | `202 Accepted` | Actualización optimista + `setTimeout(1500)` para recargar |
| Inscribir alumno | Asíncrona | `202 Accepted` | Actualización optimista + recarga diferida |
| Crear tarea | Asíncrona | `202 Accepted` | Limpieza de formulario + recarga diferida |
| Generar reporte | Asíncrona | `202 Accepted` | Feedback de "en proceso" y mensaje de confirmación |

### Estrategia de sincronización con la UI

Como el BFF responde `202 Accepted` antes de que el cambio esté persistido en Supabase, el frontend no puede asumir consistencia inmediata. La estrategia implementada es:

1. **Actualización optimista**: se limpia el formulario y se informa al usuario que la operación fue aceptada.
2. **Recarga diferida**: mediante `setTimeout(() => load(), 1500)` se vuelve a consultar el estado real 1.5 s después, dando tiempo a que la Lambda consumidora procese el mensaje de SQS y escriba en la base de datos.
3. **Recuperación ante fallo**: si la operación falla en el cliente, se muestra el error y, en el caso de borrado, se recarga el listado para restaurar el estado real.

Ejemplo (extracto de `AdminCourses.tsx`):

```tsx
const onCreate = async () => {
  try {
    await api.adminCreateCourse(token, { name, description, teacherId });
    setName(""); setDescription(""); setTeacherId("");
    setTimeout(() => load(), 1500); // refresco diferido
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
};
```

---

## Stack tecnológico

| Componente | Versión / Herramienta |
|---|---|
| React | 18+ |
| TypeScript | 5+ |
| Vite | Última estable |
| Router | `react-router-dom` |
| Autenticación OIDC | `react-oidc-context` + `oidc-client-ts` |
| Estilos | CSS plano (`index.css`) |
| Deploy | Vercel |

Dependencias clave:

- `react-oidc-context`: gestión del ciclo de vida OIDC (login, logout, silent renew).
- `oidc-client-ts`: motor PKCE y persistencia del token en `localStorage`.
- `react-router-dom`: enrutamiento declarativo con rutas protegidas.

---

## Estructura del proyecto

```
CloudFrontend/
├── .env.example              # Plantilla de variables de entorno
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx              # AuthProvider + BrowserRouter
    ├── App.tsx               # Rutas protegidas por rol
    ├── auth.ts               # Configuración OIDC (Cognito + PKCE)
    ├── api.ts                # Cliente HTTP al BFF (inyecta JWT y secreto)
    ├── types.ts              # DTOs compartidos (Course, Task, Enrollment, Me)
    ├── index.css             # Estilos base
    ├── App.css
    ├── components/
    │   ├── Layout.tsx        # Header con navegación por rol y logout
    │   └── RequireRole.tsx   # Guard de rutas basado en cognito:groups
    └── pages/
        ├── Home.tsx          # Perfil del usuario autenticado (/api/me)
        ├── AdminCourses.tsx  # CRUD de cursos + reportes
        ├── TeacherCourses.tsx
        ├── TeacherCourseDetail.tsx
        └── StudentDashboard.tsx
```

---

## Requisitos previos

- **Node.js 20+** y **npm 10+**
- Un **User Pool de Cognito** configurado con:
  - Hosted UI habilitada
  - Cliente de aplicación SPA (sin `client_secret`)
  - Flujo **Authorization Code** con **PKCE**
  - Grupos `Admin`, `Teacher`, `Student`
  - Scopes `openid email`
- Un **BFF desplegado** detrás de **AWS API Gateway** con el header `X-Secret-Gateway` configurado en las *stage variables*.

---

## Configuración

Crea un archivo `.env` (o `.env.local`) en la raíz del proyecto con las siguientes variables:

```env
# ---------- Backend BFF ----------
VITE_API_BASE_URL="https://<api-gateway>.execute-api.us-east-1.amazonaws.com"
VITE_GATEWAY_SECRET="<tu-secreto-gateway>"

# ---------- Cognito (IDaaS) ----------
VITE_COGNITO_AUTHORITY="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX"
VITE_COGNITO_CLIENT_ID="<client-id>"
VITE_COGNITO_REDIRECT_URI="http://localhost:5173/"
VITE_COGNITO_LOGOUT_URI="http://localhost:5173/"
VITE_COGNITO_HOSTED_UI_DOMAIN="<tu-dominio>.auth.us-east-1.amazoncognito.com"
```

### Referencia de variables

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | Sí | URL base del API Gateway (sin barra final) |
| `VITE_GATEWAY_SECRET` | Recomendada | Secreto compartido con API Gateway; se inyecta como `x-secret-gateway` |
| `VITE_COGNITO_AUTHORITY` | Sí | Issuer URI del User Pool |
| `VITE_COGNITO_CLIENT_ID` | Sí | App client de Cognito (SPA, sin client_secret) |
| `VITE_COGNITO_REDIRECT_URI` | Sí | URI de retorno tras login (debe estar registrada en Cognito) |
| `VITE_COGNITO_LOGOUT_URI` | No | URI de retorno tras logout; por defecto usa el redirect_uri |
| `VITE_COGNITO_HOSTED_UI_DOMAIN` | No | Dominio de la Hosted UI para construir la URL de logout |

> Si faltan variables críticas (`authority`, `client_id`, `redirect_uri`), `auth.ts` emite una advertencia en consola y la app no podrá autenticar correctamente.

---

## Ejecución local

```bash
# 1. Clonar e instalar
git clone https://github.com/gaboemi-duoc/cloudevaluacion-frontend.git
cd cloudevaluacion-frontend
npm install

# 2. Configurar entorno
cp .env.example .env
# editar .env con tus credenciales

# 3. Levantar en modo desarrollo
npm run dev
```

La aplicación queda disponible en `http://localhost:5173/`.

### Verificar el flujo

1. Abrir `http://localhost:5173/` → la SPA redirige al login de Cognito.
2. Autenticarse con un usuario del User Pool que pertenezca a algún grupo (`Admin`, `Teacher` o `Student`).
3. La SPA recibe el `id_token` por el redirect y lo persiste en `localStorage`.
4. Navegar a la sección correspondiente al rol.

---

## Rutas y vistas por rol

| Ruta | Rol requerido | Componente | Descripción |
|---|---|---|---|
| `/` | Autenticado | `Home` | Muestra subject, email y roles del usuario (`/api/me`) |
| `/admin` | `Admin` | `AdminCourses` | Gestión de cursos + generación de reportes |
| `/teacher` | `Teacher` | `TeacherCourses` | Listado de cursos asignados al docente |
| `/teacher/:id` | `Teacher` | `TeacherCourseDetail` | Detalle de curso: alumnos inscritos y tareas |
| `/student` | `Student` | `StudentDashboard` | Cursos inscritos, disponibles y tareas |

El control de acceso se implementa combinando:

- **`RequireRole`** — guard de rutas que redirige a `/` si el usuario no pertenece al grupo esperado.
- **`Layout`** — muestra/oculta los links de navegación según `cognito:groups`.
- **BFF** — el backend vuelve a validar el rol con `@PreAuthorize` (defensa en profundidad).

---

## Autenticación (Authorization Code + PKCE)

La configuración OIDC está centralizada en `src/auth.ts`:

```ts
export const oidcConfig: AuthProviderProps = {
  authority,          // Issuer de Cognito
  client_id: clientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: logoutUri,
  response_type: "code",           // Authorization Code + PKCE
  scope: "openid email",
  automaticSilentRenew: true,      // Renueva el token en segundo plano
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};
```

### Flujo

1. `auth.signinRedirect()` → redirige a la Hosted UI de Cognito.
2. Cognito autentica y redirige al `redirect_uri` con un `code`.
3. `react-oidc-context` intercambia el `code` por `id_token`, `access_token` y `refresh_token` usando PKCE.
4. El `id_token` se persiste en `localStorage` y se adjunta a las llamadas al BFF.
5. `automaticSilentRenew` renueva el token antes de su expiración.

### Logout

`cognitoLogoutUrl()` construye la URL de logout de Cognito para invalidar la sesión en el User Pool, y luego limpia el estado local con `auth.removeUser()`.

### Claims usados

| Claim | Uso en el frontend |
|---|---|
| `cognito:groups` | Enrutamiento por rol y navegación condicional |
| `email` | Mostrado en el header y enviado como identidad en operaciones de escritura |
| `sub` | Fallback cuando `email` no está disponible |

> **Importante:** se usa **`id_token`** (no `access_token`) porque Cognito incluye el claim `email` en el `id_token`; el `access_token` de Cognito no lo incluye.

---

## Consumo del BFF

El cliente HTTP está centralizado en `src/api.ts`. Todas las peticiones al BFF:

- Se construyen sobre `VITE_API_BASE_URL` + `/api`.
- Inyectan `Authorization: Bearer <id_token>`.
- Inyectan `x-secret-gateway: <VITE_GATEWAY_SECRET>` (requerido por el `SecretGatewayFilter` del BFF).
- Envían `Content-Type: application/json`.
- Lanzan `Error` con el cuerpo de la respuesta ante códigos `4xx`/`5xx`.

```ts
async function request<T>(path, token, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(GATEWAY_SECRET ? { "x-secret-gateway": GATEWAY_SECRET } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ...`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

### Mapa de operaciones expuestas

```ts
api.me(token)                                 // GET  /api/me
api.adminListCourses(token)                   // GET  /api/admin/courses
api.adminCreateCourse(token, body)            // POST /api/admin/courses       → 202
api.adminAssignTeacher(token, id, teacherId)  // PUT  /api/admin/courses/:id/teacher → 202
api.adminDeleteCourse(token, id)              // DELETE /api/admin/courses/:id → 202
api.adminEnrollStudent(token, id, studentId)  // POST /api/admin/courses/:id/enrollments → 202
api.adminListStudents(token, id)              // GET  /api/admin/courses/:id/students
api.adminGenerateReport(token)                // POST /api/admin/reports/generate → 202
api.teacherMyCourses(token)                   // GET  /api/teacher/courses
api.teacherStudents(token, id)                // GET  /api/teacher/courses/:id/students
api.teacherTasks(token, id)                   // GET  /api/teacher/courses/:id/tasks
api.teacherCreateTask(token, id, body)        // POST /api/teacher/courses/:id/tasks → 202
api.teacherEnrollStudent(token, id, studentId)// POST /api/teacher/courses/:id/enrollments → 202
api.studentMyCourses(token)                   // GET  /api/student/courses
api.studentAvailableCourses(token)            // GET  /api/student/courses/available
api.studentEnroll(token, id)                  // POST /api/student/courses/:id/enroll → 202
api.studentTasksOfCourse(token, id)           // GET  /api/student/courses/:id/tasks
api.studentAllTasks(token)                    // GET  /api/student/tasks
```

---

## Manejo de operaciones asíncronas

Debido al patrón `BFF → SNS → SQS → Lambda → Supabase`, las operaciones de escritura son **eventualmente consistentes**. El frontend implementa:

### 1. Feedback inmediato al usuario

Tras recibir `202 Accepted`, la SPA confirma que la operación fue encolada:

```tsx
setReportMsg("✅ Report generation initiated! Check notifications in a few seconds.");
```

### 2. Actualización optimista de la UI

Se limpian los formularios y campos para que el usuario pueda continuar; el nuevo registro aparecerá tras la siguiente recarga.

### 3. Refresco diferido

`setTimeout(..., 1500)` recarga la lista desde Lambda (lectura síncrona) cuando el consumidor SQS ya debió persistir el cambio en Supabase.

### 4. Recuperación ante fallo

Ante un error en la petición, se muestra el mensaje y se recarga el estado real:

```tsx
catch (e) {
  setError(e instanceof Error ? e.message : String(e));
  load(); // restore true state
}
```

### Vista de reportes

El módulo de reportes (`AdminCourses.tsx`) es el ejemplo más representativo del patrón asíncrono:

- Botón `Generate Course Report` → dispara `POST /api/admin/reports/generate`.
- Estado `generating` bloquea el botón mientras dura la petición.
- El BFF publica `GENERATE_REPORT` en SNS con atributo `action`.
- La **Filter Policy** enruta el evento a `NotificationQueue`.
- La Lambda `lambda-notification-worker` envía el correo al admin.
- El frontend muestra un mensaje de confirmación sin esperar la entrega del correo.

---

## Despliegue

El frontend se despliega automáticamente en **Vercel**:

- **Repositorio**: `gaboemi-duoc/cloudevaluacion-frontend`.
- **Framework preset**: Vite.
- **Build command**: `npm run build`.
- **Output directory**: `dist`.
- **Variables de entorno**: configuradas en *Project Settings → Environment Variables* con los mismos nombres que en `.env` (`VITE_*`).

### Entorno de producción

- URL pública: **https://cloudfrontend-pi.vercel.app/**
- El `VITE_API_BASE_URL` apunta al **API Gateway** en AWS.
- El `VITE_GATEWAY_SECRET` coincide con la *stage variable* `gatewaySecret` del API Gateway y con el `API_GATEWAY_SECRET` del BFF en EC2.

### CORS

El API Gateway debe permitir el origen del frontend en producción:

- `Access-Control-Allow-Origin`: `https://cloudfrontend-pi.vercel.app` (sin barra final)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers`: `Authorization, Content-Type, X-Secret-Gateway`

---

## Seguridad

### Capas de defensa

| Capa | Componente | Protege contra |
|---|---|---|
| 1 | **Cognito Hosted UI + PKCE** | Interceptación de códigos de autorización |
| 2 | **`react-oidc-context`** | Tokens expirados (`automaticSilentRenew`) |
| 3 | **`RequireRole`** | Acceso visual a rutas no autorizadas |
| 4 | **`api.ts`** | Inyección de JWT y secreto en cada request |
| 5 | **API Gateway + `X-Secret-Gateway`** | Peticiones fuera del gateway |
| 6 | **BFF `@PreAuthorize`** | Autorización real por rol (defensa en profundidad) |
| 7 | **SNS Filter Policy** | Enrutamiento de eventos solo a consumidores interesados |

---

## Recursos

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [react-oidc-context](https://github.com/authts/react-oidc-context)
- [oidc-client-ts](https://github.com/authts/oidc-client-ts)
- [AWS Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [AWS SNS Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [Vercel Documentation](https://vercel.com/docs)

---

## Autor

**Gabriel Emilio** — `gaboemi@duoc.cl`

Asignatura: **DSY1107 Desarrollo Cloud Native**
Evaluación Parcial N° 3 — 2026