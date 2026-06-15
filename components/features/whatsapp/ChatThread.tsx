'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import type { Chat, ChatMessage } from '@/lib/data';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { useChatMessages } from '@/lib/queries';
import { RewardBanner } from './RewardBanner';
import { Composer } from './Composer';
import {
  statusMeta,
  windowState,
  windowColor,
  formatWindowLeft,
} from './helpers';
import styles from './whatsapp.module.css';

interface OptimisticMessage extends ChatMessage {
  _optimistic: true;
  _key: string;
}

export function ChatThread({ chat }: { chat: Chat }) {
  const { data: serverMessages } = useChatMessages(chat.id);
  const messages = useMemo<ChatMessage[]>(() => serverMessages ?? [], [serverMessages]);

  // Burbujas optimistas: se muestran apenas el operador envía y se descartan en
  // cuanto el poll de 2s trae un mensaje saliente que las cubre.
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  // Línea base de salientes que el servidor YA tenía al empezar a enviar. Solo
  // descartamos burbujas optimistas cuando el server SUPERA esta base — no contra
  // el conteo absoluto de 'out' (que en chats con historial las borraría al instante).
  const baselineOutRef = useRef(0);
  const keySeqRef = useRef(0);
  useEffect(() => {
    setOptimistic([]);
    baselineOutRef.current = 0;
  }, [chat.id]);
  useEffect(() => {
    if (optimistic.length === 0) return;
    const serverOut = messages.filter((m) => m.who === 'out').length;
    const confirmed = serverOut - baselineOutRef.current;
    if (confirmed > 0) {
      setOptimistic((prev) => prev.slice(confirmed));
      baselineOutRef.current = serverOut;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const allMessages = useMemo<Array<ChatMessage & { _key: string }>>(() => {
    const base = messages.map((m, i) => ({ ...m, _key: `s${i}` }));
    return [...base, ...optimistic];
  }, [messages, optimistic]);

  // Scroll al fondo al cambiar de chat o al entrar mensajes.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.id, allMessages.length]);

  const meta = statusMeta(chat.status);
  const botPaused = chat.status === 'human';

  // Ventana de 24h calculada desde la hora del último intercambio del chat.
  const win = useMemo(() => windowState(chat.time), [chat.time]);
  const fillColor = windowColor(win.fraction);

  const pushOptimistic = (msg: { text: string; mediaUrl?: string }) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;
    setOptimistic((prev) => {
      if (prev.length === 0) {
        baselineOutRef.current = messages.filter((m) => m.who === 'out').length;
      }
      return [
        ...prev,
        {
          who: 'out',
          text: msg.text,
          time,
          mediaUrl: msg.mediaUrl ?? null,
          _optimistic: true,
          _key: `o${keySeqRef.current++}`,
        },
      ];
    });
  };

  return (
    <div className={styles.thread}>
      <div className={styles.threadHead}>
        <div className={styles.threadHeadLeft}>
          <Avatar initials={initialsOf(chat.name)} size={34} />
          <div>
            <div className={styles.threadName}>{chat.name}</div>
            <div className={styles.threadPhone}>{chat.phone}</div>
          </div>
        </div>
        {meta && (
          <span className={`${styles.statusChip} ${styles[meta.className]}`}>
            <span className={styles.statusDot} />
            {meta.label}
          </span>
        )}
      </div>

      <div className={styles.window} title="Ventana de mensajería de 24h">
        <span className={styles.windowMeta}>
          <Icon.Clock size={12} />
          {win.closed ? (
            <span className={styles.windowClosed}>Ventana cerrada</span>
          ) : (
            formatWindowLeft(win.minutesLeft)
          )}
        </span>
        <span className={styles.track}>
          <span
            className={styles.trackFill}
            style={{ width: `${Math.round(win.fraction * 100)}%`, background: fillColor }}
          />
        </span>
      </div>

      <RewardBanner phone={chat.phone} />

      <div className={styles.body} ref={bodyRef}>
        <div className={styles.daySep}>Hoy</div>
        {allMessages.map((m) => {
          const who = m.who === 'in' ? 'in' : m.who === 'bot' ? 'bot' : 'out';
          const optimisticFlag = (m as OptimisticMessage)._optimistic === true;
          return (
            <div
              key={m._key}
              className={`${styles.bub} ${styles[who]} ${optimisticFlag ? styles.pending : ''}`}
            >
              {m.mediaUrl && (
                <a href={m.mediaUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.bubImg} src={m.mediaUrl} alt="Adjunto" />
                </a>
              )}
              {m.text && <span>{m.text}</span>}
              <span className={styles.bubTime}>
                {m.time}
                {m.who === 'bot' && ' · Bot'}
              </span>
            </div>
          );
        })}
      </div>

      <Composer chatId={chat.id} botPaused={botPaused} onOptimistic={pushOptimistic} />
    </div>
  );
}
