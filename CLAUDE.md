# admin-skipfee — Panel de operación

> Contexto del ecosistema: ver [`../CLAUDE.md`](../CLAUDE.md). Este doc es el detalle del panel admin.

## Propósito

Panel tras login donde el restaurante **opera**: kanban de pedidos en vivo, atención de WhatsApp (bot + manual), despachos/rutas, catálogo, clientes, reportes y configuración. Consume la REST API de `backend-skipfee`; no toca Supabase directamente. `version` 0.1.0.

## Stack

- **Next.js 16.2.6** (App Router) + React 19 + TypeScript strict.
- **`@tanstack/react-query` 5** — data fetching, caché y polling.
- **`@dnd-kit/core`** — drag-and-drop del kanban.
- **`@vis.gl/react-google-maps`** — mapas (rutas, dibujo de zonas) · `emoji-picker-react` (composer WA).
- CSS propio (`brand.css` espejo del design system + `admin.css` + CSS Modules). **Dark mode** por `data-theme` + localStorage.
- Dev en `localhost:3001`. Deploy: `output: "export"` → `out/` → Cloudflare (`wrangler.jsonc`, worker `skipfee-admin`, `not_found_handling: single-page-application`).

## Estructura

```
app/
  (auth)/login/         # login email+password
  (admin)/              # layout con gate de auth (useMe) + AdminShell
    pedidos/ whatsapp/ despachos/ catalogo/ dashboard/ clientes/ reportes/ configuracion/
  preview/              # mismas pantallas en modo mock, SIN auth (QA/desarrollo)
  providers.tsx         # QueryClientProvider + APIProvider (Maps) + ToastHost
components/
  layout/AdminShell.tsx # rail + topbar + nav + tema + logout
  ui/                   # DataTable, Modal, Charts, RouteMap, Tabs, Field, Feedback…
  features/<modulo>/    # pantallas complejas por módulo
lib/
  api/                  # capa transporte (fetch puro): client.ts (token Bearer, ApiError) + un archivo por recurso
  queries/              # hooks React Query que envuelven lib/api (keys.ts = factory de query keys)
  data.ts               # tipos (Order, Product, Zone, Chat…) + datos mock para /preview
  roles.ts nav.ts hooks.ts icons.tsx toast.ts queryClient.ts
  geo/{googlePlaces,nominatim}.ts
```

- **Todas las pantallas son Client Components** (`'use client'`): es una SPA tras login, sin SSR dinámico (export estático).
- Separación clara **transporte (`lib/api`) ↔ estado servidor (`lib/queries`) ↔ UI (`components`)**. Respétala al añadir features.

## Datos: REST + React Query

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (prod `https://backend.skipfee.co`). Token en `localStorage` (`bs_access_token`) → header `Authorization: Bearer` (o cookies same-origin).
- QueryClient (`lib/queryClient.ts`): `staleTime 30s`, `gcTime 5min`, `retry 1`, `refetchOnWindowFocus false`.
- **Polling por criticidad:** pedidos y chats `4s`, mensajes `2s`, productos `10s`, dashboard manual.
- Mutaciones con **actualización optimista + rollback** (p. ej. mover pedido de columna). Query keys jerárquicas para invalidación precisa.

## Auth y roles

- `useMe()` valida sesión y devuelve `{ user, memberships, activeCompanySlug }` (contrato multi-empresa de `GET /api/auth/me`); el layout `(admin)` redirige a `/login` si no hay sesión (401).
- Roles (`lib/roles.ts`): **`super_admin`** y **`admin`** (todo dentro de su empresa), **`cocina`** (solo Pedidos, estados cocina/empacado), **`empaque`** (solo Pedidos, estados empacado/ruta). El rol viene de `memberships[].role` para la empresa activa (`useActiveRole`) y filtra pantallas visibles y estados del kanban.

## Multi-empresa (transporte + contexto)

