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

- `useMe()` valida sesión; el layout `(admin)` redirige a `/login` si no hay sesión (401).
- Roles (`lib/roles.ts`): **`admin`** (todo), **`cocina`** (solo Pedidos, estados cocina/empacado), **`empaque`** (solo Pedidos, estados empacado/ruta). El rol filtra pantallas visibles y estados del kanban.

## Funcionalidades por módulo

- **Pedidos:** kanban 6 columnas (`nuevo→pagado→cocina→empacado→ruta→entregado`) con drag-drop → `PATCH /api/orders/:id/status`. Filtros por zona/búsqueda, detalle slide-over, asignación de cocinero. Deep-link a WhatsApp por teléfono.
- **WhatsApp:** lista por estado (todos/bot/human/pending) + thread con historial, composer (texto+imagen+emoji), takeover/release (bot↔humano), aviso de reseñas pendientes.
- **Despachos:** Google Maps con rutas + cobertura de zonas + pedidos listos.
- **Catálogo:** grid por categoría, CRUD de productos, subida de imagen (multipart), toggle disponibilidad.
- **Dashboard:** KPIs del día, banner de promo activa, pedidos en atención, gráficos línea/donut.
- **Clientes:** tabla segmentada (VIP/Recurrente/Nuevo) con métricas.
- **Reportes:** períodos 7/30/90d — financiero, top productos, análisis por zona, heatmap horario, conversión.
- **Configuración (8 tabs):** Local (geocoding Nominatim), Zonas (tarifas + dibujo de polígonos en Maps), Horarios, Cocineros, Categorías, Mensajes del bot (editor con `{{vars}}`), Reseñas (regalo/vigencia/link Maps), Promociones.

## Estado y gotchas

- v0.1.0, sin TODOs visibles, bastante pulido. Sin tests automatizados (las rutas `/preview/*` con mock sirven para QA manual).
- **Tiempo real por polling**, no WebSockets (el backend sí publica Realtime; oportunidad de migrar).
- **Google Maps API key** y **Map ID** en `NEXT_PUBLIC_*` → restringir por HTTP referrer en GCP. Nominatim (geocoding) es rate-limited.
- Token en `localStorage` (riesgo XSS); el backend gestiona expiración. CORS: el origen `:3001` debe estar en `EXTRA_CORS_ORIGINS` del backend.
- No rompas `output: export` (sin API routes ni Server Actions aquí).
