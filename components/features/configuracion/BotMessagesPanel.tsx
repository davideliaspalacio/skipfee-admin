'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useBotMessages } from '@/lib/queries';
import { Modal } from '@/components/ui/Modal';
import { FLOW_NODES, BOT_SECTIONS } from '@/lib/botFlow';
import type { BotMessage } from '@/lib/api/botMessages';
import { BotFlowDiagram } from './BotFlowDiagram';
import { MessageEditCard } from './MessageEditCard';
import styles from './configuracion.module.css';

type Selection = { kind: 'node' | 'section'; id: string } | null;

/**
 * Panel "Mensajes del bot": diagrama del flujo + secciones para los mensajes que
 * no son parte del flujo lineal. Al tocar un nodo/sección abre un modal con el
 * editor de cada mensaje (preview tipo WhatsApp incluido).
 */
export function BotMessagesPanel() {
  const { data, isLoading, isError } = useBotMessages();
  const [sel, setSel] = useState<Selection>(null);

  const messages: BotMessage[] = useMemo(() => data ?? [], [data]);

  const selected = useMemo(() => {
    if (!sel) return null;
    if (sel.kind === 'node') {
      const node = FLOW_NODES.find(n => n.id === sel.id);
      if (!node) return null;
      const items = messages.filter(m => m.category === 'conversacion' && m.step !== null && node.steps.includes(m.step));
      return { title: node.title, sub: 'Mensajes de este paso del flujo.', items };
    }
    const section = BOT_SECTIONS.find(s => s.id === sel.id);
    if (!section) return null;
    return { title: section.title, sub: section.sub, items: messages.filter(m => section.match(m.category, m.step)) };
  }, [sel, messages]);

  if (isLoading) return <div className={styles.card}><div className={styles.loading}>Cargando mensajes del bot…</div></div>;
  if (isError) return <div className={styles.card}><div className={styles.loading}>No se pudieron cargar los mensajes del bot.</div></div>;

  const customizedCount = messages.filter(m => m.isCustomized).length;

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.Bot size={15} /> Flujo del bot</div>
            <div className={styles.cardSub}>
              Tocá un paso para ver y editar sus mensajes.{' '}
              {customizedCount > 0 ? `${customizedCount} personalizado${customizedCount === 1 ? '' : 's'}.` : 'Todos en su texto por defecto.'}
            </div>
          </div>
        </div>
        <BotFlowDiagram messages={messages} onSelect={id => setSel({ kind: 'node', id })} />
      </div>

      <div className={styles.botSections}>
        {BOT_SECTIONS.map(s => {
          const items = messages.filter(m => s.match(m.category, m.step));
          if (items.length === 0) return null;
          const custom = items.filter(m => m.isCustomized).length;
          return (
            <button key={s.id} type="button" className={styles.botSection} onClick={() => setSel({ kind: 'section', id: s.id })}>
              <div className={styles.botSecTop}>
                <b className={styles.botSecTitle}>{s.title}</b>
                <Icon.ArrowRight size={14} />
              </div>
              <span className={styles.subtle}>{s.sub}</span>
              <span className={styles.botSecCount}>
                {items.length} mensajes{custom > 0 ? ` · ${custom} personalizado${custom === 1 ? '' : 's'}` : ''}
              </span>
            </button>
          );
        })}
      </div>

      <Modal open={selected !== null} onClose={() => setSel(null)} title={selected?.title ?? ''} sub={selected?.sub} size="lg">
        <div className={styles.col} style={{ gap: 14 }}>
          {selected?.items.map(m => (
            <MessageEditCard key={`${m.key}:${m.updatedAt ?? 'def'}:${String(m.isCustomized)}`} msg={m} />
          ))}
          {selected && selected.items.length === 0 && <div className={styles.subtle}>No hay mensajes en esta sección.</div>}
        </div>
      </Modal>
    </div>
  );
}
