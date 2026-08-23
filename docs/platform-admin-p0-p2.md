# Admin global de plataforma — P0 a P2

## Objetivo

La cuenta `platform` es el owner de Skipfee. No pertenece a un solo restaurante:
puede ver todas las empresas, cambiar la empresa activa, operar cualquier tenant
y crear nuevos restaurantes con su primer `super_admin`.

## P0 implementado

- Backend protege `/api/platform/*` con `platform_admins`.
- `GET /api/auth/me` devuelve todas las empresas para el owner con rol `platform`.
- Admin muestra el selector de empresa activa cuando hay varias empresas.
- La navegación habilita `Empresas` solo para rol `platform`.
- `/empresas` lista tenants y permite crear empresa nueva.
- Al crear empresa se define una contraseña temporal para el primer `super_admin`.
- Usuarios de prueba creados y verificados en Supabase M2
  (`cgufqnkvoxbtdftdbfcq`) el 2026-07-03.
- Script de seed para entornos donde Supabase Admin Auth permite listar usuarios:

```bash
cd backend-skipfee
node scripts/seed-platform-test-users.mjs
```

El script valida antes de tocar Auth que `backend-skipfee/.env.local` apunte a
un proyecto con las tablas multi-tenant (`companies`, `company_members`,
`platform_admins`). Si apunta a un proyecto viejo/single-tenant, falla antes de
crear usuarios nuevos. En el proyecto M2 actual, `auth.admin.listUsers` devuelve
`Database error finding users`; por eso los usuarios de la tabla siguiente se
crearon con flujo `createUser` directo y luego se validó login contra Supabase
Auth sin imprimir tokens.

## Usuarios de prueba

| Rol | Email | Password | Alcance |
|---|---|---|---|
| platform | `platform.owner@skipfee.test` | `SkipfeePlatform2026!` | Todas las empresas + pantalla Empresas |
| super_admin | `admin.bros@skipfee.test` | `BrosAdmin2026!` | Bros and Subs |
| cocina | `cocina.bros@skipfee.test` | `BrosCocina2026!` | Solo Pedidos, estados cocina/empacado |
| empaque | `empaque.bros@skipfee.test` | `BrosEmpaque2026!` | Solo Pedidos, estados empacado/ruta |
| super_admin | `admin.napoli@skipfee.test` | `NapoliAdmin2026!` | Pizzería Napoli |

> Estos usuarios son de demo/test. Si se usan en producción temporalmente, deben
> eliminarse o rotarse después de validar.

## Fotos de verificación

Las capturas de esta revisión quedan en:

- `docs/platform-admin/screenshots/01-login.png`
- `docs/platform-admin/screenshots/02-platform-empresas.png`
- `docs/platform-admin/screenshots/03-nueva-empresa-modal.png`
- `docs/platform-admin/screenshots/04-live-platform-empresas.png`

Las tres primeras fotos se tomaron desde un preview local temporal con datos
mock para no tocar tenants reales durante la captura. La cuarta foto es
end-to-end: login real con `platform.owner@skipfee.test` contra
`https://backend.skipfee.co` y pantalla `/empresas` con datos reales. Las rutas
preview no quedan expuestas en la app final.

## Checklist manual P0

1. Ejecutar el seed de usuarios.
2. Levantar backend y admin.
3. Iniciar sesión como `platform.owner@skipfee.test`.
4. Confirmar que aparece `Empresas` en el rail.
5. Confirmar que el selector permite cambiar entre empresas.
6. Entrar a `Empresas` y crear un restaurante de prueba con contraseña temporal.
7. Cerrar sesión e iniciar con el `super_admin` creado.
8. Confirmar que ese usuario no ve `Empresas` y opera solo su restaurante.
9. Iniciar con `cocina.bros@skipfee.test` y confirmar acceso limitado a Pedidos.
10. Iniciar con `empaque.bros@skipfee.test` y confirmar acceso limitado a Pedidos.

## P1 recomendado

- Activar/suspender empresa desde `/empresas`.
- Gestión de miembros por empresa: invitar, cambiar rol, remover, resetear acceso.
- Auditoría de acciones de plataforma: quién creó/suspendió/cambió miembros.
- Filtro/búsqueda en la tabla de empresas por nombre, código y estado.
- Estado de onboarding por empresa: settings, catálogo, zonas, pagos, WhatsApp.

## P2 recomendado

- Wizard de alta de restaurante con checklist operacional.
- Logos/fotos por tenant y branding básico del restaurante.
- Métricas cross-tenant para Skipfee: GMV, pedidos, churn, salud de integración.
- Billing/planes por empresa y límites por plan.
- Soporte multi-owner de plataforma con permisos internos.
