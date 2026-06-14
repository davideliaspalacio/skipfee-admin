import { Suspense } from 'react';
import { WhatsAppScreen } from '@/components/features/whatsapp/WhatsAppScreen';

// useSearchParams (deep-link ?phone=…) exige un límite de Suspense para que el
// prerender/build de Next 16 no falle.
export default function WhatsappPage() {
  return (
    <Suspense fallback={null}>
      <WhatsAppScreen />
    </Suspense>
  );
}
