'use client';

import { Icon } from '@/lib/icons';
import { COP, type Chat } from '@/lib/data';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { useChatTakeover } from '@/lib/queries';
import { shortName, zoneLabel } from './helpers';
import styles from './whatsapp.module.css';

export function ContextPanel({ chat }: { chat: Chat }) {
  const takeover = useChatTakeover();
  const botPaused = chat.status === 'human';

  return (
    <div className={styles.context}>
      <div className={styles.ctxHead}>
        <Avatar initials={initialsOf(chat.name)} size={52} />
        <div>
          <div className={styles.ctxName}>{shortName(chat.name)}</div>
          <div className={styles.ctxZone}>
            <Icon.MapPin size={12} />
            {zoneLabel(chat.zone)}
          </div>
        </div>
        {!botPaused && (
          <button
            type="button"
            className={`btn btn-primary sm ${styles.fullBtn}`}
            onClick={() => takeover.mutate(chat.id)}
            disabled={takeover.isPending}
          >
            {takeover.isPending ? (
              'Tomando…'
            ) : (
              <>
                <Icon.User size={13} />
                Tomar conversación
              </>
            )}
          </button>
        )}
      </div>

      <div className={styles.ctxBody}>
        <section className={styles.ctxSection}>
          <span className={styles.ctxLabel}>Historial del cliente</span>
          <div className={styles.metric}>
            <span className={styles.metricLbl}>Pedidos previos</span>
            <span className={styles.metricBig}>{chat.prevOrders}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLbl}>Ticket promedio</span>
            <span className={styles.metricVal}>
              {chat.avgTicket ? COP(chat.avgTicket) : '—'}
            </span>
          </div>
        </section>

        <section className={styles.ctxSection}>
          <span className={styles.ctxLabel}>Contacto</span>
          <div className={styles.metric}>
            <span className={styles.metricLbl}>Teléfono</span>
            <span className={styles.metricVal} style={{ fontSize: 12.5 }}>
              {chat.phone}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
