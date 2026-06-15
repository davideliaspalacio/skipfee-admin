'use client';

import { Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { chatKeys, rewardKeys } from '@/lib/queries/keys';
import { WhatsAppScreen } from '@/components/features/whatsapp/WhatsAppScreen';
import { mockChats, mockChatsStats, mockChatMessages, mockRewards } from '../mocks';

/**
 * Ruta de PREVIEW (solo dev) — renderiza WhatsAppScreen real con datos mock,
 * sin gate de auth, para render-verificar el diseño sin backend.
 * Espeja el patrón de app/preview/pedidos/page.tsx. Se puede borrar.
 *
 * WhatsAppScreen usa useSearchParams (deep-link ?phone=…) → Suspense.
 */
export default function PreviewWhatsApp() {
  const [qc] = useState(() => {
    const c = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });
    c.setQueryData(chatKeys.list({}), mockChats);
    c.setQueryData(chatKeys.stats(), mockChatsStats);
    c.setQueryData(rewardKeys.list('pendiente'), mockRewards);
    // La pantalla auto-selecciona el primer chat (ch1) y abre su hilo.
    for (const [chatId, messages] of Object.entries(mockChatMessages)) {
      c.setQueryData(chatKeys.messages(chatId), messages);
    }
    return c;
  });

  return (
    <QueryClientProvider client={qc}>
      <div className="shell">
        <div className="shell-main" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title">
              <b>WhatsApp</b>
              <span>Preview · datos de ejemplo (sin backend)</span>
            </div>
          </header>
          <main className="content">
            <Suspense fallback={null}>
              <WhatsAppScreen />
            </Suspense>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
