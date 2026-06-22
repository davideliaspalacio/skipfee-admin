'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { settingsKeys, zoneKeys } from '@/lib/queries/keys';
import { ZonasPanel } from '@/components/features/configuracion/ZonasPanel';
import { mockSettings, mockZones } from '../mocks';

/**
 * Preview (solo dev) dedicado a ZonasPanel → render-verifica el ZonaCoverageMap
 * (editor de polígono Places + OSM) con zonas reales. ZonasPanel usa useZones(true).
 */
export default function PreviewZonas() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(zoneKeys.list(true), mockZones);
    c.setQueryData(settingsKeys.current(), mockSettings);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <ZonasPanel />
    </QueryClientProvider>
  );
}
