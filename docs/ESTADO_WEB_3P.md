# Estado del proyecto — Diagnóstico Web (3er Parcial)

> Documento de **solo lectura**. Generado el 2026-08-04. No contiene recomendaciones
> ni propuestas de solución, únicamente hechos verificados en el repo con ruta de
> archivo y línea. Donde no se encontró evidencia, se anota explícitamente **NO EXISTE**.

---

## 1. Estado del repo

### Rama actual

`main` (según `git branch --show-current`). Working tree limpio (`git status` →
`nothing to commit, working tree clean`), sincronizado con `origin/main`
(`branch.ab +0 -0`).

### Últimos 10 commits de `main`

| Hash    | Autor                      | Fecha      | Mensaje |
|---------|-----------------------------|------------|---------|
| 1a49437 | Ricardo                     | 2026-07-07 | Corregidos bugs de recetas, ajuste de sotck y permisos (unique/decimal/rutas). De igual manera se encuentra un markdown guía sobre como ejecutar todo el proyecto. |
| 9d38387 | Ricardo                     | 2026-07-07 | regenerar lockfile web coherente con package.json |
| 0abbc4e | Ricardo                     | 2026-07-07 | sacar cafeteria.db de git y limpiar scaffolding |
| 56006c5 | Ricardo                     | 2026-07-07 | integrar web react y reconciliar api canonico |
| 0af154d | 123046770@upq.edu.mx        | 2026-07-07 | integrar app movil coffeecode (cocina/caja/mesero + login) |
| 8a9a724 | 123046770@upq.edu.mx        | 2026-07-07 | integrar api operacional (cocina/caja/mesero) de la rama movil |
| f8a6b39 | 123046770@upq.edu.mx        | 2026-07-07 | ignorar docs de diagnóstico de integración |
| 97f860a | Angelsan22                  | 2026-07-05 | ajuste de tamaños de la vista del dashboard |
| daf94f9 | Angelsan22                  | 2026-07-04 | cambio de nombre |
| cdf1e13 | Angelsan22                  | 2026-07-04 | reinicio de bd |

### `git status` — archivos sin commitear o sin trackear

Salida literal: `nothing to commit, working tree clean`. No hay archivos sin
trackear ni cambios pendientes.

**Sobre `COMO_EJECUTAR.md`:** el archivo existe en `docs/COMO_EJECUTAR.md` (NO en
la raíz del repo). Está **trackeado y commiteado** — apareció por primera vez en
el commit `1a49437` (`git log --follow --oneline -- docs/COMO_EJECUTAR.md` solo
devuelve ese hash). No está "pendiente"; es el estado actual de `main`.

### `git branch -a` — ramas locales y remotas

```
  integracion-2p
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/coffeeCode-mobile
  remotes/origin/main
  remotes/origin/mobile-combinado
  remotes/origin/movil
  remotes/origin/web
```

Comparación de cada rama contra `main` con `git log main..<rama> --oneline`:

| Rama | Commits que tiene y `main` no | Detalle |
|---|---|---|
| `integracion-2p` (local) | 0 | Apunta al mismo commit que `main` (`1a494372...`). |
| `origin/coffeeCode-mobile` | 3 | `b0c24d0` "a", `d0968a5` "Reinicio de bd", `5219bfe` "creacion de interfaces de coffee Code" |
| `origin/mobile-combinado` | 2 | `4f18f68` "bd", `500516d` "WIP: cambios de mobile (reestructura React Native) y nuevos endpoints/schemas de API" |
| `origin/movil` | 1 | `500516d` "WIP: cambios de mobile (reestructura React Native) y nuevos endpoints/schemas de API" (subconjunto de `mobile-combinado`) |
| `origin/web` | 0 | Todos sus commits ya están contenidos en `main` (su punta `97f860a` es ancestro de `main`, visible en la tabla de commits arriba). |

---

## 2. Autenticación y control de acceso del web

### Endpoint de login en el API

