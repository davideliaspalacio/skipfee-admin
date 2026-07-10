// Planes de Skipfee — gating del "modo demo" del panel.
//
// Espeja website-skipfee/lib/plans.ts (no hay paquete compartido entre repos).
// Define qué pantallas del panel habilita cada plan, para mostrar las demás con
// candado + upsell cuando un negocio llega desde el onboarding con ?plan=...

import type { ScreenId } from './nav';

export type PlanId = 'arranque' | 'negocio' | 'crece-ia' | 'cadena';

export const PLAN_NAMES: Record<PlanId, string> = {
  arranque: 'Arranque',
  negocio: 'Negocio',
  'crece-ia': 'Crece IA',
  cadena: 'Cadena',
};

const ALL_SCREENS: ScreenId[] = [
  'dashboard',
  'pedidos',
  'whatsapp',
  'canales',
  'catalogo',
  'despachos',
  'clientes',
  'reportes',
  'configuracion',
];

const UNLOCKS: Record<PlanId, ScreenId[]> = {
  arranque: ['dashboard', 'pedidos', 'whatsapp', 'catalogo'],
  negocio: ALL_SCREENS,
  'crece-ia': ALL_SCREENS,
  cadena: ALL_SCREENS,
};

/** Plan mínimo que desbloquea cada pantalla (para el mensaje de upsell). */
const MIN_PLAN_FOR_SCREEN: Partial<Record<ScreenId, PlanId>> = {
  despachos: 'negocio',
  canales: 'negocio',
  clientes: 'negocio',
  reportes: 'negocio',
  configuracion: 'negocio',
};

export function normalizePlan(raw: string | null | undefined): PlanId {
  if (raw === 'arranque' || raw === 'negocio' || raw === 'crece-ia' || raw === 'cadena') return raw;
  return 'negocio';
}

export function planUnlocks(plan: PlanId): ScreenId[] {
  return UNLOCKS[plan];
}

export function isScreenUnlocked(plan: PlanId, screen: ScreenId): boolean {
  return UNLOCKS[plan].includes(screen);
}

export function minPlanFor(screen: ScreenId): PlanId {
  return MIN_PLAN_FOR_SCREEN[screen] ?? 'negocio';
}
