'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/Feedback';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { COP } from '@/lib/data';
import {
  useTables,
  useCreateTable,
  usePatchTable,
  useDeleteTable,
  useOpenTabs,
  useOpenTableTab,
} from '@/lib/queries';
import type { DiningTable } from '@/lib/api/tables';
import type { Tab } from '@/lib/api/tabs';
import { pushToast } from '@/lib/toast';
import { TabDrawer } from './TabDrawer';
import styles from './salon.module.css';

const STOREFRONT_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'https://tienda.skipfee.co';

function qrUrlFor(token: string): string {
  return `${STOREFRONT_BASE}/mesa?t=${token}`;
}

/**
 * Pantalla "Salón": mesas del local con su cuenta abierta (en vivo) y el QR de
 * autoservicio. Desde acá el mesero abre una cuenta, agrega ítems y manda a cocina.
 */
export function SalonScreen() {
  const { data: tables, isLoading, isError } = useTables(true);
  const { data: tabs } = useOpenTabs();
  const [creating, setCreating] = useState(false);
  const [drawer, setDrawer] = useState<{ orderId: string; tableCode: string | null } | null>(null);

  const tabByTable = new Map<string, Tab>();
  for (const t of tabs ?? []) if (t.tableId) tabByTable.set(t.tableId, t);

  const active = (tables ?? []).filter(t => !t.archived);
  const archived = (tables ?? []).filter(t => t.archived);
  const porCobrar = active.filter(t => tabByTable.get(t.id)?.status === 'por_cobrar').length;
  const ocupadas = active.filter(t => {
    const tb = tabByTable.get(t.id);
    return !!tb && tb.status !== 'por_cobrar';
  }).length;
  const libres = Math.max(0, active.length - ocupadas - porCobrar);

  return (
    <div className={styles.wrap}>
      <PageHeader title="Salón" sub="Mesas del local, cuentas abiertas y su QR de autoservicio." />

      <div className={styles.toolbar}>
        <span className={styles.count}>
          {libres} libre{libres === 1 ? '' : 's'} · {ocupadas} ocupada{ocupadas === 1 ? '' : 's'} · {porCobrar} por cobrar
        </span>
        <button className="btn btn-primary sm" onClick={() => setCreating(true)}>
          <Icon.Plus size={13} /> Nueva mesa
        </button>
      </div>

      {isLoading && <div className={styles.muted}>Cargando mesas…</div>}
      {isError && <div className={styles.muted}>No se pudieron cargar las mesas.</div>}
      {tables && active.length === 0 && (
        <div className={styles.empty}>Todavía no hay mesas. Creá la primera con “Nueva mesa”.</div>
      )}

      <div className={styles.grid}>
        {active.map(t => (
          <TableCard
            key={t.id}
            table={t}
            tab={tabByTable.get(t.id)}
            onOpenDrawer={(orderId, tableCode) => setDrawer({ orderId, tableCode })}
          />
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Mesas archivadas</div>
          <div className={styles.grid}>
            {archived.map(t => <ArchivedTableCard key={t.id} table={t} />)}
          </div>
        </>
      )}

      {creating && <TableFormModal onClose={() => setCreating(false)} />}
      {drawer && (
        <TabDrawer orderId={drawer.orderId} tableCode={drawer.tableCode} onClose={() => setDrawer(null)} />
      )}
    </div>
  );
}

function TableCard({
  table,
  tab,
  onOpenDrawer,
}: {
  table: DiningTable;
  tab?: Tab;
  onOpenDrawer: (orderId: string, tableCode: string | null) => void;
}) {
  const patch = usePatchTable();
  const del = useDeleteTable();
  const openTab = useOpenTableTab();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const url = qrUrlFor(table.qrToken);

  function copy() {
    if (!navigator.clipboard) {
      pushToast({ kind: 'error', message: 'Copia no disponible en este navegador' });
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => pushToast({ kind: 'success', message: `Link de la mesa ${table.code} copiado` }),
      () => pushToast({ kind: 'error', message: 'No se pudo copiar' }),
    );
  }

  function regen() {
    patch.mutate(
      { id: table.id, body: { regenerateQr: true } },
      { onSuccess: () => pushToast({ kind: 'success', message: 'QR regenerado (el anterior deja de servir)' }) },
    );
  }

  const state: 'libre' | 'ocupada' | 'cobrar' = tab
    ? tab.status === 'por_cobrar'
      ? 'cobrar'
      : 'ocupada'
    : 'libre';
  const statePill = state === 'libre' ? styles.pillLibre : state === 'cobrar' ? styles.pillCobrar : styles.pillOcupada;
  const stateLabel = state === 'libre' ? 'Libre' : state === 'cobrar' ? 'Por cobrar' : 'Ocupada';

  return (
    <div className={`${styles.card} ${state === 'cobrar' ? styles.cardCobrar : tab ? styles.cardActive : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.codeWrap}>
          <span className={styles.code}>{table.code}</span>
          <span className={`${styles.statusPill} ${statePill}`}>{stateLabel}</span>
        </div>
        <div className={styles.actions}>
          <button className="iconbtn" title="Editar mesa" aria-label="Editar mesa" onClick={() => setEditing(true)}>
            <Icon.Edit size={14} />
          </button>
          <button className="iconbtn" title="Archivar mesa" aria-label="Archivar mesa" onClick={() => setConfirmOpen(true)} disabled={del.isPending}>
            <Icon.X size={15} />
          </button>
        </div>
      </div>

      <div className={styles.meta}>
        {table.label && <span className={styles.metaItem}>{table.label}</span>}
        {table.area && <span className={styles.metaItem}><Icon.MapPin size={11} /> {table.area}</span>}
        <span className={styles.metaItem}><Icon.Users size={11} /> {table.seats}</span>
      </div>

      <div className={styles.tabRow}>
        {tab ? (
          <button className="btn btn-primary sm" onClick={() => onOpenDrawer(tab.orderId, table.code)}>
            <Icon.Receipt size={13} /> Cuenta · {tab.itemCount} ít. · {COP(tab.total)}
            {tab.status === 'por_cobrar' ? ' · por cobrar' : ''}
          </button>
        ) : (
          <button
            className="btn btn-ghost sm"
            onClick={() => openTab.mutate({ tableId: table.id }, { onSuccess: t => onOpenDrawer(t.orderId, table.code) })}
            disabled={openTab.isPending}
          >
            <Icon.Plus size={12} /> {openTab.isPending ? 'Abriendo…' : 'Abrir cuenta'}
          </button>
        )}
      </div>

      <div className={styles.qrBox}>
        <div className={styles.qrLabel}>QR de autoservicio</div>
        <code className={styles.qrUrl} title={url}>{url}</code>
        <div className={styles.qrActions}>
          <button className="btn btn-ghost sm" onClick={copy}><Icon.Copy size={12} /> Copiar link</button>
          <button className="btn btn-ghost sm" onClick={regen} disabled={patch.isPending}>
            <Icon.Sparkles size={12} /> {patch.isPending ? 'Regenerando…' : 'Regenerar'}
          </button>
        </div>
      </div>

      {editing && <TableFormModal table={table} onClose={() => setEditing(false)} />}

      <Modal
        open={confirmOpen}
        onClose={() => { if (!del.isPending) setConfirmOpen(false); }}
        title="Archivar mesa"
        sub="Dejará de aparecer en el salón."
        size="sm"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={() => del.mutate(table.id, { onSuccess: () => setConfirmOpen(false) })} disabled={del.isPending}>
              <Icon.X size={13} /> {del.isPending ? 'Archivando…' : 'Archivar'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14 }}>¿Seguro que querés archivar la mesa <strong>{table.code}</strong>?</p>
      </Modal>
    </div>
  );
}

function ArchivedTableCard({ table }: { table: DiningTable }) {
  const patch = usePatchTable();
  return (
    <div className={`${styles.card} ${styles.cardArchived}`}>
      <div className={styles.cardTop}>
        <span className={styles.code}>{table.code}</span>
        <button className="btn btn-ghost sm" onClick={() => patch.mutate({ id: table.id, body: { archived: false } })} disabled={patch.isPending}>
          <Icon.Check size={12} /> {patch.isPending ? 'Restaurando…' : 'Reactivar'}
        </button>
      </div>
      {table.area && <div className={styles.muted}>{table.area}</div>}
    </div>
  );
}

function TableFormModal({ table, onClose }: { table?: DiningTable; onClose: () => void }) {
  const create = useCreateTable();
  const patch = usePatchTable();
  const editing = !!table;

  const [code, setCode] = useState(table?.code ?? '');
  const [label, setLabel] = useState(table?.label ?? '');
  const [area, setArea] = useState(table?.area ?? '');
  const [seats, setSeats] = useState(String(table?.seats ?? 4));

  const pending = create.isPending || patch.isPending;
  const canSave = code.trim().length > 0 && !pending;

  function save() {
    const seatsNum = Math.max(1, Math.min(50, parseInt(seats, 10) || 4));
    if (editing && table) {
      patch.mutate(
        { id: table.id, body: { code: code.trim(), label: label.trim() || null, area: area.trim() || null, seats: seatsNum } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(
        {
          code: code.trim(),
          ...(label.trim() ? { label: label.trim() } : {}),
          ...(area.trim() ? { area: area.trim() } : {}),
          seats: seatsNum,
        },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <Modal
      open
      onClose={() => { if (!pending) onClose(); }}
      title={editing ? `Editar mesa ${table.code}` : 'Nueva mesa'}
      sub="Código corto (ej. M5), zona y capacidad."
      size="sm"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={pending}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={!canSave}>
            {pending ? 'Guardando…' : editing ? 'Guardar' : 'Crear mesa'}
          </button>
        </>
      }
    >
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Código</span>
          <input className="input" value={code} maxLength={20} placeholder="M5" onChange={e => setCode(e.target.value)} autoFocus />
        </label>
        <label className={styles.field}>
          <span>Capacidad</span>
          <input className="input" type="number" min={1} max={50} value={seats} onChange={e => setSeats(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Nombre (opcional)</span>
          <input className="input" value={label} maxLength={60} placeholder="Terraza 2" onChange={e => setLabel(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Zona (opcional)</span>
          <input className="input" value={area} maxLength={60} placeholder="Terraza" onChange={e => setArea(e.target.value)} />
        </label>
      </div>
    </Modal>
  );
}
