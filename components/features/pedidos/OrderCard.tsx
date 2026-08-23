'use client';

import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { COP, ZONES, type Order } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { UrgencyChip } from '@/components/ui/Chip';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import styles from './pedidos.module.css';

export interface OrderCardProps extends HTMLAttributes<HTMLDivElement> {
  order: Order;
  selected?: boolean;
  dragging?: boolean;
  variant?: 'default' | 'overlay';
}

/** Tarjeta visual pura. Se compone con DraggableOrderCard para el dnd-kit. */
export const OrderCard = forwardRef<HTMLDivElement, OrderCardProps>(function OrderCard(
  { order, selected, dragging, variant = 'default', className = '', style, ...rest },
  ref,
) {
  const zoneColor = ZONES.find((z) => z.id === order.zone)?.color ?? 'var(--green)';
  const provider = order.channel?.provider ?? 'whatsapp';
  const showChannel = provider !== 'whatsapp';
  const cls = [
    styles.card,
    selected ? styles.selected : '',
    dragging && variant === 'default' ? styles.dragging : '',
    variant === 'overlay' ? styles.overlay : '',
    order.unpaid ? styles.unpaid : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={cls} style={style} {...rest}>
      <span className={styles.accent} style={{ background: zoneColor }} />
      <div className={styles.cardTop}>
        <div className={styles.cardTopLeft}>
          <span className={styles.num}>#{order.number}</span>
          {order.unpaid && <span className={styles.unpaidBadge}>Sin pagar</span>}
          {showChannel && <span className={styles.channelBadge}>{providerLabel(provider)}</span>}
        </div>
        <UrgencyChip minutes={order.minutos} />
      </div>
      <span className={styles.name}>{order.cliente}</span>
      <div className={styles.items}>{order.items}</div>
      <div className={styles.meta}>
        <span className={styles.price}>{COP(order.total)}</span>
        <span className={styles.zone}>
          <Icon.MapPin size={11} />
          {order.zoneName}
        </span>
      </div>
      {order.tip > 0 && (
        <div className={styles.tip}>
          💛 Propina {COP(order.tip)}
          {order.tipPercent ? ` · ${order.tipPercent}%` : ''}
        </div>
      )}
      {order.cookName && (
        <div className={styles.cook}>
          <Avatar initials={initialsOf(order.cookName)} size={16} />
          <span>{order.cookName}</span>
        </div>
      )}
    </div>
  );
});

function providerLabel(provider: string): string {
  if (provider === 'rappi') return 'Rappi';
  if (provider === 'didi') return 'DiDi';
  if (provider === 'storefront') return 'Tienda';
  if (provider === 'manual') return 'Manual';
  if (provider === 'ubereats') return 'Uber';
  if (provider === 'presencial') return 'Mesa';
  return provider;
}

/** Tarjeta arrastrable que se registra en el DndContext. */
export function DraggableOrderCard({
  order,
  selected,
  onClick,
}: {
  order: Order;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: order.id });
  const style: CSSProperties = { touchAction: 'manipulation' };
  return (
    <OrderCard
      ref={setNodeRef}
      order={order}
      selected={selected}
      dragging={isDragging}
      style={style}
      onClick={onClick}
      {...attributes}
      {...listeners}
    />
  );
}
