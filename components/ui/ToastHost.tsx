'use client';

import { useToast } from '@/lib/toast';

/** Renderiza el toast activo del pub/sub global (lib/toast). */
export function ToastHost() {
  const toast = useToast();
  if (!toast) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      <div className={`toast ${toast.kind}`}>
        <span className="tdot" />
        {toast.message}
      </div>
    </div>
  );
}
