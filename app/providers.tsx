'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ToastHost } from '@/components/ui/ToastHost';

/**
 * Providers globales del admin (client boundary).
 * - QueryClient: instancia por montaje (no singleton de módulo) para no filtrar
 *   estado entre requests durante el render en servidor. Mismos defaults que el Vite app.
 * - APIProvider: carga Google Maps una sola vez si hay API key (rutas/zonas).
 * - ToastHost: monta el pub/sub de toasts.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const tree = (
    <QueryClientProvider client={qc}>
      {children}
      <ToastHost />
    </QueryClientProvider>
  );

  return mapsKey ? <APIProvider apiKey={mapsKey}>{tree}</APIProvider> : tree;
}
