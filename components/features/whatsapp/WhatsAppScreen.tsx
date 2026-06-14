'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/lib/icons';
import type { Chat } from '@/lib/data';
import { useChats, useChatsStats, useRewards } from '@/lib/queries';
import { ChatList, type ChatTabKey } from './ChatList';
import { ChatThread } from './ChatThread';
import { ContextPanel } from './ContextPanel';
import { digitsOnly } from './helpers';
import styles from './whatsapp.module.css';

export function WhatsAppScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ChatTabKey>('todos');
  const [search, setSearch] = useState('');

  const { data: chatsData, isFetching } = useChats();
  const chats: Chat[] = chatsData ?? [];

  const { data: stats } = useChatsStats();
  const unread = stats?.unread ?? 0;

  // Reseñas pendientes: marcamos en la lista qué chats esperan aprobación del
  // postre. Comparamos por dígitos del teléfono y filtramos vacíos para que un
  // reward sin teléfono no matchee con cualquier chat.
  const { data: pendingRewards } = useRewards('pendiente');
  const phonesPendingReview = new Set(
    (pendingRewards ?? [])
      .map((r) => digitsOnly(r.phone))
      .filter((p) => p.length > 0),
  );

  // Deep-link desde Pedidos: `?phone=…` autoselecciona el chat. El ref evita
  // re-consumir el param cuando `chats` cambia por el polling. Limpiamos el
  // query (replace) para no atrapar back/forward en la selección consumida.
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumedPhoneParam = useRef(false);
  useEffect(() => {
    if (consumedPhoneParam.current) return;
    if (chats.length === 0) return;
    const wanted = searchParams.get('phone');
    if (!wanted) return;
    consumedPhoneParam.current = true;
    const target = chats.find((c) => digitsOnly(c.phone) === digitsOnly(wanted));
    if (target) setSelectedId(target.id);
    router.replace('/whatsapp');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, searchParams]);

  // Auto-seleccionar el primer chat cuando llegan datos.
  useEffect(() => {
    if (!selectedId && chats.length > 0) setSelectedId(chats[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats]);

  const selected = chats.find((c) => c.id === selectedId) ?? null;

  return (
    <div className={styles.wrap}>
      <ChatList
        chats={chats}
        selectedId={selectedId}
        onSelect={setSelectedId}
        tab={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        unread={unread}
        live={isFetching}
        phonesPendingReview={phonesPendingReview}
      />

      {selected ? (
        <ChatThread key={selected.id} chat={selected} />
      ) : (
        <div className={styles.thread}>
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>
              <Icon.MessageCircle size={26} />
            </span>
            <span className={styles.placeholderTitle}>
              {chats.length === 0 ? 'Aún no hay conversaciones' : 'Selecciona una conversación'}
            </span>
            <span style={{ fontSize: 13 }}>
              Los chats de WhatsApp aparecen aquí en tiempo real.
            </span>
          </div>
        </div>
      )}

      {selected ? (
        <ContextPanel chat={selected} />
      ) : (
        <div className={styles.context} />
      )}
    </div>
  );
}
