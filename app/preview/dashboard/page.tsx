'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardKeys, promotionKeys } from '@/lib/queries/keys';
import { DashboardScreen } from '@/components/features/dashboard/DashboardScreen';
import { mockDashboard, mockActivePromotions } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — DashboardScreen real con datos mock, sin auth.
 * Espeja app/preview/pedidos/page.tsx. Se puede borrar.
 */
export default function PreviewDashboard() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(dashboardKeys.today(), mockDashboard);
    c.setQueryData(promotionKeys.active(), mockActivePromotions);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <div className="shell">
        <div className="shell-main" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title">
              <b>Dashboard</b>
              <span>Preview · datos de ejemplo (sin backend)</span>
            </div>
          </header>
          <main className="content">
            <DashboardScreen />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
