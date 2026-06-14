import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente global de React Query.
 *
 * - `staleTime: 30s` evita re-fetch agresivo cuando el usuario vuelve a una pantalla
 *   que ya tiene datos frescos. Las pantallas críticas (Pedidos) sobreescriben
 *   el `refetchInterval` por su cuenta para hacer polling.
 * - `gcTime: 5min` retiene cache aunque no haya observers (cambio de pestaña ida y vuelta).
 * - `retry: 1` para no martillar el backend ante errores transitorios.
 * - `refetchOnWindowFocus: false`: ya hacemos polling donde importa; refrescar
 *   al volver al foco produce parpadeo innecesario.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
