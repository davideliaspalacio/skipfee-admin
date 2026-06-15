'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { orderKeys, zoneKeys, settingsKeys } from '@/lib/queries/keys';
import { DespachosScreen } from '@/components/features/despachos/DespachosScreen';
import { mockPackedOrders, mockZones, mockSettings } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — DespachosScreen real con datos mock, sin auth.
 * La pantalla pide useOrders({ status: 'empacado' }), useZones() y useSettings()
 * (origen de las rutas). Espeja app/preview/pedidos/page.tsx. Se puede borrar.
 */
export default function PreviewDespachos() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(orderKeys.list({ status: 'empacado' }), mockPackedOrders);
    c.setQueryData(zoneKeys.list(false), mockZones);
    c.setQueryData(settingsKeys.current(), mockSettings);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <div className="shell">
        <div className="shell-main" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title">
              <b>Despachos</b>
              <span>Preview · datos de ejemplo (sin backend)</span>
            </div>
          </header>
          <main className="content">
            <DespachosScreen />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
