'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Kanban } from './Kanban';
import { PedidoDetail } from './PedidoDetail';

/** Orquesta el board + el slide-over de detalle (selección por estado local). */
export function PedidosScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();

  return (
    <>
      <Kanban selectedId={selectedId} onSelect={setSelectedId} />
      {selectedId && (
        <PedidoDetail
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onOpenChat={(phone) => router.push(`/whatsapp?phone=${encodeURIComponent(phone)}`)}
        />
      )}
    </>
  );
}
