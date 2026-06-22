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
      <DashboardScreen />
    </QueryClientProvider>
  );
}
