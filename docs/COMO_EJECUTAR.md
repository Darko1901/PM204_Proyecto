# Cómo ejecutar el proyecto — Sistema de Gestión de Cafetería (2º Parcial)

Guía de arranque "desde que enciendo el equipo". Todos los comandos salen de los archivos
reales del repo (`docker-compose.yml`, `.env.example`, `api/`, `web/package.json`,
`mobile/coffeCode/`). Si algo no está definido en el repo, se indica explícitamente.

Arquitectura: **API** (FastAPI, único que toca PostgreSQL) · **web** (React+Vite, panel admin) ·
**móvil** (React Native + Expo, módulos Cocina/Caja/Mesero). La BD es PostgreSQL en Docker.

---

## 1. Requisitos previos (instalar una sola vez)

| Software | Versión | Para qué | De dónde sale |
|---|---|---|---|
| **Docker + Docker Compose v2** | Docker 24+ / Compose v2 | Levantar API + PostgreSQL | `docker-compose.yml` (usa `postgres:16`, build de `./api` con `python:3.12-slim`) |
| **Node.js + npm** | **Node 20 LTS o superior** | Web (Vite) y móvil (Expo SDK 54) | `web/package.json` (vite 8, react 19) y `mobile/coffeCode/package.json` (expo ~54, RN 0.81). No hay `engines` fijado; 20+ es lo que pide Expo 54. |
| **Expo Go** (app en tu teléfono) o **Android Studio / Xcode** | Expo Go SDK 54 | Abrir el móvil | `mobile/coffeCode/app.json` (Expo) |
| *(opcional)* **Python** | 3.12 (3.11+) | Solo si corres el API en el host sin Docker | `api/Dockerfile` usa `python:3.12-slim`; `api/README.md` dice 3.11+ |

> Con Docker **no necesitas Python ni instalar dependencias del API a mano**: la imagen se
> construye sola. Python local solo hace falta para el modo alternativo "sin Docker" (§ 5).

---

## 2. Arranque paso a paso (en orden)

Todos los comandos de Docker se ejecutan desde la **raíz del repo** (donde está `docker-compose.yml`).

### Paso 0 — Crear el archivo `.env` (una sola vez)

El `docker-compose.yml` lee un `.env` en la raíz (es la única fuente de configuración). Cópialo
de la plantilla y **rellena los valores vacíos**:

```bash
cp .env.example .env
```

Variables que hay que definir en `.env` (las que vienen vacías en `.env.example`):

| Variable | Qué es |
|---|---|
| `POSTGRES_USER` | usuario de PostgreSQL (tú lo eliges, p.ej. `cafeteria`) |
| `POSTGRES_PASSWORD` | contraseña de PostgreSQL (tú la eliges) |
| `POSTGRES_DB` | nombre de la BD (por defecto `cafeteria_db`) |
| `JWT_SECRET` | secreto para firmar los JWT (cadena larga aleatoria) |
| `APP_ENV` | `development` |
| `ADMIN_EMAIL` | correo del usuario admin (opcional; ver nota) |
| `ADMIN_PASSWORD` | contraseña de ese admin (opcional; ver nota) |

> **Credenciales del admin:** `.env.example` ya trae `ADMIN_EMAIL=admin@cafeteria.com` y
> `ADMIN_PASSWORD=cafe2026` — son las credenciales de evaluación académica definidas como
> constantes en `api/app/seed.py` (`ADMIN_EMAIL_DEFAULT` / `ADMIN_PASSWORD_DEFAULT`). Si dejas
> esas dos variables vacías en tu `.env`, el seed usa esas constantes igual; si les pones un
> valor propio, ese valor gana. Los otros tres usuarios (mesero, caja, cocina) **no tienen
> variable de entorno**: siempre salen de las constantes del seed. Tabla completa de las 4
> cuentas en **[`docs/CREDENCIALES.md`](CREDENCIALES.md)**. El `.env` está en `.gitignore`: no
> se sube.

### Paso a) Levantar API + PostgreSQL (Docker)

```bash
docker compose up -d --build
```

