'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ORDERS } from '@/lib/data';
import { orderKeys } from '@/lib/queries/keys';
import { Kanban } from '@/components/features/pedidos/Kanban';

/**
 * Ruta de PREVIEW (solo dev) — renderiza el Kanban real con datos mock,
 * sin pasar por el gate de auth, para revisar el diseño sin backend.
 * No forma parte del producto; se puede borrar.
 */
export default function PreviewPedidos() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(orderKeys.list({}), ORDERS);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <Kanban selectedId={null} onSelect={() => {}} />
    </QueryClientProvider>
  );
}
