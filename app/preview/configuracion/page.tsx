'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  settingsKeys,
  productKeys,
  zoneKeys,
  cookKeys,
  botMessageKeys,
  promotionKeys,
  surveyKeys,
} from '@/lib/queries/keys';
import { ConfiguracionScreen } from '@/components/features/configuracion/ConfiguracionScreen';
import {
  mockSettings,
  mockProducts,
  mockZones,
  mockCooks,
  mockBotMessages,
  mockPromotions,
  mockSurveys,
} from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — ConfiguracionScreen real con datos mock, sin auth.
 * Siembra TODAS las queries de los paneles (Local/Zonas/Horarios/Cocineros/
 * Categorías/Bot/Reseñas/Promos). Espeja app/preview/pedidos/page.tsx.
 */
export default function PreviewConfiguracion() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(settingsKeys.current(), mockSettings);
    c.setQueryData(productKeys.list(), mockProducts);
    c.setQueryData(zoneKeys.list(false), mockZones);
    // ZonasPanel usa useZones(true) (incluye archivadas).
    c.setQueryData(zoneKeys.list(true), mockZones);
    c.setQueryData(cookKeys.list(false), mockCooks);
    c.setQueryData(botMessageKeys.list(), mockBotMessages);
    // PromocionesPanel usa usePromotions(true) → key con includeArchived=true.
    c.setQueryData(promotionKeys.list(true), mockPromotions);
    // ResenasPanel usa useSurveys(90).
    c.setQueryData(surveyKeys.list(90), mockSurveys);
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <ConfiguracionScreen />
    </QueryClientProvider>
  );
}
