/**
 * Empresa activa (multi-tenant).
 *
 * Backend multi-empresa: las rutas de negocio cuelgan de `/api/<companyCode>/…`,
 * donde `<companyCode>` es el **código numérico** de la empresa (p. ej. `1001`),
 * guardado aquí como string ("1001"). El slug/nombre se conservan solo como
 * etiqueta visible; el identificador de RUTA es el code. Este módulo guarda el
 * code activo en memoria (fuente de verdad para `tenantRequest`) y, para el caso
 * del owner con varias empresas, lo persiste en `localStorage` para recordar la
 * última elección.
 *
 * Vive en la capa de transporte (sin React) para que `client.ts` lo lea sin
 * crear una dependencia circular con `lib/queries`. La capa de React lo observa
 * vía `subscribeActiveCompany` (ver `lib/queries/company.ts`).
 *
 * SSR/export estático: en servidor `window` no existe → el code arranca `null`
 * y se hidrata en cliente desde `/api/auth/me`. Mientras sea `null`, las queries
 * de negocio NO deben dispararse (los hooks lo controlan con `enabled`).
 *
 * Nota de nombres: las funciones conservan el sufijo `Slug` por compatibilidad
 * de imports, pero el VALOR que manejan es el companyCode (string), no el slug.
 */

const ACTIVE_COMPANY_STORAGE_KEY = 'bs_active_company';

let activeCompanyCode: string | null = null;
const listeners = new Set<() => void>();

/** Code (numérico, como string) de la empresa activa, o `null` si no se hidrató. */
export function getActiveCompanySlug(): string | null {
  return activeCompanyCode;
}

/**
 * Fija el code activo y notifica a los observadores. Persiste en localStorage
 * (útil para el owner multi-empresa que cambia de empresa). Pasar `null` lo
 * limpia (logout). El argumento es el companyCode como string (p. ej. "1001").
 */
export function setActiveCompanySlug(code: string | null): void {
  if (activeCompanyCode === code) return;
  activeCompanyCode = code;
  if (typeof window !== 'undefined') {
    if (code) window.localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, code);
    else window.localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
  }
  for (const l of listeners) l();
}

/** Code persistido de una sesión anterior (solo cliente). */
export function getStoredActiveCompanySlug(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
}

/**
 * Hidrata el code activo a partir de la respuesta de `/api/auth/me`.
 * Si el code persistido sigue siendo una membresía válida, lo respeta; si no,
 * cae al `activeCompanyCode` que dicta el backend. `validCodes` son los codes
 * (string) de las membresías del usuario.
 */
export function hydrateActiveCompany(
  activeFromServer: string | null | undefined,
  validCodes: string[],
): void {
  const stored = getStoredActiveCompanySlug();
  const next =
    stored && validCodes.includes(stored)
      ? stored
      : activeFromServer && validCodes.includes(activeFromServer)
        ? activeFromServer
        : (validCodes[0] ?? null);
  setActiveCompanySlug(next);
}

/** Suscripción para `useSyncExternalStore`. Devuelve el unsubscribe. */
export function subscribeActiveCompany(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
