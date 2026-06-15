'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { reportKeys } from '@/lib/queries/keys';
import { ReportesScreen } from '@/components/features/reportes/ReportesScreen';
import { mockReports } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — ReportesScreen real con datos mock, sin auth.
 * La pantalla arranca en período '30d' → sembramos esa key. Espeja
 * app/preview/pedidos/page.tsx. Se puede borrar.
 */
export default function PreviewReportes() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(reportKeys.summary('30d'), mockReports);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <div className="shell">
        <div className="shell-main" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title">
              <b>Reportes</b>
              <span>Preview · datos de ejemplo (sin backend)</span>
            </div>
          </header>
          <main className="content">
            <ReportesScreen />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
