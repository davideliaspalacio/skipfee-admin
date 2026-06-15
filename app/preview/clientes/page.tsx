'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { customerKeys } from '@/lib/queries/keys';
import { ClientesScreen } from '@/components/features/clientes/ClientesScreen';
import { mockCustomers } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — ClientesScreen real con datos mock, sin auth.
 * useCustomers() sin filtro → key customerKeys.list({}). Espeja
 * app/preview/pedidos/page.tsx. Se puede borrar.
 */
export default function PreviewClientes() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(customerKeys.list({}), mockCustomers);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <div className="shell">
        <div className="shell-main" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title">
              <b>Clientes</b>
              <span>Preview · datos de ejemplo (sin backend)</span>
            </div>
          </header>
          <main className="content">
            <ClientesScreen />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