Esto arranca dos servicios (según `docker-compose.yml`):
- **db** — PostgreSQL 16, puerto `5432`, datos en el volumen `pgdata` (persisten). Tiene
  healthcheck; el API espera a que esté "healthy".
- **api** — FastAPI en `http://localhost:8000`, con **hot reload** (`uvicorn ... --reload` y el
  código montado como volumen: editas `api/` y se recarga solo).

**Cómo saber que está arriba:**
```bash
curl http://localhost:8000/health      # -> {"status":"ok"} (o 200)
```
o abre en el navegador la documentación interactiva de FastAPI: **http://localhost:8000/docs**

### Paso b) Migración + seed (obligatorio la primera vez)

El contenedor del API **no** corre las migraciones solo: hay que aplicarlas. La BD arranca vacía.
Este es el **único camino oficial** para dejar la BD lista — nunca `init_db.py` ni
`reset_clean.py` (ver Paso b.2).

```bash
# 1) Crear las 13 tablas (migración inicial de Alembic; la URL la toma del entorno del contenedor)
docker compose run --rm api alembic upgrade head

# 2) Sembrar roles + los 4 usuarios base
docker compose run --rm api python -m app.seed

# 2-bis) O, para tener también catálogo y datos de operación de ejemplo:
docker compose run --rm api python -m app.seed --demo
```

- `api/app/seed.py` (`python -m app.seed`) es la **única fuente de verdad** de usuarios: crea los
  4 roles y **4 usuarios**, uno por rol, todos con dominio `@cafeteria.com`. Es idempotente
  (correrlo otra vez no duplica nada). Las credenciales exactas están en
  **[`docs/CREDENCIALES.md`](CREDENCIALES.md)**; en resumen, admin/mesero/caja/cocina con la
  misma contraseña (`cafe2026` por defecto).
- Con la bandera `--demo` además crea catálogo y operación: suministros (con 3 por debajo de su
  mínimo, a propósito, para probar las alertas), productos en varias categorías con sus recetas,
  mesas, y del orden de 150-160 cuentas repartidas en los últimos 60 días y en los 4 estados de
  cuenta, con sus pagos, tickets y compras — para que el Dashboard y los tres reportes tengan
  contenido real desde el primer arranque. También es idempotente: si ya hay cuentas sembradas,
  la fase `--demo` no vuelve a insertar.

> A partir de aquí el API ya responde con datos. Como el paso (a) dejó el API corriendo con
> `--reload`, no hace falta reiniciarlo tras migrar/sembrar.

### Paso b.2) `init_db.py` y `reset_clean.py` — utilidades legacy, NO usar para la BD de evaluación

Estos dos scripts siguen existiendo en `api/` pero **ya no crean usuarios propios**: ambos
delegan en `api/app/seed.py` (`seed.run(demo=...)`), así que las credenciales que producen son
siempre las mismas 4 cuentas `@cafeteria.com` de `docs/CREDENCIALES.md` — antes cada script traía
las suyas y no coincidían entre sí, eso ya no puede pasar.

Aun así, **ninguno de los dos es el camino oficial** para preparar la BD que se va a presentar:

- **`api/init_db.py`** — hace `Base.metadata.create_all(bind=engine)` y luego
  `seed.run(demo=True)`. `create_all` **bypassa Alembic** por completo: crea las tablas leyendo
  los modelos actuales, no reproduce el historial de migraciones. Es seguro correrlo sobre tablas
  ya migradas (no las toca si ya existen, y el seed que llama es idempotente), pero **la tabla
  `alembic_version` puede terminar sin relación real con cómo se construyó el esquema**.
- **`api/reset_clean.py`** — hace `drop_all()` + `create_all()` y luego `seed.run(demo=...)`.
  Mismo problema que `init_db.py`, agravado porque además **borra todo antes**. Ver Paso b.3.

