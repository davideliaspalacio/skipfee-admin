'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Icon } from '@/lib/icons';
import { STATUSES, ZONES, type StatusId } from '@/lib/data';
import { useMe, useOrders, useUpdateOrderStatus } from '@/lib/queries';
import { normalizeRole, visibleStatusIds } from '@/lib/roles';
import { OrderCard, DraggableOrderCard } from './OrderCard';
import { KanbanColumn } from './KanbanColumn';
import styles from './pedidos.module.css';

const MAX_PER_COLUMN = 8;

export function Kanban({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: orders, error, isFetching } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const ordersList = orders ?? [];

  const role = normalizeRole(useMe().data?.role);
  const allowedStatusIds = visibleStatusIds(role);
  const visibleStatuses = STATUSES.filter((s) => allowedStatusIds.includes(s.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const q = query.trim().toLowerCase().replace(/^#/, '');
  const filtered = ordersList.filter((o) => {
    if (zoneFilter !== 'all' && o.zone !== zoneFilter) return false;
    if (!q) return true;
    return String(o.number).includes(q) || o.cliente.toLowerCase().includes(q) || o.phone.includes(q);
  });
  const byStatus = (st: StatusId) => {
    const all = filtered.filter((o) => o.status === st);
    return { items: all.slice(0, MAX_PER_COLUMN), total: all.length };
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const fromId = String(e.active.id);
    const toStatus = e.over?.id as StatusId | undefined;
    if (!toStatus) return;
    const order = ordersList.find((o) => o.id === fromId);
    // Sin pagar = no se arrastra. Mismo estado = no-op.
    if (!order || order.unpaid || order.status === toStatus) return;
    updateStatus.mutate({ id: fromId, status: toStatus });
  };

  const activeOrder = activeId ? ordersList.find((o) => o.id === activeId) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headLeft}>
          <div className="input-search" style={{ width: 230 }}>
            <Icon.Search size={16} />
            <input
              placeholder="Buscar #pedido, cliente…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar pedido"
            />
          </div>
          <div className={styles.filters}>
            <button
              type="button"
              className={`chip sm${zoneFilter === 'all' ? ' tone-active' : ''}`}
              onClick={() => setZoneFilter('all')}
            >
              Todas las zonas
            </button>
            {ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                className={`chip sm${zoneFilter === z.id ? ' tone-active' : ''}`}
                onClick={() => setZoneFilter(z.id)}
              >
                <span className={styles.swatch} style={{ background: z.color }} />
                {z.name}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <span className={styles.err}>Error: {error.message}</span>
        ) : (
          <span className={styles.live}>
            <span className={`${styles.liveDot}${isFetching ? ` ${styles.on}` : ''}`} />
            En vivo · arrastra para cambiar estado
          </span>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className={styles.board}>
          {visibleStatuses.map((st) => {
            const { items, total } = byStatus(st.id);
            const headerAction =
              st.id === 'empacado' && total > 0 ? (
                <button
                  type="button"
                  className="btn btn-ghost sm"
                  onClick={() => router.push('/despachos')}
                  title="Organizar las rutas de estos pedidos en Despachos"
                >
                  <Icon.Route size={11} />
                  Rutas
                </button>
              ) : null;
            return (
              <KanbanColumn key={st.id} status={st} total={total} count={items.length} headerAction={headerAction}>
                {items.map((o) =>
                  o.unpaid ? (
                    <OrderCard key={o.id} order={o} selected={selectedId === o.id} onClick={() => onSelect(o.id)} />
                  ) : (
                    <DraggableOrderCard key={o.id} order={o} selected={selectedId === o.id} onClick={() => onSelect(o.id)} />
                  ),
                )}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>{activeOrder ? <OrderCard order={activeOrder} variant="overlay" /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