- **Empresa activa:** `lib/api/activeCompany.ts` es el store de transporte (sin React) del slug activo; se hidrata desde `/api/auth/me` y se persiste en `localStorage` (`bs_active_company`) para el owner multi-empresa. `lib/queries/company.ts` (`useActiveCompany`/`setActiveCompany`) lo observa con `useSyncExternalStore`.
- **Prefijo de ruta:** rutas de negocio → `tenantRequest`/`tenantMultipart` (en `lib/api/client.ts`) anteponen `/api/<activeCompanySlug>`. Rutas de plataforma/auth (`/api/auth/*`, `/api/platform/*`) siguen con `request`. Los `lib/api/<recurso>` de negocio usan paths relativos (`/orders`, `/products`, …).
- **Query keys:** las keys de negocio (`lib/queries/keys.ts`) incluyen `['company', slug, …]` para no mezclar caché entre empresas. Las queries de negocio se gatean con `enabled: !!useActiveCompany()`.
- **Deep-link a Configuración:** `?tab=zonas` abre esa pestaña directamente (lo usan los Primeros pasos). `ConfiguracionScreen` usa `useSearchParams`, así que su página va envuelta en `<Suspense>`.

## Funcionalidades por módulo

- **Pedidos:** kanban 6 columnas (`nuevo→pagado→cocina→empacado→ruta→entregado`) con drag-drop → `PATCH /api/orders/:id/status`. Filtros por zona/búsqueda, detalle slide-over, asignación de cocinero. Deep-link a WhatsApp por teléfono.
- **WhatsApp:** lista por estado (todos/bot/human/pending) + thread con historial, composer (texto+imagen+emoji), takeover/release (bot↔humano), aviso de reseñas pendientes.
- **Despachos:** Google Maps con rutas + cobertura de zonas + pedidos listos.
- **Catálogo:** grid por categoría, CRUD de productos, subida de imagen (multipart), toggle disponibilidad.
- **Dashboard:** KPIs del día, banner de promo activa, pedidos en atención, gráficos línea/donut.
- **Clientes:** tabla segmentada (VIP/Recurrente/Nuevo) con métricas.
- **Reportes:** períodos 7/30/90d — financiero, top productos, análisis por zona, heatmap horario, conversión.
- **Primeros pasos** (`/primeros-pasos`): el recorrido de puesta en marcha. El estado lo calcula el backend (nunca casillas manuales) y los cuatro pasos —negocio, carta, zona, WhatsApp— se resuelven en **modales que se encadenan**: la bienvenida abre el primero y cada uno abre el siguiente al terminar, con puntos de "vas por aquí" en el pie. Cerrar un modal termina el recorrido y devuelve a la lista. Desaparece del rail cuando no queda nada pendiente; en mobile ocupa un lugar fijo en la barra inferior.
  - **Mundo visual propio** (`cartoon.module.css` + `pagina.module.css`): trazo grueso, sombra sólida desplazada, color plano, movimiento con rebote (`--ease-rebote`) y **suelo claro en los dos temas**. Es una isla deliberada: mientras el negocio se monta el panel está bajo llave y esta es la única pantalla accesible; que se vea distinta dice "estás en la puesta en marcha".
  - **La carta se escribe a mano** (nombre + precio + categoría), no se sube por foto. `CartaUploader` y `/catalog/extract` (Gemini) siguen existiendo pero fuera del recorrido: pedir una foto en el primer minuto pone entre el dueño y su primer producto una foto que quizá no tiene, un permiso de cámara y una espera del modelo.
  - **Candado del panel:** con `puedeVender === false`, `AdminShell` bloquea el resto del rail y desvía por URL a Primeros pasos. Solo para `super_admin`/`admin` — cocina, empaque y el owner de plataforma pasan.
- **Recorrido por el panel** (`RecorridoPanel.tsx` + `EscenasRecorrido.tsx`): lo que pasa cuando se cae ese candado. Siete modales de caricatura —apertura, Pedidos, WhatsApp, Catálogo, Despachos, Configuración y cierre— y **cada paso navega de verdad** a su pantalla, con el fondo del modal en `traslucido` para que se vea el panel real detrás. Va montado en `AdminShell`, no en una screen: tiene que sobrevivir a las navegaciones que él mismo dispara.
  - **Arranca una sola vez por empresa**, con marca en `localStorage` (`bs_recorrido_<code>`, misma convención que `bs_bienvenida_<code>`) escrita al abrir, no al terminar. Condiciones: rol que vivió el candado, `puedeVender && !activo` (negocio recién abierto, no un veterano entrando desde otro navegador) y fuera de Primeros pasos, para no encimarse con el `FinalModal` — que ahora sale por `/pedidos` y le pasa el relevo.
  - **Se retoma desde Configuración** ("Ver el recorrido", en el `PageHeader`), vía el pub/sub de `lib/recorrido.ts`. No está en el rail ni en la topbar a propósito: son barras de trabajo constante y esto se usa dos veces en la vida del negocio.
  - **No es el tour de driver.js.** `lib/tour.ts` + `TourController` son del demo público `/preview/*` y no se tocan; este vive en el panel real y usa los modales de `cartoon.module.css`.
