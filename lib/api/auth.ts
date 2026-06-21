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
export type MembershipRole = 'platform' | 'super_admin' | 'admin' | 'cocina' | 'empaque';

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
