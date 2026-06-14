import type { IconName } from './icons';

export type ScreenId =
  | 'pedidos'
  | 'whatsapp'
  | 'despachos'
  | 'catalogo'
  | 'dashboard'
  | 'clientes'
  | 'reportes'
  | 'configuracion';

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: IconName;
  badge?: string;
  badgeAlert?: boolean;
  shortcut: string;
  /** Ruta absoluta de la screen en el admin. Se monta dentro de `/app/*`. */
  path: string;
}

export const NAV: NavItem[] = [
  { id: 'pedidos',       label: 'Pedidos',       icon: 'LayoutGrid',    shortcut: 'P', path: '/pedidos' },
  { id: 'whatsapp',      label: 'WhatsApp',      icon: 'MessageCircle', shortcut: 'W', path: '/whatsapp' },
  { id: 'despachos',     label: 'Despachos',     icon: 'Route',         shortcut: 'M', path: '/despachos' },
  { id: 'catalogo',      label: 'Catálogo',      icon: 'Package',       shortcut: 'C', path: '/catalogo' },
  { id: 'dashboard',     label: 'Dashboard',     icon: 'Home',          shortcut: 'D', path: '/dashboard' },
  { id: 'clientes',      label: 'Clientes',      icon: 'Users',         shortcut: 'L', path: '/clientes' },
  { id: 'reportes',      label: 'Reportes',      icon: 'BarChart',      shortcut: 'R', path: '/reportes' },
  { id: 'configuracion', label: 'Configuración', icon: 'Settings',      shortcut: ',', path: '/configuracion' },
];

/** Mapa rápido id → path para construir Links sin escanear NAV. */
export const SCREEN_PATHS: Record<ScreenId, string> = Object.fromEntries(
  NAV.map(n => [n.id, n.path]),
) as Record<ScreenId, string>;

// Primary mobile tabs: 4 high-frequency screens always one tap away.
export const MOB_NAV: ScreenId[] = ['pedidos', 'whatsapp', 'despachos', 'dashboard'];

// Remaining screens — surfaced via the "Más" bottom sheet, grouped by section.
export const MOB_NAV_MORE_SECTIONS: Array<{ label: string; items: ScreenId[] }> = [
  { label: 'Operación', items: ['catalogo'] },
  { label: 'Negocio',   items: ['clientes', 'reportes', 'configuracion'] },
];

export const MOB_NAV_MORE: ScreenId[] = MOB_NAV_MORE_SECTIONS.flatMap(s => s.items);

export const SCREEN_TITLES: Record<ScreenId, { title: string; sub: string }> = {
  dashboard:     { title: 'Dashboard',     sub: 'Resumen del día' },
  pedidos:       { title: 'Pedidos',       sub: '13 activos · 42 completados hoy' },
  whatsapp:      { title: 'WhatsApp',      sub: '8 conversaciones · 3 pendientes' },
  catalogo:      { title: 'Catálogo',      sub: 'Productos en oferta' },
  clientes:      { title: 'Clientes',      sub: 'Registrados desde pedidos y WhatsApp' },
  reportes:      { title: 'Reportes',      sub: 'Métricas del negocio' },
  despachos:     { title: 'Despachos',     sub: 'Pedidos listos + rutas optimizadas' },
  configuracion: { title: 'Configuración', sub: 'Zonas, horarios, bot y equipo' },
};
