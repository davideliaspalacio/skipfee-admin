'use client';

import { Icon } from '@/lib/icons';
import { COP, STATUSES, ZONES, type StatusId } from '@/lib/data';
import { useIsDark } from '@/lib/hooks';
import { useOrder, useCooks, useAssignOrderCook, useUpdateOrderStatus, useSettings } from '@/lib/queries';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { StatusChip } from '@/components/ui/Chip';
import { RouteMap } from '@/components/ui/RouteMap';
import styles from './pedidos.module.css';

const STAGES: StatusId[] = ['nuevo', 'pagado', 'cocina', 'empacado', 'ruta', 'entregado'];

export function PedidoDetail({
  orderId,
  onClose,
  onOpenChat,
}: {
  orderId: string;
  onClose: () => void;
  onOpenChat: (phone: string) => void;
}) {
  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: cooks } = useCooks();
  const { data: settings } = useSettings();
  const assignCook = useAssignOrderCook();
  const updateStatus = useUpdateOrderStatus();
  const dark = useIsDark();

  const shell = (body: React.ReactNode, sub?: string) => (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-label="Detalle del pedido">
        <div className={styles.panelHead}>
          <div>
            <div className={styles.panelHeadId}>
              <span className={styles.num} style={{ fontSize: 14 }}>
                {order ? `#${order.number}` : 'Pedido'}
              </span>
              {order && <StatusChip status={order.status} />}
            </div>
            {sub && <div className={styles.panelSub}>{sub}</div>}
          </div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Cerrar">
            <Icon.X size={16} />
          </button>
        </div>
        <div className={styles.panelBody}>{body}</div>
      </aside>
    </>
  );

  if (isLoading && !order) {
    return shell(<div className={styles.sectionTitle}>Cargando detalles…</div>, 'Cargando…');
  }
  if (!order) {
    return shell(
      <div className={styles.err}>{error ? `Error: ${error.message}` : 'Este pedido no existe o fue eliminado.'}</div>,
      'No encontrado',
    );
  }

  const o = order;
  const idx = STAGES.indexOf(o.status);
  const zoneColor = ZONES.find((z) => z.id === o.zone)?.color ?? 'var(--green)';
  const deliveryFee = settings?.baseDeliveryFee ?? 4500;
  const subtotal = Math.max(0, o.total - deliveryFee - o.tip);
  const origin = {
    lat: Number.isFinite(settings?.localLat) ? (settings!.localLat as number) : 6.2447,
    lng: Number.isFinite(settings?.localLng) ? (settings!.localLng as number) : -75.5736,
    label: settings?.localLabel || 'Local',
  };

  const moveTo = (status: StatusId) => {
    if (o.unpaid || status === o.status) return;
    updateStatus.mutate({ id: o.id, status });
  };
  const nextStage = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  return shell(
    <>
      <section className={styles.section}>
        <span className={styles.sectionTitle}>Cliente</span>
        <div className={styles.custRow}>
          <Avatar initials={initialsOf(o.cliente || 'Cliente')} size={34} />
          <div>
            <b style={{ display: 'block', fontSize: 15 }}>{o.cliente || 'Sin nombre'}</b>
            <span className={styles.panelSub}>{o.phone}</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost sm" onClick={() => onOpenChat(o.phone)}>
          <Icon.MessageCircle size={13} />
          Abrir chat
        </button>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Cocinero asignado</span>
        <div className={styles.custRow}>
          {o.cookName && <Avatar initials={initialsOf(o.cookName)} size={30} />}
          <select
            className="select"
            value={o.cookId ?? ''}
            onChange={(e) => {
              const cookId = e.target.value || null;
              const cookName = cooks?.find((c) => c.id === cookId)?.name;
              assignCook.mutate({ id: o.id, cookId, cookName });
            }}
          >
            <option value="">Sin asignar</option>
            {cooks?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Entrega</span>
        <div style={{ fontSize: 13.5 }}>{o.address}</div>
        <span className={styles.panelSub}>{o.zoneName}</span>
        <RouteMap origin={origin} stops={[{ id: o.id, lat: o.lat, lng: o.lng }]} color={zoneColor} dark={dark} />
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Items</span>
        {o.itemList.length === 0 ? (
          <span className={styles.panelSub}>Sin productos</span>
        ) : (
          o.itemList.map((it, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.rowLbl}>{it}</span>
            </div>
          ))
        )}
        <div className={styles.totals}>
          <div className={styles.row}>
            <span className={styles.rowLbl}>Subtotal</span>
            <span className={styles.rowVal}>{COP(subtotal)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLbl}>Domicilio</span>
            <span className={styles.rowVal}>{COP(deliveryFee)}</span>
          </div>
          {o.tip > 0 && (
            <div className={styles.row}>
              <span className={styles.rowLbl}>Propina{o.tipPercent ? ` (${o.tipPercent}%)` : ''} 💛</span>
              <span className={styles.rowVal}>{COP(o.tip)}</span>
            </div>
          )}
          <div className={`${styles.row} ${styles.totalRow}`}>
            <span>Total</span>
            <span className={styles.rowVal}>{COP(o.total)}</span>
          </div>
        </div>
      </section>

      {o.note && (
        <section className={styles.section}>
          <span className={styles.sectionTitle}>Nota del cliente</span>
          <div className={styles.note}>“{o.note}”</div>
        </section>
      )}

      <section className={styles.section}>
        <span className={styles.sectionTitle}>Estado del pedido</span>
        <div className={styles.stepper}>
          {STAGES.map((s, i) => {
            const meta = STATUSES.find((x) => x.id === s)!;
            const state = i < idx ? 'done' : i === idx ? 'current' : '';
            return (
              <button
                key={s}
                type="button"
                className={`${styles.step}${state ? ` ${styles[state]}` : ''}`}
                disabled={o.unpaid || i === idx}
                onClick={() => moveTo(s)}
                title={o.unpaid ? 'Pedido sin pagar' : `Mover a ${meta.label}`}
              >
                <span className={styles.stepDot}>{i < idx ? '✓' : ''}</span>
                <b>{meta.label}</b>
                <span className="when">{i === idx ? 'Ahora' : i < idx ? '✓' : '—'}</span>
              </button>
            );
          })}
        </div>
      </section>

      {nextStage && !o.unpaid && (
        <button type="button" className="btn btn-primary" onClick={() => moveTo(nextStage)}>
          Avanzar a {STATUSES.find((x) => x.id === nextStage)!.label}
          <Icon.ArrowRight size={14} />
        </button>
      )}
    </>,
    `Hace ${o.minutos} min · ${o.paymentMethod}`,
  );
}
