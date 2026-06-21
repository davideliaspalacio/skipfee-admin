import { useSyncExternalStore } from 'react';
import {
  getActiveCompanySlug,
  setActiveCompanySlug,
  subscribeActiveCompany,
} from '../api';

/**
 * Hook React para leer/observar la empresa activa (multi-tenant).
 *
 * Lee del store de transporte (`lib/api/activeCompany`) vía
 * `useSyncExternalStore`, así cualquier cambio de empresa re-renderiza a los
 * consumidores. No es un Context: el store es un singleton de módulo, lo que
 * evita prop-drilling y permite que la capa de transporte (sin React) y la UI
 * compartan exactamente la misma fuente de verdad.
 *
 * SSR/export estático: el `getServerSnapshot` devuelve `null` (no hay empresa
 * en servidor); se hidrata en cliente tras `/api/auth/me`.
 */
export function useActiveCompany(): string | null {
  return useSyncExternalStore(
    subscribeActiveCompany,
    getActiveCompanySlug,
    () => null,
  );
}

/**
 * Cambia la empresa activa (owner multi-empresa). El cambio persiste en
 * localStorage y re-renderiza la app; como las query keys de negocio incluyen
 * el slug, React Query sirve/recarga el caché de la nueva empresa sin mezclar.
 */
export function setActiveCompany(slug: string): void {
  setActiveCompanySlug(slug);
}