> **Por qué importa:** `drop_all()`/`create_all()` operan sobre `Base.metadata` (los modelos de
> SQLAlchemy), y la tabla `alembic_version` **no** es parte de esa metadata — Alembic la crea y
> gestiona aparte. Si corres `alembic upgrade head` una vez y **después** corres
> `reset_clean.py`/`init_db.py`, `alembic_version` se queda con el estado viejo (marcando
> `head`) mientras las tablas reales fueron recreadas por `create_all`, no por la migración. El
> comando `alembic current` puede entonces mostrar `head` sin que eso sea evidencia real de que
> el esquema salió de Alembic. Para la BD que se presenta en la evaluación, la única secuencia
> válida es la del Paso b: `down -v` → `up --build` → `alembic upgrade head` →
> `python -m app.seed --demo`, sin `init_db.py` ni `reset_clean.py` de por medio, ni antes ni
> después.

Usa estos dos scripts solo para experimentar en local si quieres una vía rápida con `create_all`
(por ejemplo, sin querer escribir una migración todavía); no para la BD final.

> `api/check_db.py` es un script de inspección antiguo que apunta a un SQLite local
> (`cafeteria.db`); no aplica al flujo con PostgreSQL/Docker y puedes ignorarlo.

### Paso b.3) Scripts DESTRUCTIVOS: NO correr en tu BD con datos

Estos dos borran datos. Si ejecutas cualquiera, tus usuarios y demás registros **desaparecen**:

- **`api/reset_clean.py`** — hace `drop_all()` (BORRA TODAS LAS TABLAS), las recrea con
  `create_all` (bypassando Alembic, ver Paso b.2) y vuelve a sembrar vía `seed.run(...)`. Es una
  herramienta de desarrollo para empezar de cero rápido; **no la corras** en la BD que vas a usar
  para la evaluación.
- **`docker compose down -v`** — el `-v` borra el volumen `pgdata`, es decir, toda la BD.

Si tras usar la app "de repente" faltan usuarios o datos de ejemplo, casi siempre es porque se
corrió `reset_clean.py`, un `down -v`, o un `alembic downgrade`. NO fue la migración ni el panel
web: el API **no tiene** endpoint para borrar usuarios (ver nota en el Apéndice).

### Paso c) Levantar el web (React + Vite)

Desde la carpeta `web/`:

```bash
cd web
npm install        # solo la primera vez (o si cambió package.json)
npm run dev
```

- Vite sirve la app en **http://localhost:5173** (puerto por defecto de Vite).
- **A qué API apunta:** está fijado en `web/src/api.js`, primera línea:
  `const API_BASE_URL = 'http://localhost:8000';`. Coincide con el API de Docker, así que funciona
  sin tocar nada. (No hay `.env` ni variables `VITE_` en el web; si algún día el API cambia de host,
  se edita **esa línea**.)
- **Confirmar que habla con el API:** abre http://localhost:5173, entra con el admin
  (`admin@cafeteria.com` / `cafe2026`, ver `docs/CREDENCIALES.md`); si el login pasa y ves el
  dashboard, el web está hablando con el API correctamente.
- **El portal web es exclusivo del rol administrador.** El login del web manda
  `scope=portal_admin` en el `POST /auth/login`; el API responde `403` a cualquier usuario cuyo
  rol no sea `administrador`, sin llegar a emitir token (`api/app/routers/auth.py`). Si pruebas
  con `mesero@cafeteria.com`, `caja@cafeteria.com` o `cocina@cafeteria.com` en el web, es
  **normal** que el login rechace con ese 403 — esas tres cuentas son para la app móvil, no para
  el web.

### Paso d) Levantar el móvil (Expo SDK 54)

Desde `mobile/coffeCode/`:

```bash
cd mobile/coffeCode
npm install        # solo la primera vez
npx expo start     # equivale a "npm start"
```

Cómo abrirlo (scripts de `mobile/coffeCode/package.json`):
- **Teléfono físico:** instala **Expo Go** y escanea el QR que muestra la terminal.
- **Emulador Android:** `npm run android` (requiere Android Studio).
- **iOS (solo Mac):** `npm run ios`.
- **En el navegador:** `npm run web`.