- **Canales:** además del selector Kapso/Evolution con QR, el panel **"Cómo te pagan"**: pasarela simulada (default, no cobra), Wompi con llaves `pub_test_` (sandbox: se ve y se comporta como el real pero no mueve dinero) o Wompi de producción. El entorno lo decide el prefijo de la llave, no un flag aparte.
- **Empresas (owner):** días de prueba de la plataforma, y por empresa: activar/suspender, plan y extender/reiniciar la prueba.
- **Configuración (9 tabs):** Local (geocoding Nominatim), Zonas (tarifas + dibujo de polígonos en Maps), Horarios, Cocineros, Meseros, Categorías, Mensajes del bot (editor con `{{vars}}`), Reseñas (regalo/vigencia/link Maps), Promociones.

## Demo público (`/preview/*`) y recorrido guiado

Las rutas `/preview/*` son el **demo comercial** (sin auth, con mocks): `DemoShell` + `DemoGuard` (corta todo fetch al backend) + `TourController` (recorrido driver.js definido en `lib/tour.ts`: 19 pasos + 1 con `onlyIfLocked`, que solo sale si el plan bloquea pantallas). Se entra desde el onboarding de la website con `?demo=1&plan=<plan>&tour=1`.

- **Los pasos apuntan a anclas `data-tour="…"`**, no a clases de marca. Las clases globales (`.panel`, `.content`, `.dtable`, `.chip`, `.btn-primary`, `.stats`, `.tablist`, `.input-search`) se repiten varias veces por pantalla: `querySelector` coge la primera y el foco acaba en el sitio equivocado o sobre un contenedor más grande que la pantalla (= no resalta nada). Si mueves o renombras un bloque resaltado, **mueve el `data-tour` con él**. `Panel` y `StatGrid` aceptan una prop opcional `dataTour`; `Tabs` emite `data-tour="tab-<id>"` en cada pestaña.
- Si el objetivo vive dentro de una pestaña que no está montada, el paso usa `pre: '[data-tour="tab-…"]'` y el tour la abre antes de resaltar.
- Mientras el tour corre, `<html>` lleva `tour-open` (baja el panel el alto de la barra de progreso fija, que si no tapa lo resaltado) y `tour-busy` entre paso y paso (oculta el popover viejo y bloquea "Siguiente" para que no se descuadre).
- Al añadir una pantalla al `NAV`, acuérdate de `app/preview/<id>/` y de `lib/plans.ts`: si falta la ruta, el rail del demo enlaza a un 404 (hoy pasa con `salon` y `empresas`).

## Cortes de acceso

Dos, con la misma pantalla (`CuentaSuspendida`) y distinto mensaje:

- **`status = 'suspended'`** — palanca manual del owner. El backend devuelve 403 en todo: panel y
  venta apagados.
- **Prueba vencida** (`plan = 'trial'` y `diasRestantes <= 0`) — el backend devuelve **402** en las
  rutas del panel, pero el bot sigue atendiendo y la tienda sigue cobrando. La pantalla lo dice
  explícitamente: el dueño tiene que saber que no está perdiendo ventas.

El layout `(admin)` corta antes de montar el panel. El rol `platform` **sí** entra: el owner
necesita poder arreglar la empresa desde dentro.

## Estado y gotchas

- v0.1.0, sin TODOs visibles, bastante pulido. Sin tests automatizados (las rutas `/preview/*` con mock sirven para QA manual).
- **Tiempo real por polling**, no WebSockets (el backend sí publica Realtime; oportunidad de migrar).
- **Google Maps API key** y **Map ID** en `NEXT_PUBLIC_*` → restringir por HTTP referrer en GCP. Nominatim (geocoding) es rate-limited.
- Token en `localStorage` (riesgo XSS); el backend gestiona expiración. CORS: el origen `:3001` debe estar en `EXTRA_CORS_ORIGINS` del backend.
- No rompas `output: export` (sin API routes ni Server Actions aquí).
