/**
 * Empresa activa (multi-tenant).
 *
 * Backend multi-empresa: las rutas de negocio cuelgan de `/api/<companySlug>/…`,
 * donde `<companySlug>` es el slug de la empresa. Este módulo guarda el slug
 * activo en memoria (fuente de verdad para `tenantRequest`) y, para el caso del
 * owner con varias empresas, lo persiste en `localStorage` para recordar la
 * última elección.
 *
 * Vive en la capa de transporte (sin React) para que `client.ts` lo lea sin
 * crear una dependencia circular con `lib/queries`. La capa de React lo observa
 * vía `subscribeActiveCompany` (ver `lib/queries/company.ts`).
 *
 * SSR/export estático: en servidor `window` no existe → el slug arranca `null`
 * y se hidrata en cliente desde `/api/auth/me`. Mientras sea `null`, las queries
 * de negocio NO deben dispararse (los hooks lo controlan con `enabled`).
 */

const ACTIVE_COMPANY_STORAGE_KEY = 'bs_active_company';

let activeCompanySlug: string | null = null;
const listeners = new Set<() => void>();

/** Slug de la empresa activa, o `null` si aún no se ha hidratado. */
export function getActiveCompanySlug(): string | null {
  return activeCompanySlug;
}

/**
 * Fija el slug activo y notifica a los observadores. Persiste en localStorage
 * (útil para el owner multi-empresa que cambia de empresa). Pasar `null` lo
 * limpia (logout).
 */
export function setActiveCompanySlug(slug: string | null): void {
  if (activeCompanySlug === slug) return;
  activeCompanySlug = slug;
  if (typeof window !== 'undefined') {
    if (slug) window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, slug);
    else window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
  }
  for (const l of listeners) l();
}

/** Slug persistido de una sesión anterior (solo cliente). */
export function getStoredActiveCompanySlug(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
}

/**
 * Hidrata el slug activo a partir de la respuesta de `/api/auth/me`.
 * Si el slug persistido sigue siendo una membresía válida, lo respeta; si no,
 * cae al `activeCompanySlug` que dicta el backend.
 */
export function hydrateActiveCompany(
  activeFromServer: string | null | undefined,
  validSlugs: string[],
): void {
  const stored = getStoredActiveCompanySlug();
  const next =
    stored && validSlugs.includes(stored)
      ? stored
      : activeFromServer && validSlugs.includes(activeFromServer)
        ? activeFromServer
        : (validSlugs[0] ?? null);
  setActiveCompanySlug(next);
}

/** Suscripción para `useSyncExternalStore`. Devuelve el unsubscribe. */
export function subscribeActiveCompany(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