> **La app móvil es 100% *mock*** (frontend): los datos vienen de
> `mobile/coffeCode/src/data/mockData.js` ("*imitan las respuestas del API REST*"). **No hace
> ninguna llamada de red**, así que **no necesita el API** para mostrar las pantallas de
> Cocina/Caja/Mesero + Login. No hay URL de backend que ajustar. (Cuando en el futuro se conecte
> al API real, habrá que recordar que en un **dispositivo físico `localhost` no sirve**: tendrás
> que usar la **IP LAN** del equipo, p.ej. `http://192.168.x.x:8000`.)

---

## 3. Verificación de que TODO corre (checklist)

| Componente | Cómo comprobarlo | Resultado esperado |
|---|---|---|
| **API** | Abrir http://localhost:8000/docs | Swagger UI con todos los endpoints |
| **API salud** | `curl http://localhost:8000/health` | `200` / `{"status":"ok"}` |
| **Web** | Abrir http://localhost:5173 y hacer login con el admin | Entra al dashboard |
| **Móvil** | Escanear el QR con Expo Go | Carga el Login y navega por los 3 módulos (con datos mock) |

**2–3 llamadas de prueba al API** (desde `/docs` o `curl`), con las credenciales de
`docs/CREDENCIALES.md`:

```bash
# 1) Login -> devuelve un access_token (form-urlencoded, campos username/password)
curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=admin@cafeteria.com" \
  --data-urlencode "password=cafe2026"
# Esperado: 200 con {"access_token":"...","token_type":"bearer"}

# 2) Guardar el token y consultar un endpoint protegido
TOKEN="pega-aqui-el-access_token"
curl -s http://localhost:8000/usuarios              -H "Authorization: Bearer $TOKEN"   # 200, lista de usuarios
curl -s http://localhost:8000/estadisticas          -H "Authorization: Bearer $TOKEN"   # 200, métricas del dashboard (solo admin)
curl -s "http://localhost:8000/reportes/preview?tipo=pedidos" -H "Authorization: Bearer $TOKEN"   # 200, filas del reporte
```

Estado verificado en integración: `GET /health`, `POST /auth/login`, y un endpoint por bloque
(cocina/caja/mesero/estadísticas/reportes) responden **200** con el token de admin. Con la BD
sembrada vía `python -m app.seed --demo`, `GET /reportes/preview?tipo=pedidos` devuelve del orden
de 150-160 filas, `tipo=productos` 9 y `tipo=inventario` 10 (los conteos exactos de pedidos
varían porque el seed genera fechas/cantidades al azar).

---

## 4. Apagado / reinicio

**Bajar el stack sin perder datos** (el volumen `pgdata` persiste):
```bash
docker compose down
```
> NO uses `docker compose down -v`: el `-v` **borra el volumen** y perderías la BD (tendrías que
> volver a migrar y sembrar). Tampoco corras `api/reset_clean.py` (ver Paso b.3): vacía la BD.

**Re-arrancar al día siguiente (o el día de la evaluación)** — versión corta, con `.env` ya
creado y la BD ya migrada/sembrada por el camino oficial (Paso b):
```bash
docker compose up -d          # API + PostgreSQL (SIN --build, SIN alembic, SIN seed)
cd web && npm run dev          # web (en otra terminal)
cd mobile/coffeCode && npx expo start   # móvil (en otra terminal)
```
La migración y el seed **no** se repiten (los datos siguen en el volumen `pgdata`). Solo los
repites si borraste el volumen (`down -v`) o cambiaste el esquema — y si los repites, hazlo
siempre por el camino del Paso b (`alembic upgrade head` + `python -m app.seed --demo`), nunca
con `init_db.py` ni `reset_clean.py` (Paso b.2).

---

## 5. Problemas comunes

- **Puerto ocupado (`5432` o `8000`):** ya tienes otro PostgreSQL/servicio usando el puerto.
  Detén lo que lo ocupe, o cambia el mapeo en `docker-compose.yml` (`ports: "5433:5432"` /
  `"8001:8000"`); si cambias el `8000` del API, actualiza también `API_BASE_URL` en
  `web/src/api.js`. Para Vite (`5173`) puedes usar `npm run dev -- --port 5174`.
