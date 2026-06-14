'use client';

import { Icon } from '@/lib/icons';
import type { Chat } from '@/lib/data';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { digitsOnly, shortName, statusMeta } from './helpers';
import styles from './whatsapp.module.css';

export type ChatTabKey = 'todos' | 'humano' | 'bot' | 'pendiente';

const TABS: Array<{ id: ChatTabKey; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'humano', label: 'Humano' },
  { id: 'bot', label: 'Bot' },
  { id: 'pendiente', label: 'Pend.' },
];

export function ChatList({
  chats,
  selectedId,
  onSelect,
  tab,
  onTab,
  search,
  onSearch,
  unread,
  live,
  phonesPendingReview,
}: {
  chats: Chat[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  tab: ChatTabKey;
  onTab: (t: ChatTabKey) => void;
  search: string;
  onSearch: (s: string) => void;
  unread: number;
  live: boolean;
  phonesPendingReview: Set<string>;
}) {
  const searchNorm = search.trim().toLowerCase();
  const searchDigits = digitsOnly(search);

  const filtered = chats.filter((c) => {
    if (tab === 'humano' && c.status !== 'human') return false;
    if (tab === 'bot' && c.status !== 'bot') return false;
    if (tab === 'pendiente' && c.status !== 'pending') return false;
    if (searchNorm) {
      const nameMatch = c.name.toLowerCase().includes(searchNorm);
      const phoneMatch =
        searchDigits.length > 0 && digitsOnly(c.phone).includes(searchDigits);
      if (!nameMatch && !phoneMatch) return false;
    }
    return true;
  });

  const countFor = (t: ChatTabKey) => {
    if (t === 'todos') return chats.length;
    if (t === 'humano') return chats.filter((c) => c.status === 'human').length;
    if (t === 'bot') return chats.filter((c) => c.status === 'bot').length;
    return chats.filter((c) => c.status === 'pending').length;
  };

  return (
    <div className={styles.list}>
      <div className={styles.listHead}>
        <div className={styles.listTop}>
          <span className={styles.listTitle}>
            <Icon.MessageCircle size={16} />
            Conversaciones
            {unread > 0 && <span className={styles.unreadPill}>{unread}</span>}
          </span>
          <span className={styles.live} title="Actualización automática">
            <span className={`${styles.liveDot} ${live ? styles.on : ''}`} />
            En vivo
          </span>
        </div>

        <div className="input-search">
          <Icon.Search size={14} />
          <input
            placeholder="Buscar nombre o teléfono…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.active : ''}`}
              onClick={() => onTab(t.id)}
            >
              {t.label}
              <span className={styles.tabCount}>{countFor(t.id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.items}>
        {filtered.length === 0 ? (
          <div className={styles.placeholder} style={{ minHeight: 120 }}>
            <span style={{ fontSize: 12.5 }}>
              {chats.length === 0
                ? 'No hay conversaciones todavía.'
                : 'Sin resultados para este filtro.'}
            </span>
          </div>
        ) : (
          filtered.map((c) => (
            <ChatListItem
              key={c.id}
              chat={c}
              active={selectedId === c.id}
              pendingReview={phonesPendingReview.has(digitsOnly(c.phone))}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ChatListItem({
  chat,
  active,
  pendingReview,
  onClick,
}: {
  chat: Chat;
  active: boolean;
  pendingReview: boolean;
  onClick: () => void;
}) {
  const meta = statusMeta(chat.status);
  return (
    <button
      type="button"
      className={`${styles.item} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <Avatar initials={initialsOf(chat.name)} size={36} />
      <div className={styles.itemBody}>
        <div className={styles.itemTop}>
          <span className={styles.itemName}>{shortName(chat.name)}</span>
          <span className={styles.itemTime}>{chat.time}</span>
        </div>
        <div
          className={`${styles.itemPreview} ${chat.unread > 0 ? styles.unreadLine : ''}`}
        >
          {chat.last}
        </div>
        <div className={styles.itemTags}>
          {pendingReview && (
            <span
              className={`${styles.statusChip} ${styles.rewardChip}`}
              title="El cliente envió pantallazo de reseña. Abre el chat para aprobar el postre."
            >
              <Icon.Cake size={11} />
              Reseña
            </span>
          )}
          {meta && (
            <span className={`${styles.statusChip} ${styles[meta.className]}`}>
              <span className={styles.statusDot} />
              {meta.label}
            </span>
          )}
          {chat.unread > 0 && <span className={styles.itemUnread}>{chat.unread}</span>}
        </div>
      </div>
    </button>
  );
}
