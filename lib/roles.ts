import type { StatusId } from './data';
import type { ScreenId } from './nav';

export type UserRole = 'admin' | 'cocina' | 'empaque';

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
  admin: ALL_STATUS,
  cocina: ['cocina', 'empacado'],
  empaque: ['empacado', 'ruta'],
};

const SCREENS_BY_ROLE: Record<UserRole, ScreenId[]> = {
  admin: ALL_SCREENS,
  cocina: ['pedidos'],
  empaque: ['pedidos'],
};

export function normalizeRole(raw: string | null | undefined): UserRole {
  if (raw === 'cocina' || raw === 'empaque') return raw;
  return 'admin';
}

export function visibleStatusIds(role: UserRole): StatusId[] {
  return STATUS_BY_ROLE[role];
}

export function visibleScreenIds(role: UserRole): ScreenId[] {
  return SCREENS_BY_ROLE[role];
}
