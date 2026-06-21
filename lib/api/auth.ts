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

/** Una pertenencia del usuario a una empresa (multi-tenant). */
export interface Membership {
  companySlug: string;
  companyName: string;
  role: MembershipRole;
}

/**
 * Sesión hidratada desde `/api/auth/me`. Además del usuario trae las membresías
 * (empresas a las que pertenece + rol en cada una) y el slug de la empresa
 * activa elegida por el backend.
 */
export interface MeResult {
  user: AuthUser;
  memberships: Membership[];
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
 * efecto secualdario hidrata el slug activo en la capa de transporte (para que
 * `tenantRequest` ya tenga prefijo). Devuelve `null` si no hay sesión (401).
 */
export async function me(): Promise<MeResult | null> {
  try {
    const res = await request<{
      ok: true;
      user: AuthUser;
      memberships?: Membership[];
      activeCompanySlug?: string | null;
    }>('/api/auth/me');

    const memberships = res.memberships ?? [];
    const validSlugs = memberships.map((m) => m.companySlug);
    hydrateActiveCompany(res.activeCompanySlug, validSlugs);

    return {
      user: res.user,
      memberships,
      activeCompanySlug: res.activeCompanySlug ?? validSlugs[0] ?? null,
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
