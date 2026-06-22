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
      <ClientesScreen />
    </QueryClientProvider>
  );
}
