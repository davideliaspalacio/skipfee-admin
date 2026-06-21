import type { StatusId } from './data';
import type { ScreenId } from './nav';

/**
 * `platform` es el rol del OWNER de la plataforma (lo asigna `/api/auth/me`
 * cuando el usuario está en `platform_admins`). Ve todas las empresas y, además
 * de las pantallas de operación, la pantalla de gestión "Empresas".
 */
export type UserRole = 'platform' | 'super_admin' | 'admin' | 'cocina' | 'empaque';

const ALL_STATUS: StatusId[] = ['nuevo', 'pagado', 'cocina', 'empacado', 'ruta', 'entregado'];
const ALL_SCREENS: ScreenId[] = [
  'pedidos',
  'whatsapp',
  'despachos',
  'catalogo',
  'dashboard',
  'clientes',
  'reportes',
  'configuracion',
];

const STATUS_BY_ROLE: Record<UserRole, StatusId[]> = {
  // platform (owner) y super_admin tienen acceso total dentro de la empresa activa.
  platform: ALL_STATUS,
  super_admin: ALL_STATUS,
  admin: ALL_STATUS,
  cocina: ['cocina', 'empacado'],
  empaque: ['empacado', 'ruta'],
};

const SCREENS_BY_ROLE: Record<UserRole, ScreenId[]> = {
  // Solo el owner ve "empresas" (gestión de tenants de la plataforma).
  platform: [...ALL_SCREENS, 'empresas'],
  super_admin: ALL_SCREENS,
  admin: ALL_SCREENS,
  cocina: ['pedidos'],
  empaque: ['pedidos'],
};

export function normalizeRole(raw: string | null | undefined): UserRole {
  if (
    raw === 'platform' ||
    raw === 'super_admin' ||
    raw === 'cocina' ||
    raw === 'empaque'
  ) {
    return raw;
  }
  return 'admin';
}

/** ¿Es el owner de la plataforma? (acceso a "Empresas" + selector multi-empresa). */
export function isPlatformOwner(role: UserRole): boolean {
  return role === 'platform';
}

export function visibleStatusIds(role: UserRole): StatusId[] {
  return STATUS_BY_ROLE[role];
}

export function visibleScreenIds(role: UserRole): ScreenId[] {
  return SCREENS_BY_ROLE[role];
}
