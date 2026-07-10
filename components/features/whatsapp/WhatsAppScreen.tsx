'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/lib/icons';
import type { Chat } from '@/lib/data';
import {
  useChatByPhone,
  useActiveCompany,
  useChats,
  useChatsStats,
  useMarkChatRead,
  useRewards,
} from '@/lib/queries';
import { ChatList, type ChatTabKey } from './ChatList';
import { ChatThread } from './ChatThread';
import { ContextPanel } from './ContextPanel';
import { digitsOnly } from './helpers';
import styles from './whatsapp.module.css';

export function WhatsAppScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pinnedChat, setPinnedChat] = useState<Chat | null>(null);
  const [tab, setTab] = useState<ChatTabKey>('todos');
  const [search, setSearch] = useState('');
  const activeCompany = useActiveCompany();

  const { data: chatsData, isFetching } = useChats();
  const chats: Chat[] = chatsData ?? [];

  const { data: stats } = useChatsStats();
  const unread = stats?.unread ?? 0;
  const markRead = useMarkChatRead();

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
  const wantedPhone = searchParams.get('phone')?.trim() ?? '';
  const { data: linkedChat, isFetched: linkedChatFetched, isFetching: linkedChatFetching } =
    useChatByPhone(wantedPhone);
  const consumedPhoneParam = useRef(false);

  useEffect(() => {
    setPinnedChat(null);
    setSelectedId(null);
    consumedPhoneParam.current = false;
  }, [activeCompany]);

  const listChats = pinnedChat && !chats.some((c) => c.id === pinnedChat.id)
    ? [pinnedChat, ...chats]
    : chats;

  useEffect(() => {
    if (consumedPhoneParam.current) return;
    if (!wantedPhone) return;

    const target = chats.find((c) => digitsOnly(c.phone) === digitsOnly(wantedPhone));
    if (target) {
      setPinnedChat(null);
      setSelectedId(target.id);
      consumedPhoneParam.current = true;
      router.replace('/whatsapp');
      return;
    }

    if (!linkedChatFetched) return;

    if (linkedChat) {
      setPinnedChat(linkedChat);
      setSelectedId(linkedChat.id);
    }
    consumedPhoneParam.current = true;
    router.replace('/whatsapp');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, linkedChat, linkedChatFetched, wantedPhone]);

  // Auto-seleccionar el primer chat cuando llegan datos.
  useEffect(() => {
    if (wantedPhone && !consumedPhoneParam.current) return;
    if (!selectedId && listChats.length > 0) setSelectedId(listChats[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listChats, wantedPhone]);

  const selected = listChats.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || selected.unread <= 0) return;
    markRead.mutate(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.unread]);

  return (
    <div className={styles.wrap}>
      <ChatList
        chats={listChats}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          if (pinnedChat && pinnedChat.id !== id) setPinnedChat(null);
        }}
        tab={tab}
        onTab={setTab}
        search={search}
        onSearch={setSearch}
        unread={unread}
        live={isFetching || linkedChatFetching}
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
              {listChats.length === 0 ? 'Aún no hay conversaciones' : 'Selecciona una conversación'}
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
