'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP, ZONES, type Customer } from '@/lib/data';
import { useCustomers } from '@/lib/queries';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Chip';
import { StatGrid, StatCard } from '@/components/ui/Stat';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/Feedback';
import styles from './clientes.module.css';

type CustomerTag = Customer['tag'];
const TAGS = ['Todos', 'Nuevo', 'Recurrente', 'VIP'] as const;
type TagKey = (typeof TAGS)[number];

const TAG_TONE: Record<CustomerTag, 'green' | 'sun' | 'coral' | 'active' | undefined> = {
  VIP: 'sun',
  Recurrente: 'green',
  Nuevo: undefined,
};

const ZONE_BY_ID = new Map(ZONES.map((z) => [z.id, z]));
function zoneLabel(zone: string): string {
  return ZONE_BY_ID.get(zone)?.name ?? zone;
}
function zoneColor(zone: string): string {
  return ZONE_BY_ID.get(zone)?.color ?? 'var(--text-muted)';
}

/** Formato relativo (zona Bogotá): "Hoy 14:32" · "Ayer 19:08" · "Hace 3d" · "07 jun". */
function formatUltimo(iso: string | null): { text: string; kind: 'today' | 'recent' | 'old' | 'never' } {
  if (!iso) return { text: 'Sin pedidos', kind: 'never' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { text: 'Sin pedidos', kind: 'never' };
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDay) / dayMs);
  const hhmm = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 0) return { text: `Hoy ${hhmm}`, kind: 'today' };
  if (diffDays === 1) return { text: `Ayer ${hhmm}`, kind: 'recent' };
  if (diffDays > 1 && diffDays < 30) return { text: `Hace ${diffDays}d`, kind: 'recent' };
  return { text: d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), kind: 'old' };
}

