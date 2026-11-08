# Agro Nova

Aplicación web para administrar un inventario de productos agropecuarios. El proyecto está compuesto por una API REST con NestJS, MongoDB para persistencia y un cliente web Angular.

## Contenido

- [Qué incluye](#qué-incluye)
- [Tecnologías y estructura](#tecnologías-y-estructura)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Cómo funciona la aplicación](#cómo-funciona-la-aplicación)
- [API](#api)
- [Pruebas y validaciones](#pruebas-y-validaciones)
- [Configuración para producción](#configuración-para-producción)

## Qué incluye

- Inicio de sesión y autenticación mediante JWT.
- Registro de cuentas de usuario desde la interfaz.
- Roles `admin` y `user`; la eliminación de productos está reservada a administradores.
- Catálogo con búsqueda por nombre o SKU, filtros, ordenamiento y paginación.
- Creación, edición, activación/desactivación y consulta de productos.
- Registro de fechas y usuarios que crean o actualizan productos.
- Interfaz en español, diseño adaptable, notificaciones y confirmación antes de eliminar.

El registro público crea cuentas con rol `user`. El administrador se configura por separado mediante variables de entorno al iniciar el backend.

## Tecnologías y estructura

| Parte | Tecnologías |
| --- | --- |
| Backend | Node.js, TypeScript, NestJS 11, Mongoose, MongoDB, Passport/JWT |
| Frontend | Angular 22, TypeScript, Angular Material, NgRx Signals |
| Base de datos local | MongoDB con Docker Compose (opcional) |

```text
backend/
  src/auth/       Registro, login, estrategia JWT, guards y roles
  src/products/   API, validación y persistencia de productos
  src/users/      Usuarios, roles y creación inicial del administrador
  test/           Pruebas e2e de autenticación y productos
  docker-compose.yaml  MongoDB local
  .env.example
frontend/
  src/app/core/       Autenticación, interceptores y notificaciones
  src/app/features/   Login/registro, inventario, detalle y formularios
  src/app/shared/     Componentes compartidos de marca y confirmación
  src/environments/   URL de la API por configuración
```

## Requisitos

- Node.js compatible con las versiones de Angular y NestJS instaladas.
- Yarn Classic (`1.22.22`), usado por ambos proyectos y sus archivos `yarn.lock`.
- Docker Desktop con Docker Compose, solo si vas a ejecutar MongoDB localmente en Docker.

## Inicio rápido

En PowerShell, desde la raíz, crea el archivo de variables de entorno del backend:

```powershell
Set-Location backend
Copy-Item .env.example .env
```

Edita `backend/.env` y define valores propios para `MONGO_USER`, `MONGO_PASSWORD`, `MONGODB_DATABASE`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Genera un secreto JWT aleatorio, por ejemplo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
```

No uses las credenciales de ejemplo en un entorno compartido o desplegado. El archivo `.env` contiene secretos y no debe publicarse.

Inicia MongoDB localmente con Docker Compose:

```powershell
docker compose up -d mongo
```

La API se ejecuta directamente con Yarn, no desde Docker. Desde `backend/`, instala dependencias e inicia NestJS:

```powershell
yarn install --frozen-lockfile
yarn start:dev
```

La API queda disponible en `http://localhost:3000/api`. La documentación Swagger está en `http://localhost:3000/api/docs` mientras `NODE_ENV` no sea `production`. MongoDB escucha en `localhost:27017`.

En otra terminal, desde la raíz, instala las dependencias del frontend e inicia Angular:

```powershell
Set-Location frontend
yarn install --frozen-lockfile
yarn start
```

Abre `http://localhost:4200`. El servidor de desarrollo utiliza `http://localhost:3000/api` como URL de la API. Configura `CORS_ORIGINS` en `backend/.env` para incluir el origen local del frontend, normalmente `http://localhost:4200`.

El administrador inicial se crea al arrancar la API solo si `ADMIN_EMAIL` y `ADMIN_PASSWORD` están configurados y aún no existe un usuario con ese correo. Inicia sesión con esos valores; no hay una cuenta administrativa universal preconfigurada.

Para detener MongoDB, usa `docker compose down` desde `backend/`. Los datos se conservan en `backend/mongo-data`.

## Ejecución en desarrollo

En desarrollo, MongoDB puede ejecutarse localmente en Docker mientras la API y el frontend se ejecutan directamente con Yarn.

1. Crea y configura `backend/.env` siguiendo los pasos anteriores.
2. Desde `backend/`, inicia MongoDB:

   ```powershell
   docker compose up -d mongo
   ```

3. En una terminal, instala dependencias e inicia la API:

   ```powershell
   Set-Location backend
   yarn install --frozen-lockfile
   yarn start:dev
   ```

4. En otra terminal, inicia Angular:

   ```powershell
   Set-Location frontend
   yarn install --frozen-lockfile
   yarn start
   ```

La API también ofrece `yarn start` (inicio normal), `yarn start:debug`, `yarn build` y `yarn start:prod` desde `backend/`. Para compilar el frontend, ejecuta `yarn build` desde `frontend/`.

## Cómo funciona la aplicación

### Inicio de sesión y permisos

1. El login envía correo y contraseña a `POST /api/auth/login`.
2. El registro valida nombre, correo, contraseña y confirmación en el cliente, y envía `name`, `email` y `password` a `POST /api/auth/register`.
3. Tras un registro exitoso, el cliente inicia sesión automáticamente con esas credenciales; muestra una confirmación y navega al inventario. Los correos duplicados se señalan en el formulario.
4. El backend comprueba la contraseña con bcrypt, almacena su hash y crea los registros nuevos con rol `user`. El login devuelve un JWT y los datos públicos del usuario.
5. El cliente guarda la sesión en `localStorage` y adjunta el token como `Authorization: Bearer …` a las llamadas a la API.
6. Las rutas del inventario requieren sesión. Si una llamada devuelve `401`, el cliente limpia la sesión y vuelve al login.
7. El backend valida el JWT y vuelve a comprobar que el usuario exista y esté activo. Por defecto, las rutas requieren autenticación; el registro y el login son públicos.

Los dos roles son `user` y `admin`. Los usuarios autenticados pueden consultar, crear, editar y activar o desactivar productos. Solo `admin` puede eliminarlos. La restricción se valida también en el backend, no solo en la interfaz.

El backend limita globalmente el tráfico a 60 solicitudes por minuto y limita el registro y el login a 5 solicitudes por minuto por ruta.

### Inventario de productos

- Cada producto tiene nombre, SKU único, categoría, precio, stock, estado activo/inactivo y, opcionalmente, descripción e imagen.
- El precio y el stock no pueden ser negativos. El ID generado es un UUID.
- El listado permite buscar por nombre o SKU, filtrar por categoría, estado, ordenar y paginar.
- El listado devuelve `data` y `meta`, que incluye total, página, tamaño y cantidad de páginas.
- La interfaz muestra precios en pesos colombianos (COP), detalles de auditoría, formularios de creación/edición y confirmación de eliminación.

### Rutas del frontend

| Ruta | Comportamiento |
| --- | --- |
| `/login` | Inicio de sesión; redirige al inventario si ya existe una sesión |
| `/register` | Registro de usuario; redirige al inventario si ya existe una sesión |
| `/products` | Inventario protegido por autenticación |
| `/products/:id` | Detalle de un producto, también protegido |
| `/` y rutas desconocidas | Redirigen a `/products` |

## API

Todas las rutas siguientes se sirven bajo `/api`. Excepto el registro y el login, requieren un JWT en el encabezado `Authorization: Bearer <token>`.

### Autenticación

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Crea un usuario con rol `user` |
| `POST` | `/api/auth/login` | Público | Valida credenciales y devuelve `access_token` y usuario |
| `GET` | `/api/auth/profile` | JWT | Devuelve el usuario autenticado |

El registro requiere `name`, `email` y `password`. La contraseña debe tener entre 8 y 64 caracteres, e incluir al menos una mayúscula y un número. No se puede asignar el rol mediante el cuerpo del registro.

Ejemplo de inicio de sesión:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@tu-dominio.com",
  "password": "<ADMIN_PASSWORD configurada en backend/.env>"
}
```

### Productos

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/products` | JWT | Lista, filtra, ordena y pagina productos |
| `POST` | `/api/products` | JWT | Crea un producto |
| `GET` | `/api/products/:id` | JWT | Consulta un producto por UUID |
| `PATCH` | `/api/products/:id` | JWT | Actualiza uno o más campos |
| `DELETE` | `/api/products/:id` | Solo `admin` | Elimina un producto |

Campos requeridos para crear un producto: `name`, `sku`, `price`, `stock` y `category`. `description`, `imageUrl` y `active` son opcionales.

Parámetros de `GET /api/products`:

| Parámetro | Valores / comportamiento |
| --- | --- |
| `page`, `limit` | Números mayores o iguales a 1; por defecto página `1`, tamaño `10` |
| `search` | Texto buscado en nombre y SKU |
| `category` | Coincidencia exacta de categoría |
| `active` | `true` o `false` |
| `stock` | `out` (agotado), `low` (1–10) u `ok` (más de 10) |
| `sort` | `newest` (predeterminado), `name_asc`, `price_asc`, `price_desc` o `stock_asc` |

Ejemplo: `GET /api/products?page=1&limit=10&search=semilla&active=true&stock=low&sort=price_asc`.

## Pruebas y validaciones

Ejecuta cada comando desde la carpeta correspondiente:

```powershell
# Backend: compilar y revisar estilo
Set-Location backend
yarn build
yarn lint

# Backend: suite de integración/e2e
yarn test:e2e

# Frontend: compilar y ejecutar el runner de pruebas
Set-Location ..\frontend
yarn build
yarn test
```

La suite e2e del backend (`backend/test/products.e2e-spec.ts`) ejecuta `dropDatabase()` sobre la conexión de MongoDB al iniciar. Antes de correr `yarn test:e2e`, configura `MONGO_URI` para apuntar a una base de datos de pruebas aislada; no uses la base de desarrollo ni producción. El frontend tiene pruebas de componentes para el registro y el contenedor visual compartido de autenticación. Estas pruebas son básicas y no reemplazan pruebas de integración de los flujos de registro/login ni pruebas e2e del navegador.

## Configuración para producción

- Configura `JWT_SECRET`, credenciales de MongoDB y credenciales administrativas seguras mediante variables de entorno.
- Configura `CORS_ORIGINS` con los orígenes web autorizados, separados por comas.
- Define `NODE_ENV=production`; Swagger no se publica en ese modo. El backend usa Helmet y escucha en el puerto indicado por `PORT` (por defecto `3000`).
- Construye la API con `yarn build` y ejecútala con `yarn start:prod` desde `backend/`.
- Construye el frontend con `yarn build` y sírvelo detrás de un servidor web adecuado.
- **Configura la URL de API para el build de producción:** `frontend/src/environments/environment.ts` actualmente apunta a `http://localhost:3000` sin el prefijo `/api`. Antes de desplegar, actualízala para usar la URL pública completa de la API, incluido `/api`. El servidor de desarrollo sí usa ese prefijo.
- Protege los secretos, restringe CORS y TLS según el entorno, y no expongas MongoDB directamente a Internet.
