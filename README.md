# admin-skipfee — Panel administrativo

Panel de administración de **Skipfee** (pedidos, WhatsApp, despachos, catálogo, clientes,
reportes, configuración). Proyecto **separado**, Next.js 16 (App Router), que reusa el design
system de la landing (`../frontend-v1`) y consume la API de `../backend`.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3001
```

El backend debe correr en `http://localhost:3000` (`cd ../backend && npm run dev`).
Configura `NEXT_PUBLIC_API_BASE_URL` en `.env.local` (ya apunta a `:3000`).

**Importante (CORS):** agrega el origen del admin a `../backend/.env.local`:

```
EXTRA_CORS_ORIGINS=http://localhost:3001
```

## Mapa de puertos

| Proyecto       | Puerto | Comando            |
|----------------|--------|--------------------|
| backend        | :3000  | `npm run dev`      |
| admin-skipfee  | :3001  | `npm run dev`      |
| frontend (Vite)| :5173  | `npm run dev`      |

## Stack

- **Next.js 16 + React 19** (App Router, client-rendered detrás de login)
- **@tanstack/react-query** (capa de datos portada de `../frontend`, mismo polling)
- **@dnd-kit/core** (kanban de pedidos), **@vis.gl/react-google-maps** (rutas/zonas)
- Design system propio en `app/brand.css` (espejo congelado de `frontend-v1`) + `app/admin.css`
- Auth: Bearer token en `localStorage` (`bs_access_token`)

## Diseño

`app/brand.css` es un **espejo congelado** del `globals.css` de la landing — no editar; si la
marca cambia, re-sincronizar desde `frontend-v1/app/globals.css`. La capa de interacción del
admin (dark mode, drag, modales, toasts, shell) vive en `app/admin.css`.

Ver `../PLAN_ADMIN_SKIPFEE.md` para el plan completo de migración.
