import { Suspense } from 'react';
import { ConfiguracionScreen } from '@/components/features/configuracion/ConfiguracionScreen';

// useSearchParams (deep-link ?tab=zonas) exige un límite de Suspense para que el
// prerender/build de Next 16 no falle.
export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionScreen />
    </Suspense>
  );
}