export function ClientesScreen() {
  const [tag, setTag] = useState<TagKey>('Todos');
  const [search, setSearch] = useState('');

  // El backend acepta filtro por tag/search, pero filtramos en cliente para
  // mantener los KPIs y los contadores de chips estables (basados en el total).
  const { data, isLoading, error, isFetching } = useCustomers();
  const all = useMemo<Customer[]>(() => data ?? [], [data]);

  const counts = useMemo(() => {
    const c = { Todos: all.length, Nuevo: 0, Recurrente: 0, VIP: 0 } as Record<TagKey, number>;
    for (const cu of all) c[cu.tag] += 1;
    return c;
  }, [all]);

  const kpis = useMemo(() => {
    const total = all.length;
    const recurrentes = counts.Recurrente;
    const vips = counts.VIP;
    const conPedidos = all.filter((c) => c.pedidos > 0);
    const ticketProm =
      conPedidos.length > 0
        ? Math.round(conPedidos.reduce((s, c) => s + c.ticket, 0) / conPedidos.length)
        : 0;
    return {
      total,
      recurrentesPct: total > 0 ? Math.round((recurrentes / total) * 100) : 0,
      vipsPct: total > 0 ? Math.round((vips / total) * 100) : 0,
      ticketProm,
    };
  }, [all, counts]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((c) => {
      if (tag !== 'Todos' && c.tag !== tag) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, tag, search]);

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Cliente',
      render: (c) => (
        <div className={styles.who}>
          <Avatar initials={initialsOf(c.name)} size={32} />
          <div className={styles.whoText}>
            <span className={styles.whoName}>{c.name}</span>
            <span className={styles.phone}>{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'place',
      label: 'Dirección',
      render: (c) => (
        <div className={styles.place}>
          <span className={styles.addr} title={c.addr}>{c.addr}</span>
          <span className={styles.zoneRow}>
            <span className={styles.zoneDot} style={{ background: zoneColor(c.zone) }} />
            {zoneLabel(c.zone)}
          </span>
        </div>
      ),
    },
    {
      key: 'pedidos',
      label: 'Pedidos',
      num: true,
      render: (c) => (
        <span className={`${styles.count}${c.pedidos === 0 ? ` ${styles.countZero}` : ''}`}>
          {c.pedidos}
        </span>
      ),
    },
    {
      key: 'ticket',
      label: 'Ticket prom.',
      num: true,
      render: (c) =>
        c.pedidos > 0 ? (
          <span className={styles.ticket}>{COP(c.ticket)}</span>
        ) : (
          <span className={styles.ticketEmpty}>—</span>
        ),
    },
    {
      key: 'ultimo',
      label: 'Último pedido',
      render: (c) => {
        const u = formatUltimo(c.ultimo);
        const cls =
          u.kind === 'never'
            ? styles.lastNever
            : u.kind === 'old'
              ? `${styles.last} ${styles.lastMuted}`
              : styles.last;
        return <span className={cls}>{u.text}</span>;
      },
    },
    {
      key: 'tag',
      label: 'Etiqueta',
      render: (c) => <Tag tone={TAG_TONE[c.tag]}>{c.tag}</Tag>,
    },
  ];

  const meta = error ? (
    <span className={styles.err}>Error al cargar</span>
  ) : isLoading ? (
    <span className={styles.resultMeta}>Cargando…</span>
  ) : (
    <span className={styles.live}>
      <span className={`${styles.liveDot}${isFetching ? ` ${styles.on}` : ''}`} />
      {rows.length} {rows.length === 1 ? 'cliente' : 'clientes'}
      {rows.length !== all.length ? ` · de ${all.length}` : ''}
    </span>
  );

  const empty = error ? (
    <EmptyState
      icon={<Icon.Users size={22} />}
      title="No se pudieron cargar los clientes"
      sub="Revisa tu conexión con el backend e inténtalo de nuevo."
    />
  ) : isLoading ? (
    <ClientesTableSkeleton />
  ) : (
    <EmptyState
      icon={<Icon.Users size={22} />}
      title={
        search || tag !== 'Todos'
          ? 'Sin coincidencias'
          : 'Todavía no hay clientes'
      }
      sub={
        search || tag !== 'Todos'
          ? 'Ajusta el filtro o limpia la búsqueda.'
          : 'Aparecerán al hacer su primer pedido o iniciar un chat por WhatsApp.'
      }
    />
  );

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Clientes"
        sub="Directorio de quienes han pedido o escrito por WhatsApp"
      />

      <StatGrid cols={4} dataTour="clientes-kpis">
        <StatCard value={kpis.total} label="Clientes totales" />
        <StatCard value={kpis.recurrentesPct} unit="%" label="Recurrentes (2–10 pedidos)" />
        <StatCard value={kpis.vipsPct} unit="%" label="VIP (>10 pedidos)" />
        <StatCard
          value={kpis.ticketProm > 0 ? COP(kpis.ticketProm) : '—'}
          label="Ticket promedio"
        />
      </StatGrid>

      <div className={styles.controls}>
        <div className={styles.tagChips}>
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip sm${tag === t ? ' tone-active' : ''} ${styles.tagChip}`}
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
            >
              {t}
              <span className={styles.tagCount}>{counts[t]}</span>
            </button>
          ))}
        </div>
        <div className="input-search" style={{ width: 240 }}>
          <Icon.Search size={16} />
          <input
            placeholder="Nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar cliente por nombre o teléfono"
          />
        </div>
      </div>

      <Panel title="Directorio" meta={meta} noPad dataTour="clientes-directorio">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          empty={empty}
        />
      </Panel>
    </div>
  );
}

function ClientesTableSkeleton() {
  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Skeleton width={32} height={32} radius={999} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width={`${40 + (i % 3) * 12}%`} height={12} />
            <Skeleton width={110} height={10} />
          </div>
          <Skeleton width={120} height={12} />
          <Skeleton width={36} height={12} />
          <Skeleton width={70} height={12} />
          <Skeleton width={64} height={20} radius={999} />
        </div>
      ))}
    </div>
  );
}