- **El API responde pero los endpoints fallan con error de BD / tabla inexistente:** te faltó el
  Paso b (`alembic upgrade head`). Córrelo.
- **Login falla (401) aunque el API esté arriba:** no corriste `python -m app.seed`, o el
  usuario/clave no coinciden con los de `docs/CREDENCIALES.md` (por defecto
  `admin@cafeteria.com` / `cafe2026`, y equivalente para mesero/caja/cocina).
- **Login falla (403) con "Este portal es exclusivo para administradores":** es esperado si
  intentas entrar al **web** con `mesero@cafeteria.com`, `caja@cafeteria.com` o
  `cocina@cafeteria.com` — esas tres cuentas son para la app móvil, no para el panel web (ver
  Paso c). No es un bug ni una BD mal sembrada.
- **"De repente desaparecieron los usuarios / datos de ejemplo":** no es la migración ni el panel
  web. Se corrió un script destructivo (`api/reset_clean.py`, un `docker compose down -v`, o un
  `alembic downgrade`). Para recuperarlos, reconstruye por el camino oficial (Paso b): no hace
  falta `init_db.py` — `python -m app.seed --demo` ya crea los 4 usuarios y todo el catálogo de
  demostración.
- **`alembic current` muestra `head` pero no confías en que la BD salió de una migración:**
  puede pasar si después de migrar corriste `init_db.py` o `reset_clean.py` (Paso b.2): esos
  scripts usan `create_all`/`drop_all`, que no tocan la tabla `alembic_version` para nada, así
  que el "head" se queda ahí de una corrida anterior de `alembic upgrade head` aunque las tablas
  reales se hayan recreado por fuera de Alembic. La única forma de estar seguro es no haber
  corrido esos dos scripts después de migrar; si tienes duda, reconstruye desde cero con
  `down -v` → `up --build` → `alembic upgrade head` → `python -m app.seed --demo`.
- **`docker compose run` se queja de variables vacías:** falta el `.env` o tiene campos sin
  rellenar (Paso 0).
- **Web con error de CORS o "Failed to fetch":** el API no está arriba, o `API_BASE_URL` en
  `web/src/api.js` no apunta al host correcto. El API ya trae CORS abierto (`allow_origins=["*"]`),
  así que en local no debería dar CORS si la URL es correcta.
- **`api/README.md` dice `cp .env.example .env` dentro de `api/`:** ese `api/.env.example` **no
  existe**; la plantilla real es el **`.env.example` de la raíz** (§ Paso 0). Para el modo
  Docker usa siempre el `.env` raíz.
- **Modo "sin Docker" (API en el host):** `cd api && python -m venv .venv && source .venv/bin/activate
  && pip install -r requirements.txt`, crea un `api/.env` con
  `DATABASE_URL=postgresql+psycopg2://usuario:password@localhost:5432/cafeteria_db` (ver comentario
  en `.env.example`) + `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, y corre
  `alembic upgrade head`, `python -m app.seed`, `uvicorn app.main:app --reload`. Necesitas un
  PostgreSQL accesible en `localhost:5432`.

---

## 6. Apéndice — endpoints por módulo (para probar en Postman / Swagger)

**Postman:** en el repo **no hay** colección versionada (`*.postman_collection.json`). Dos formas
de probar igual:
1. **Swagger UI** (recomendado, ya viene): http://localhost:8000/docs — probar cada endpoint desde
   el navegador con el botón *Authorize* (pega el `access_token` del login).
2. **Importar a Postman:** File > Import, pega la URL del OpenAPI **http://localhost:8000/openapi.json**;
   Postman genera la colección. Luego define una variable `{{baseUrl}} = http://localhost:8000` y un
   Bearer token con el `access_token`.

Los 49 endpoints registrados, agrupados por bloque (tal como están en el API):

**Autenticación / base**
- `POST /auth/login` · `GET /auth/me` · `GET /health`

