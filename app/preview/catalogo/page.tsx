'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { productKeys, settingsKeys } from '@/lib/queries/keys';
import { CatalogoScreen } from '@/components/features/catalogo/CatalogoScreen';
import { mockProducts, mockSettings } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — CatalogoScreen real con datos mock, sin auth.
 * Espeja app/preview/pedidos/page.tsx. Se puede borrar.
 */
export default function PreviewCatalogo() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(productKeys.list(), mockProducts);
    c.setQueryData(settingsKeys.current(), mockSettings);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <CatalogoScreen />
    </QueryClientProvider>
  );
}
