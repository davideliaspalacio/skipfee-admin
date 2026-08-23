import { ApiError, request, setStoredToken } from './client';
import { hydrateActiveCompany, setActiveCompanySlug } from './activeCompany';

export interface AuthUser {
  id: string;
  email: string;
  role?: string | null;
}

/**
 * Rol del usuario dentro de una empresa concreta. `platform` lo asigna el
 * backend (`/api/auth/me`) cuando el usuario es owner de la plataforma (fila en
 * `platform_admins`): ve TODAS las empresas con rol `platform` sobre cada una.
 */
export type MembershipRole = 'platform' | 'super_admin' | 'admin' | 'cocina' | 'empaque' | 'mesero';

/**
 * Una pertenencia del usuario a una empresa (multi-tenant).
 *
 * `companyCode` (numérico) es el identificador de RUTA (`/api/<code>/…`).
 * `companySlug`/`companyName` son solo para mostrar (etiquetas en la UI).
 */
export interface Membership {
  companyCode: number;
  companySlug: string;
  companyName: string;
  role: MembershipRole;
  /** Suscripción de la empresa. Alimenta el aviso de días de prueba del panel. */
  plan?: 'trial' | 'activo' | 'cortesia';
  status?: 'active' | 'suspended';
  trialEndsAt?: string | null;
  /** Días completos que faltan de prueba. Lo calcula el backend. */
  diasRestantes?: number | null;
  /** null = el negocio nunca estuvo operativo (sigue montándose). */
  operativoDesde?: string | null;
  /** Estado del canal. null cuando la empresa usa Kapso (no hay sesión que caiga). */
  whatsapp?: 'connected' | 'connecting' | 'disconnected' | 'unknown' | null;
}

/**
 * Sesión hidratada desde `/api/auth/me`. Además del usuario trae las membresías
 * (empresas a las que pertenece + rol en cada una), el code numérico de la
 * empresa activa (identificador de ruta) y su slug (etiqueta visible).
 */
export interface MeResult {
  user: AuthUser;
  memberships: Membership[];
  /** Code numérico (string) de la empresa activa — identificador de ruta. */
  activeCompanyCode: string | null;
  /** Slug de la empresa activa — solo para mostrar. */
  activeCompanySlug: string | null;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await request<{
    ok: true;
    user: AuthUser;
    session?: { accessToken: string; refreshToken: string; expiresAt?: number };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.session?.accessToken) {
    setStoredToken(res.session.accessToken);
  }
  return { user: res.user };
}

/**
 * Canjea el pase de un solo uso que emite el registro de la landing por una
 * sesión, sin pedirle la contraseña otra vez a quien acaba de escribirla.
 */
export async function redeemPass(token: string): Promise<{ user: AuthUser }> {
  const res = await request<{
    ok: true;
    user: AuthUser;
    session?: { accessToken: string; refreshToken: string; expiresAt?: number };
  }>('/api/auth/redeem', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  if (res.session?.accessToken) {
    setStoredToken(res.session.accessToken);
  }
  return { user: res.user };
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
    setActiveCompanySlug(null);
  }
}

/**
 * Bootstrap de sesión. Devuelve usuario + membresías + empresa activa, y como
 * efecto secundario hidrata el code activo (identificador de ruta) en la capa de
 * transporte (para que `tenantRequest` ya tenga prefijo `/api/<code>`). Devuelve
 * `null` si no hay sesión (401).
 */
export async function me(): Promise<MeResult | null> {
  try {
    const res = await request<{
      ok: true;
      user: AuthUser;
      memberships?: Membership[];
      activeCompanyCode?: number | null;
      activeCompanySlug?: string | null;
    }>('/api/auth/me');

    const memberships = res.memberships ?? [];
    // El identificador de ruta es el code numérico; lo guardamos como string.
    const validCodes = memberships.map((m) => String(m.companyCode));
    const activeCodeStr =
      res.activeCompanyCode != null ? String(res.activeCompanyCode) : null;
    hydrateActiveCompany(activeCodeStr, validCodes);

    return {
      user: res.user,
      memberships,
      activeCompanyCode: activeCodeStr ?? validCodes[0] ?? null,
      activeCompanySlug: res.activeCompanySlug ?? memberships[0]?.companySlug ?? null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setStoredToken(null);
      setActiveCompanySlug(null);
      return null;
    }
    throw err;
  }
}

/**
 * Pide el correo de recuperación. Responde `ok` SIEMPRE, exista la cuenta o no
 * — si distinguiera, cualquiera podría averiguar qué correos están registrados.
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request<{ ok: true; message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Fija la contraseña nueva usando el token que trae el enlace del correo.
 * Ese token ES la autorización: no hace falta sesión previa.
 */
export async function resetPassword(accessToken: string, password: string): Promise<void> {
  await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ accessToken, password }),
  });
}