**Admin / catálogo (panel web)**
- Usuarios: `GET /usuarios` · `POST /usuarios` · `GET /usuarios/{id}` · `PATCH /usuarios/{id}` · `PATCH /usuarios/{id}/estado` · `PATCH /usuarios/{id}/password`
  - Nota: **no existe `DELETE /usuarios`**. El panel web solo puede **desactivar** un usuario
    (`PATCH /usuarios/{id}/estado`), no borrarlo. Por eso una pérdida masiva de usuarios nunca
    viene de la app, sino de un script destructivo sobre la BD (ver Paso b.3).
- Roles: `GET /roles` · `POST /roles` · `PATCH /roles/{id}` · `DELETE /roles/{id}`
- Productos: `GET /productos` · `POST /productos` · `GET /productos/{id}` · `PATCH /productos/{id}` · `DELETE /productos/{id}`
- Recetas: `GET /productos/{id}/receta` · `POST /productos/{id}/receta` · `DELETE /productos/recetas/{receta_id}`
- Suministros: `GET /suministros` · `POST /suministros` · `GET /suministros/{id}` · `PATCH /suministros/{id}` · `POST /suministros/{id}/ajuste` · `GET /suministros/movimientos`

**Mesero** (cuentas y mesas)
- `GET /mesas` · `POST /mesas`
- `GET /cuentas` · `POST /cuentas` · `GET /cuentas/{id}` · `POST /cuentas/{id}/detalles` · `GET /cuentas/{id}/ticket`

**Caja** (cobro y compras)
- `PATCH /cuentas/{id}/cerrar` · `POST /cuentas/{id}/pagar`
- `GET /compras` · `POST /compras` · `GET /compras/{id}`

**Cocina** (cola de ítems)
- `GET /items` · `GET /items/{id}` · `PATCH /items/{id}/estado`
- (también cocina puede actualizar detalle vía `PATCH /cuentas/detalles/{detalle_id}`)

**Estadísticas / reportes** (todos exigen rol **administrador**, `require_roles(roles.ADMIN)`)
- `GET /estadisticas?dias=30` — agregados para el Dashboard (gastos, ganancias, ventas por
  producto). Antes aceptaba cualquier usuario autenticado; ahora exige administrador igual que el
  resto de este bloque.
- `GET /reportes/ventas/hoy` — sin parámetros, total y tickets emitidos del día.
- `GET /reportes/resumen?desde&hasta&tipo_cuenta&categoria` — resumen con ventas por día y top/bottom de productos.
- `GET /reportes/preview?tipo&desde&hasta&tipo_cuenta&categoria&solo_bajo_minimo&busqueda` — vista
  previa en JSON (`columnas`, `filas`, `total_filas`, `filtros_aplicados`) que alimenta la tabla
  de la pantalla Reportes del web.
- `GET /reportes/export/pdf?tipo&desde&hasta&tipo_cuenta&categoria&solo_bajo_minimo&busqueda` — mismo filtrado, en PDF (reportlab).
- `GET /reportes/export/xlsx?tipo&desde&hasta&tipo_cuenta&categoria&solo_bajo_minimo&busqueda` — mismo filtrado, en XLSX (openpyxl).
  - `tipo` es obligatorio en `preview`/`export/*`: `pedidos` | `productos` | `inventario`
    (`ventas` se sigue aceptando como alias histórico de `pedidos`).
  - `tipo_cuenta` y `categoria` solo aplican al tipo `pedidos` y `productos` respectivamente;
    `solo_bajo_minimo` y `busqueda` (nombre parcial, case-insensitive) aplican a `inventario`
    (`busqueda` también a `productos`). El PDF y el XLSX imprimen los filtros aplicados como
    subtítulo/encabezado.

> Nota: casi todos los endpoints requieren `Authorization: Bearer <token>` y un rol adecuado
> (`require_roles`). Con el usuario admin del seed puedes probar la mayoría; el bloque de
> Estadísticas/reportes y el resto del panel web solo funcionan con administrador (ver Paso c).
> Credenciales completas en **[`docs/CREDENCIALES.md`](CREDENCIALES.md)**.