- Archivo: [api/app/routers/auth.py:15-34](api/app/routers/auth.py#L15-L34)
- Ruta: `POST /auth/login`
- Recibe `OAuth2PasswordRequestForm` (form-urlencoded, campos `username`/`password`); `username` se compara contra `Usuario.correo` ([api/app/routers/auth.py:20-22](api/app/routers/auth.py#L20-L22)).
- Valida contraseña con `verify_password` ([api/app/routers/auth.py:24](api/app/routers/auth.py#L24)) y que `user.activo` sea verdadero ([api/app/routers/auth.py:31-32](api/app/routers/auth.py#L31-L32)). **No valida el rol del usuario** en ningún punto de este endpoint.
- Devuelve `Token(access_token=create_access_token(user.id))` ([api/app/routers/auth.py:34](api/app/routers/auth.py#L34)), tipado como `Token` en [api/app/schemas/auth.py:4-6](api/app/schemas/auth.py#L4-L6): solo `access_token` y `token_type` (`"bearer"`).
- **Payload real del JWT** (ver [api/app/core/security.py:19-26](api/app/core/security.py#L19-L26)): `{"sub": str(user.id), "iat": ..., "exp": ...}`. **El token NO incluye el rol** ni ningún otro dato del usuario — solo el `id` como `sub`.
- El rol se obtiene aparte, consultando `GET /auth/me` ([api/app/routers/auth.py:37-39](api/app/routers/auth.py#L37-L39)), que devuelve `UsuarioOut` con `rol: RolOut` anidado ([api/app/schemas/auth.py:17-25](api/app/schemas/auth.py#L17-L25)). Ese dato sale de una consulta a la BD (`joinedload(Usuario.rol)` en [api/app/core/deps.py:34](api/app/core/deps.py#L34)), no del contenido del token.

### En `/web`: dónde se hace login, dónde se guarda el token, si se decodifica

- **Login:** [web/src/components/Login.jsx](web/src/components/Login.jsx) — formulario que llama a `login(correo, password)` del contexto ([web/src/components/Login.jsx:18](web/src/components/Login.jsx#L18)).
- **Llamada HTTP real:** [web/src/api.js:47-62](web/src/api.js#L47-L62) — `POST http://localhost:8000/auth/login`, body `application/x-www-form-urlencoded` con `username`/`password`.
- **Guardado del token:** `localStorage.setItem('token', data.access_token)` en [web/src/AuthContext.jsx:42](web/src/AuthContext.jsx#L42). También se limpia en `logout()` ([web/src/AuthContext.jsx:55](web/src/AuthContext.jsx#L55)) y automáticamente si una respuesta da 401 ([web/src/api.js:33-35](web/src/api.js#L33-L35)).
- **¿Se decodifica el token en el cliente?** NO EXISTE. El web nunca hace `jwt.decode` ni parsea el JWT; no hay ninguna librería de JWT en `web/package.json`. Lo único que hace tras el login es llamar a `GET /auth/me` ([web/src/AuthContext.jsx:43](web/src/AuthContext.jsx#L43), implementado en [web/src/api.js:64-69](web/src/api.js#L64-L69)) para obtener el usuario (incluido su rol) desde el API.
- **Guard de rutas:** NO EXISTE ningún guard de rutas en el sentido de router (ver siguiente punto: el web no usa `react-router` ni ninguna librería de enrutamiento — `web/package.json` no la lista). La única puerta es a nivel de componente: en [web/src/App.jsx:37](web/src/App.jsx#L37), `if (!user) return <Login />;` — es decir, sin sesión válida se muestra el login; con sesión válida (sin importar el rol) se renderiza el panel completo.

### ¿Existe validación que impida a mesero/caja/cocina entrar al portal web?

**NO EXISTE.** Verificación punto por punto:

1. `POST /auth/login` ([api/app/routers/auth.py:15-34](api/app/routers/auth.py#L15-L34)) solo valida correo/contraseña y `activo`; no filtra por rol.
2. `AuthContext.login()` ([web/src/AuthContext.jsx:37-52](web/src/AuthContext.jsx#L37-L52)) no consulta ni compara el rol del usuario devuelto contra ninguna lista de roles permitidos antes de fijar `setUser(userData)`.
3. `Shell` en [web/src/App.jsx:24-53](web/src/App.jsx#L24-L53) renderiza el panel para cualquier `user` no nulo, sin comprobar `user.rol.nombre`.
4. Existe un objeto `VISTAS` en [web/src/App.jsx:14-22](web/src/App.jsx#L14-L22) que declara arrays `roles: [...]` por pestaña (p. ej. `usuarios: { ..., roles: ['admin'] }`), y existe una función `checkRole(allowedRoles)` en [web/src/AuthContext.jsx:60-63](web/src/AuthContext.jsx#L60-L63) — **pero ninguna de las dos se usa** para bloquear el acceso: `Shell` (línea 40-41 de App.jsx) solo usa `vista?.component`, nunca `vista.roles`, y `checkRole` no se invoca en ningún archivo del proyecto (`grep -r "checkRole("` solo la encuentra en su propia definición).
5. Además, los nombres de rol en `VISTAS` (`'admin'`, `'cajero'`, `'cocinero'`) **no coinciden** con los nombres de rol reales que crea el seed del API (`administrador`, `caja`, `cocina`, `mesero` — ver [api/app/core/roles.py:1-4](api/app/core/roles.py#L1-L4)), por lo que aunque `checkRole`/`VISTAS.roles` se usaran, la comparación de strings fallaría para todos los roles no-admin.
6. `Sidebar` en [web/src/components/Sidebar.jsx:21-22](web/src/components/Sidebar.jsx#L21-L22) muestra el comentario `// Todos los items siempre visibles (panel solo para admin)` y efectivamente asigna `const items = NAV;` sin filtrar por rol — todas las pestañas se muestran a cualquier usuario autenticado.

En síntesis: cualquier usuario activo (mesero, caja o cocina incluido) que tenga
credenciales válidas puede iniciar sesión en el portal web y ver la interfaz
completa del panel. Lo que sí falla para esos roles son las llamadas al API que
exigen `require_roles(roles.ADMIN)` (sección siguiente): esas devuelven 403,
pero el filtrado ocurre en el API, no en el web.

### Rutas del "router" del web

**NO EXISTE un router de URLs** (no hay `react-router-dom` ni similar en
`web/package.json`; no se leyó ninguna importación de enrutamiento en
`web/src/`). La navegación es un `switch` de estado en memoria:
`activeTab` (`useState('dashboard')`) definido en
[web/src/App.jsx:26](web/src/App.jsx#L26) y mapeado contra el objeto `VISTAS`
([web/src/App.jsx:14-22](web/src/App.jsx#L14-L22)):

| Tab (`activeTab`) | Componente | `roles` declarados en `VISTAS` | ¿Enforcement real? |
|---|---|---|---|
| `dashboard` | `Dashboard` | `['admin','cajero','mesero','cocinero']` | No (campo no leído) |
| `usuarios` | `Usuarios` | `['admin']` | No |
| `roles` | `Roles` | `['admin']` | No |
| `suministros` | `Suministros` | `['admin','cajero','cocinero']` | No |
| `menu` | `Menu` | `['admin','cajero']` | No |
| `recetas` | `Recetas` | `['admin']` | No |
| `reportes` | `Reportes` | `['admin','cajero']` | No |

Todas las pestañas están, en la práctica, **sin proteger** en el frontend
(equivalen a "no protegida" porque el campo `roles` nunca se evalúa — ver
punto anterior). La única protección real ocurre más abajo, en el API, para
las llamadas que sí llevan `require_roles`.

### En el API: endpoints usados por el web — guard de admin vs. abiertos a cualquier autenticado

Guard `require_roles(roles.ADMIN)` == solo administrador. `get_current_user`
(sin `require_roles`) == cualquier usuario autenticado y activo, sin importar
el rol.

| Método y ruta | Archivo:línea | Guard |
|---|---|---|
| `POST /auth/login` | [auth.py:15](api/app/routers/auth.py#L15) | Público (sin token) |
| `GET /auth/me` | [auth.py:37-38](api/app/routers/auth.py#L37-L38) | Cualquier autenticado |
| `GET /usuarios` | [usuarios.py:31-38](api/app/routers/usuarios.py#L31-L38) | **Solo ADMIN** |
| `GET /usuarios/{id}` | [usuarios.py:48-52](api/app/routers/usuarios.py#L48-L52) | **Solo ADMIN** |
| `POST /usuarios` | [usuarios.py:60-64](api/app/routers/usuarios.py#L60-L64) | **Solo ADMIN** |
| `PATCH /usuarios/{id}` | [usuarios.py:85-90](api/app/routers/usuarios.py#L85-L90) | **Solo ADMIN** |
| `PATCH /usuarios/{id}/estado` | [usuarios.py:123-128](api/app/routers/usuarios.py#L123-L128) | **Solo ADMIN** |
| `PATCH /usuarios/{id}/password` | [usuarios.py:149-154](api/app/routers/usuarios.py#L149-L154) | **Solo ADMIN** |
| `GET /roles` | [roles.py:14-17](api/app/routers/roles.py#L14-L17) | **Solo ADMIN** |
| `POST /roles` | [roles.py:22-26](api/app/routers/roles.py#L22-L26) | **Solo ADMIN** |
| `PATCH /roles/{id}` | [roles.py:41-46](api/app/routers/roles.py#L41-L46) | **Solo ADMIN** |
| `DELETE /roles/{id}` | [roles.py:60-64](api/app/routers/roles.py#L60-L64) | **Solo ADMIN** |
| `GET /productos` | [productos.py:15-20](api/app/routers/productos.py#L15-L20) | Cualquier autenticado |
| `GET /productos/{id}` | [productos.py:37-41](api/app/routers/productos.py#L37-L41) | Cualquier autenticado |
| `POST /productos` | [productos.py:57-61](api/app/routers/productos.py#L57-L61) | **Solo ADMIN** |
| `PATCH /productos/{id}` | [productos.py:105-110](api/app/routers/productos.py#L105-L110) | **Solo ADMIN** |
| `DELETE /productos/{id}` | [productos.py:169-173](api/app/routers/productos.py#L169-L173) | **Solo ADMIN** |
| `GET /productos/{id}/receta` | [productos.py:199-203](api/app/routers/productos.py#L199-L203) | Cualquier autenticado |
| `POST /productos/{id}/receta` | [productos.py:212-217](api/app/routers/productos.py#L212-L217) | **Solo ADMIN** |
| `DELETE /productos/recetas/{id}` | [productos.py:240-244](api/app/routers/productos.py#L240-L244) | **Solo ADMIN** |
| `GET /suministros` | [suministros.py:23-27](api/app/routers/suministros.py#L23-L27) | Cualquier autenticado |
| `GET /suministros/movimientos` | [suministros.py:34-39](api/app/routers/suministros.py#L34-L39) | Cualquier autenticado |
| `GET /suministros/{id}` | [suministros.py:55-59](api/app/routers/suministros.py#L55-L59) | Cualquier autenticado |
| `POST /suministros` | [suministros.py:66-70](api/app/routers/suministros.py#L66-L70) | **Solo ADMIN** |
| `PATCH /suministros/{id}` | [suministros.py:100-105](api/app/routers/suministros.py#L100-L105) | **Solo ADMIN** |
| `POST /suministros/{id}/ajuste` | [suministros.py:130-135](api/app/routers/suministros.py#L130-L135) | ADMIN o CAJA (`require_roles(roles.ADMIN, roles.CAJA)`) |
| `GET /compras` | [compras.py:19-22](api/app/routers/compras.py#L19-L22) | Cualquier autenticado |
| `GET /compras/{id}` | [compras.py:39-43](api/app/routers/compras.py#L39-L43) | Cualquier autenticado |
| `POST /compras` | [compras.py:63-67](api/app/routers/compras.py#L63-L67) | **Solo ADMIN** |
| `GET /mesas` | [operaciones.py:32-35](api/app/routers/operaciones.py#L32-L35) | Cualquier autenticado |
| `POST /mesas` | [operaciones.py:39-44](api/app/routers/operaciones.py#L39-L44) | **Solo ADMIN** |
| `GET /cuentas` | [operaciones.py:56-60](api/app/routers/operaciones.py#L56-L60) | Cualquier autenticado |
| `GET /cuentas/{id}` | [operaciones.py:82-86](api/app/routers/operaciones.py#L82-L86) | Cualquier autenticado |
| `GET /cuentas/{id}/ticket` | [operaciones.py:322-326](api/app/routers/operaciones.py#L322-L326) | Cualquier autenticado |
| `GET /estadisticas` | [estadisticas.py:17-21](api/app/routers/estadisticas.py#L17-L21) | Cualquier autenticado (**no exige ADMIN**) |
| `GET /reportes/ventas/hoy` | [reportes.py:89-93](api/app/routers/reportes.py#L89-L93) | **Solo ADMIN** |
| `GET /reportes/resumen` | [reportes.py:103-111](api/app/routers/reportes.py#L103-L111) | **Solo ADMIN** |
| `GET /reportes/export/pdf` | [reportes.py:193-202](api/app/routers/reportes.py#L193-L202) | **Solo ADMIN** |
| `GET /reportes/export/xlsx` | [reportes.py:244-253](api/app/routers/reportes.py#L244-L253) | **Solo ADMIN** |

Nota: no se listan aquí los endpoints usados exclusivamente por el móvil
(`/items`, `PATCH /cuentas/{id}/cerrar`, `POST /cuentas/{id}/pagar`,
`POST /cuentas`, `POST /cuentas/{id}/detalles`, `PATCH /cuentas/detalles/{id}`)
por no ser parte del alcance "web" de este diagnóstico, aunque técnicamente el
web podría llamarlos (`web/src/api.js` sí define funciones para varios de
ellos: `crearCuenta`, `agregarDetallesCuenta`, `cerrarCuenta`, `pagarCuenta`,
`getTicket`).

---

## 3. Módulo de reportes

### Endpoints de reportes en el API

Archivo: [api/app/routers/reportes.py](api/app/routers/reportes.py)

1. **`GET /reportes/ventas/hoy`** — [reportes.py:89-93](api/app/routers/reportes.py#L89-L93)
   ```python
   def ventas_de_hoy(db: Session = Depends(get_db), _: object = Depends(require_roles(roles.ADMIN))) -> VentasHoy
   ```
   No acepta query params. Guard: solo ADMIN.

2. **`GET /reportes/resumen`** — [reportes.py:103-111](api/app/routers/reportes.py#L103-L111)
   ```python
   def resumen(desde: date | None = None, hasta: date | None = None, tipo_cuenta: str | None = None,
               categoria: str | None = None, db: Session = Depends(get_db),
               _: object = Depends(require_roles(roles.ADMIN))) -> ResumenReporte
   ```
   Query params reales: `desde`, `hasta` (fechas), `tipo_cuenta` (string libre, comparado contra `Cuenta.tipo`, con valor especial `"ambos"` que desactiva el filtro — [reportes.py:45](api/app/routers/reportes.py#L45)), `categoria` (string, comparado contra `Producto.categoria`).

3. **`GET /reportes/export/pdf`** — [reportes.py:193-202](api/app/routers/reportes.py#L193-L202)
   ```python
   def exportar_pdf(tipo: str = Query(..., description="ventas | productos | inventario"),
                     desde: date | None = None, hasta: date | None = None,
                     tipo_cuenta: str | None = None, categoria: str | None = None,
                     db: Session = Depends(get_db), _: object = Depends(require_roles(roles.ADMIN))) -> StreamingResponse
   ```
   `tipo` es **obligatorio** (`Query(...)`), validado contra `_TIPOS_VALIDOS = {"ventas", "productos", "inventario"}` ([reportes.py:24](api/app/routers/reportes.py#L24)). Mismos filtros `desde/hasta/tipo_cuenta/categoria` que `/resumen`.

4. **`GET /reportes/export/xlsx`** — [reportes.py:244-253](api/app/routers/reportes.py#L244-L253)
   Firma idéntica a `exportar_pdf`, mismos parámetros y validación de `tipo`.

### Filtros reales soportados (literal, por endpoint)

- `/reportes/ventas/hoy`: ninguno (calcula "hoy" con `datetime.now(timezone.utc).date()`, [reportes.py:94](api/app/routers/reportes.py#L94)).
- `/reportes/resumen`, `/reportes/export/pdf`, `/reportes/export/xlsx`: `desde` (fecha), `hasta` (fecha), `tipo_cuenta` (string; valores usados en el dominio serían `"mesa"`/`"para_llevar"`/`"ambos"`, pero el endpoint no valida contra un enum — acepta cualquier string), `categoria` (string libre, sin validación contra catálogo), y además `tipo` (obligatorio solo en los export, valores válidos `ventas`/`productos`/`inventario`).
- No existen filtros por producto específico, usuario, ni estado de cuenta/ítem en ninguno de estos cuatro endpoints.

### Dónde se genera el PDF y el XLSX

**En el API**, no en el cliente-para-estos-endpoints:

- PDF: [reportes.py:206-241](api/app/routers/reportes.py#L206-L241), librería `reportlab` (`reportlab.platypus.SimpleDocTemplate`, `Table`, import local dentro de la función en [reportes.py:206-209](api/app/routers/reportes.py#L206-L209)). Dependencia declarada en [api/requirements.txt:11](api/requirements.txt#L11).
- XLSX: [reportes.py:257-276](api/app/routers/reportes.py#L257-L276), librería `openpyxl` (`openpyxl.Workbook`), import local en [reportes.py:257](api/app/routers/reportes.py#L257). Dependencia declarada en [api/requirements.txt:12](api/requirements.txt#L12).

**Pero el web no usa estos endpoints.** El botón "Descargar PDF/XLSX" de
[web/src/components/Reportes.jsx:246-254](api/../web/src/components/Reportes.jsx#L246-L254)
invoca funciones locales `exportPDF`/`exportXLSX` definidas en el mismo archivo
([web/src/components/Reportes.jsx:6-102](web/src/components/Reportes.jsx#L6-L102))
que generan el archivo **enteramente en el navegador**, con:
- `jspdf` + `jspdf-autotable` (import dinámico `await import('jspdf')` / `await import('jspdf-autotable')`, [web/src/components/Reportes.jsx:7-8](web/src/components/Reportes.jsx#L7-L8)), declaradas en [web/package.json](web/package.json) (`"jspdf": "^4.2.1"`, `"jspdf-autotable": "^5.0.8"`).
- `xlsx` (SheetJS) (`await import('xlsx')`, [web/src/components/Reportes.jsx:65](web/src/components/Reportes.jsx#L65)), declarada en [web/package.json](web/package.json) (`"xlsx": "^0.18.5"`).

Los datos que arma ese PDF/XLSX del lado cliente vienen de `api.getEstadisticas`,
`api.getProductos`, `api.getPedidos('pagada')` y `api.getSuministros()`
([web/src/components/Reportes.jsx:203-208](web/src/components/Reportes.jsx#L203-L208)) — es decir, del endpoint `GET /estadisticas` y de listados crudos, **no** de `GET /reportes/resumen` ni de `_filas_export` del API.

### Pantallas de reportes en `/web` y si los controles viajan al API

Único componente: [web/src/components/Reportes.jsx](web/src/components/Reportes.jsx).

Controles de UI presentes:
- Un `<select>` de "Período (Gráficos)" con opciones fijas 7/15/30/90/180 días ([web/src/components/Reportes.jsx:238-244](web/src/components/Reportes.jsx#L238-L244)), ligado a un estado `dias`. **Sí viaja al API**: dispara `useEffect(() => { load(); }, [dias])` ([web/src/components/Reportes.jsx:220](web/src/components/Reportes.jsx#L220)) que llama `api.getEstadisticas(dias)` → `GET /estadisticas?dias=...` ([web/src/api.js:393-398](web/src/api.js#L393-L398)).
- Dos botones "Descargar PDF" / "Descargar XLSX" ([web/src/components/Reportes.jsx:247-254](web/src/components/Reportes.jsx#L247-L254)). **No viajan al API de reportes**: generan el archivo en el cliente (ver punto anterior); no hay llamada de red a `/reportes/export/pdf` ni `/reportes/export/xlsx` en todo `web/src/api.js`.
- **No hay** date picker de rango (`desde`/`hasta`), ni selector de producto, ni de categoría, ni de tipo de cuenta, ni de estado — pese a que el API sí acepta `desde`, `hasta`, `tipo_cuenta` y `categoria` en `/reportes/resumen` y en los export. Esos parámetros del API **no tienen ningún control correspondiente en la UI** y de hecho el web nunca llama a esos endpoints.

### ¿Existen los tres tipos de reporte (productos, pedidos, inventarios)?

A nivel de **API** (`_TIPOS_VALIDOS` en [reportes.py:24](api/app/routers/reportes.py#L24) y `_filas_export` en [reportes.py:137-190](api/app/routers/reportes.py#L137-L190)) existen tres tipos: `"ventas"`, `"productos"`, `"inventario"`. No hay un tipo llamado literalmente `"pedidos"`; el más cercano a "pedidos" es `"ventas"` (exporta `Ticket`+`Cuenta`).

A nivel de **web**, ninguno de los tres se pide vía esos endpoints (ver arriba): la pantalla de Reportes arma su propio PDF/XLSX combinando "Resumen Financiero" (de `/estadisticas`), "Inventario" (de `/suministros`) y "Pedidos" (de `GET /cuentas?estado=pagada`, función `getPedidos` en [web/src/api.js:383-390](web/src/api.js#L383-L390)) — un cuarto conjunto de datos distinto al de `_filas_export`, generado con librerías del cliente en vez de los tres tipos que sí implementa el API.

---

## 4. Estadísticas / dashboard

### Endpoints de agregados en el API

Único endpoint: **`GET /estadisticas`** — [api/app/routers/estadisticas.py:17-21](api/app/routers/estadisticas.py#L17-L21)
```python
def obtener_estadisticas(dias: int = 30, db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> Dict[str, Any]
```
- Único query param: `dias` (int, default 30). No hay parámetros de fecha explícita (`desde`/`hasta`), producto, ni categoría.
- Guard: `get_current_user` — **cualquier usuario autenticado**, no exige rol admin (contrasta con `/reportes/*`, que sí exigen ADMIN).
- Calcula en Python (no en SQL agregado): gastos (`Compra`, [estadisticas.py:26-28](api/app/routers/estadisticas.py#L26-L28)), ganancias (`Pago`, [estadisticas.py:31-33](api/app/routers/estadisticas.py#L31-L33)), cuentas del rango ([estadisticas.py:36-38](api/app/routers/estadisticas.py#L36-L38)) y detalles de cuentas pagadas para armar el ranking de productos más vendidos ([estadisticas.py:41-46](api/app/routers/estadisticas.py#L41-L46), agrupado y ordenado en [estadisticas.py:78-89](api/app/routers/estadisticas.py#L78-L89)). No hay endpoint separado de "productos menos vendidos" en `/estadisticas` (sí existe `productos_menos_vendidos` en `GET /reportes/resumen`, ver sección 3).

### Librería de gráficas en el web

**NO EXISTE** una librería de gráficas de terceros. `web/package.json` no
declara `recharts`, `chart.js`, `victory`, `nivo`, ni similar. Las gráficas
son **SVG hechos a mano**:
- `LineChart` (gráfico de línea con relleno) — [web/src/components/Reportes.jsx:105-145](web/src/components/Reportes.jsx#L105-L145), usado para "Ventas Totales — Últimos N días".
- `BarChart` (barras agrupadas por mes, ganancia vs. gasto) — [web/src/components/Reportes.jsx:148-189](web/src/components/Reportes.jsx#L148-L189).

El Dashboard ([web/src/components/Dashboard.jsx](web/src/components/Dashboard.jsx)) no usa ninguna de las dos: solo muestra tarjetas numéricas (stat cards) y tablas (`Pedidos en Cola`, `Alertas de Inventario`), sin gráficos.

---

## 5. Usuarios y credenciales

### CRUD de usuarios en el web

Componente: [web/src/components/Usuarios.jsx](web/src/components/Usuarios.jsx).

| Operación | ¿Existe en la UI? | Detalle |
|---|---|---|
| Crear | Sí | Modal "Agregar Usuario" → `api.crearUsuario` ([web/src/components/Usuarios.jsx:51-52](web/src/components/Usuarios.jsx#L51-L52)) → `POST /usuarios`. |
| Leer / listar | Sí | `api.getUsuarios()` en `load()` ([web/src/components/Usuarios.jsx:20](web/src/components/Usuarios.jsx#L20)) → `GET /usuarios`. |
| Actualizar | Sí | Modal "Editar Usuario" → `api.actualizarUsuario` ([web/src/components/Usuarios.jsx:56](web/src/components/Usuarios.jsx#L56)) → `PATCH /usuarios/{id}`. |
| Eliminar | Parcial / no real | El botón de papelera llama `eliminar(id)` ([web/src/components/Usuarios.jsx:67-70](web/src/components/Usuarios.jsx#L67-L70)), que hace `api.actualizarUsuario(id, { activo: false })` — es decir, **desactiva** al usuario, no lo borra. La función `api.cambiarEstadoUsuario` ([web/src/api.js:158-165](web/src/api.js#L158-L165)) que llama a `PATCH /usuarios/{id}/estado` está definida pero **no se usa** en `Usuarios.jsx` (se usa `actualizarUsuario` directamente en su lugar). En el API, `DELETE /usuarios/{id}` **NO EXISTE** (no hay ninguna ruta `DELETE` en [api/app/routers/usuarios.py](api/app/routers/usuarios.py); esto también lo documenta [docs/COMO_EJECUTAR.md:276-278](docs/COMO_EJECUTAR.md#L276-L278)). |

Adicionalmente existe `resetearPasswordUsuario` en [web/src/api.js:167-174](web/src/api.js#L167-L174) (→ `PATCH /usuarios/{id}/password`), pero no se encontró ningún botón o formulario en `Usuarios.jsx` que la invoque — la función está definida en el cliente API pero no conectada a ninguna UI visible en este componente.

### Scripts de seed / migración que crean usuarios de prueba

1. **`api/app/seed.py`** (el "oficial", referenciado en `docker compose run --rm api python -m app.seed`):
   - [api/app/seed.py:18-24](api/app/seed.py#L18-L24) crea los 4 roles (`roles.TODOS` = `mesero, caja, cocina, administrador`, ver [api/app/core/roles.py:1-6](api/app/core/roles.py#L1-L6)).
   - [api/app/seed.py:34-47](api/app/seed.py#L34-L47) crea **un solo usuario**, con rol `administrador`, tomando correo y contraseña de las variables de entorno `ADMIN_EMAIL` / `ADMIN_PASSWORD` ([api/app/core/config.py:11-12](api/app/core/config.py#L11-L12)). **No hay contraseña en texto plano en este archivo** — viene de `.env` (no versionado; `.env.example` la deja vacía, ver [.env.example](.env.example)).

2. **`api/init_db.py`** (script "legacy", opcional según `docs/COMO_EJECUTAR.md`, no se ejecuta por defecto):
   - Crea 4 usuarios con **contraseña en texto plano hardcodeada** en el propio archivo, [api/init_db.py:45-48](api/init_db.py#L45-L48):
     - `admin@cafeteria.com` / `admin1234` — rol `administrador`
     - `mesero@cafeteria.com` / `mesero1234` — rol `mesero`
     - `cajero@cafeteria.com` / `caja1234` — rol `caja`
     - `cocina@cafeteria.com` / `cocina1234` — rol `cocina`
   - Usa `create_all` en vez de Alembic (bypassa migraciones), según el propio docstring del flujo documentado en [docs/COMO_EJECUTAR.md:110-114](docs/COMO_EJECUTAR.md#L110-L114).

3. **`api/reset_clean.py`** (destructivo, hace `drop_all` + `create_all`):
   - Crea **un solo usuario admin** con contraseña en texto plano hardcodeada, [api/reset_clean.py:35-41](api/reset_clean.py#L35-L41): `admin@cafeteria.com` / `admin1234`, rol `administrador`.

4. **`api/alembic/versions/`**: no se encontró ninguna migración de Alembic que inserte usuarios o datos semilla (las migraciones de Alembic en este repo son de esquema, no de datos — no se listan aquí por no ser scripts de seed).

---

## 6. Cómo se levanta hoy

El archivo [docs/COMO_EJECUTAR.md](docs/COMO_EJECUTAR.md) (301 líneas, último
commit `1a49437`) documenta el flujo completo: prerequisitos, `docker compose up
-d --build` para API+PostgreSQL, `alembic upgrade head` + `python -m app.seed`
para migrar y sembrar, `npm install && npm run dev` para el web (Vite en
`localhost:5173`), y `npx expo start` para el móvil. Incluye también una
sección de scripts destructivos (`reset_clean.py`, `down -v`) y un apéndice
con el listado de los 48 endpoints del API agrupados por bloque.

Contraste contra el código actual, punto por punto:

| Afirmación de `COMO_EJECUTAR.md` | Verificación contra el código |
|---|---|
| `docker-compose.yml` define servicios `db` (postgres:16) y `api` (build `./api`) | Coincide con [docker-compose.yml:1-33](docker-compose.yml#L1-L33). |
| Variables de `.env`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `APP_ENV`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Coincide exactamente con [.env.example](.env.example) y con los campos leídos por `Settings` en [api/app/core/config.py:5-12](api/app/core/config.py#L5-L12). |
| API expone `GET /health` | Existe en [api/app/routers/health.py:10-11](api/app/routers/health.py#L10-L11), registrado en [api/app/main.py:29](api/app/main.py#L29). |
| Seed oficial (`python -m app.seed`) crea 4 roles + 1 admin desde `.env`, idempotente, no crea usuarios de ejemplo | Coincide con [api/app/seed.py:18-49](api/app/seed.py#L18-L49) (verifica existencia antes de insertar tanto para roles como para el admin). |
| `init_db.py` es opcional, crea usuarios de ejemplo con credenciales hardcodeadas de dominio `@cafeteria.com`, usa `create_all` | Coincide con [api/init_db.py:45-48](api/init_db.py#L45-L48) (credenciales) — no se inspeccionó línea exacta del `create_all` en este diagnóstico, pero el archivo existe en `api/init_db.py` como se documenta. |
| `reset_clean.py` es destructivo (`drop_all`) y deja un solo admin hardcodeado `admin@cafeteria.com`/`admin1234` | Coincide con [api/reset_clean.py:16-20](api/reset_clean.py#L16-L20) (`drop_all` + `create_all`) y [api/reset_clean.py:35-41](api/reset_clean.py#L35-L41) (admin hardcodeado). |
| Web apunta a `API_BASE_URL = 'http://localhost:8000'` fijo en `web/src/api.js`, línea 1, sin variables `VITE_` | Coincide con [web/src/api.js:1](web/src/api.js#L1). No se encontró ningún archivo `.env` ni referencia a `import.meta.env.VITE_*` en `web/src/`. |
| No existe `DELETE /usuarios`; el panel solo puede desactivar usuarios | Coincide (ver sección 5 de este documento). |
| Apéndice lista `GET /reportes/resumen` · `GET /reportes/ventas/hoy` · `GET /reportes/export/pdf` · `GET /reportes/export/xlsx` como endpoints de reportes | Coincide con las cuatro rutas verificadas en la sección 3 de este documento. |
| CORS abierto (`allow_origins=["*"]`) | Coincide con [api/app/main.py:21-27](api/app/main.py#L21-L27). |

No se encontraron discrepancias entre lo documentado en `COMO_EJECUTAR.md` y el
comportamiento actual del código para los puntos anteriores.

### Discrepancia observada frente a `CLAUDE.md`

`CLAUDE.md` (raíz del repo) describe `web/` como "Flask + Python". El código
real en `web/` es una SPA de **React 19 + Vite 8** (ver
[web/package.json](web/package.json): dependencias `react`, `react-dom`,
`vite`, `@vitejs/plugin-react`; no hay `Flask` ni ningún archivo `.py` dentro
de `web/`). Se anota como hecho observado, sin proponer corrección.

---

## Resumen de hallazgos "NO EXISTE" (para referencia rápida)

- Validación de rol en el login o en el shell del web que bloquee mesero/caja/cocina.
- Librería de enrutamiento (`react-router` o equivalente) en el web.
- Decodificación de JWT en el cliente web.
- Rol incluido dentro del payload del JWT.
- Endpoint `DELETE /usuarios/{id}` en el API.
- UI conectada a `resetearPasswordUsuario` dentro de `Usuarios.jsx`.
- Llamadas del web a `GET /reportes/resumen`, `/reportes/ventas/hoy`, `/reportes/export/pdf`, `/reportes/export/xlsx`.
- Date picker de rango (`desde`/`hasta`) o selects de producto/categoría/tipo de cuenta en la pantalla de Reportes del web.
- Librería de gráficas de terceros en el web (los gráficos son SVG manuales).
- Migraciones de Alembic que siembren usuarios o datos (solo de esquema).
- Contraseña en texto plano en `api/app/seed.py` (viene de variable de entorno).
