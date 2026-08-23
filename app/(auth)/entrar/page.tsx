import { Suspense } from 'react';
import { Entrar } from './Entrar';

// Lee el pase de `?t=` → useSearchParams → exige Suspense en el export estático.
export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <Entrar />
    </Suspense>
  );
}
