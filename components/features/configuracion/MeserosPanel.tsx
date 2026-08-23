'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { useWaiters, useCreateWaiter, usePatchWaiter, useDeleteWaiter } from '@/lib/queries';
import type { Waiter } from '@/lib/api/waiters';
import styles from './configuracion.module.css';

/**
 * Panel "Meseros": equipo del salón. Se asignan a las cuentas de mesa y atienden
 * los pedidos presenciales. Mismo patrón de soft-delete que Cocineros.
 */
export function MeserosPanel() {
  const { data: waiters, isLoading, isError } = useWaiters(true);
  const [creating, setCreating] = useState(false);

  const active = (waiters ?? []).filter(w => !w.archived);
  const archived = (waiters ?? []).filter(w => w.archived);

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.User size={15} /> Meseros</div>
            <div className={styles.cardSub}>El equipo del salón. Se asignan a las cuentas de mesa y atienden los pedidos presenciales.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => setCreating(v => !v)}>
            <Icon.Plus size={13} /> Nuevo mesero
          </button>
        </div>
        {creating && <WaiterCreateForm onClose={() => setCreating(false)} />}
        {isLoading && <div className={styles.loading}>Cargando meseros…</div>}
        {isError && <div className={styles.loading}>No se pudieron cargar los meseros.</div>}
        {waiters && active.length === 0 && !creating && <div className={styles.loading}>No hay meseros activos. Agregá el primero.</div>}
      </div>

      {active.map(w => <WaiterCard key={w.id} waiter={w} />)}

      {archived.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Meseros archivados</div>
              <div className={styles.cardSub}>No aparecen para asignar. Podés reactivarlos cuando quieras.</div>
            </div>
          </div>
          {archived.map(w => <WaiterArchivedRow key={w.id} waiter={w} />)}
        </div>
      )}
    </div>
  );
}

function WaiterCard({ waiter }: { waiter: Waiter }) {
  const patch = usePatchWaiter();
  const del = useDeleteWaiter();
  const [name, setName] = useState(waiter.name);
  const [phone, setPhone] = useState(waiter.phone ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const nameDirty = name.trim() !== waiter.name && name.trim().length > 0;
  const phoneDirty = (phone.trim() || null) !== (waiter.phone ?? null);
  const dirty = nameDirty || phoneDirty;

  function save() {
    patch.mutate({
      id: waiter.id,
      body: {
        ...(nameDirty ? { name: name.trim() } : {}),
        ...(phoneDirty ? { phone: phone.trim() || null } : {}),
      },
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cookHead}>
        <div className={styles.cookIdent}>
          <Avatar initials={initialsOf(name || waiter.name)} size={30} />
          <input className="input" value={name} maxLength={60} onChange={e => setName(e.target.value)} aria-label="Nombre del mesero" style={{ maxWidth: 220 }} />
          <input className="input" value={phone} maxLength={30} placeholder="Teléfono (opcional)" onChange={e => setPhone(e.target.value)} aria-label="Teléfono del mesero" style={{ maxWidth: 180 }} />
        </div>
        <div className="flex" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {dirty && (
            <button className="btn btn-primary sm" onClick={save} disabled={patch.isPending}>
              <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          )}
          <button className="iconbtn" onClick={() => setConfirmOpen(true)} disabled={del.isPending} title="Archivar mesero" aria-label="Archivar mesero">
            <Icon.X size={15} />
          </button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => { if (!del.isPending) setConfirmOpen(false); }}
        title="Archivar mesero"
        sub="Dejará de aparecer para asignar."
        size="sm"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={() => del.mutate(waiter.id, { onSuccess: () => setConfirmOpen(false) })} disabled={del.isPending}>
              <Icon.X size={13} /> {del.isPending ? 'Archivando…' : 'Archivar'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14 }}>¿Seguro que querés archivar a <strong>{waiter.name}</strong>?</p>
        <p className={styles.subtle} style={{ marginTop: 10 }}>Las cuentas que ya atendió conservan su registro. Podés reactivarlo después.</p>
      </Modal>
    </div>
  );
}

function WaiterArchivedRow({ waiter }: { waiter: Waiter }) {
  const patch = usePatchWaiter();
  return (
    <div className={styles.zoneArchived}>
      <Avatar initials={initialsOf(waiter.name)} size={26} />
      <b>{waiter.name}</b>
      <div className={styles.spacer} />
      <button className="btn btn-ghost sm" onClick={() => patch.mutate({ id: waiter.id, body: { archived: false } })} disabled={patch.isPending}>
        <Icon.Check size={12} /> {patch.isPending ? 'Restaurando…' : 'Reactivar'}
      </button>
    </div>
  );
}

function WaiterCreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateWaiter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const canSave = name.trim().length > 0 && !create.isPending;

  const save = () => {
    create.mutate(
      { name: name.trim(), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      { onSuccess: () => { setName(''); setPhone(''); onClose(); } },
    );
  };

  return (
    <div className={styles.createRow} style={{ gridTemplateColumns: '1fr 1fr auto' }}>
      <input className="input" placeholder="Nombre del mesero" value={name} maxLength={60} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && canSave) save(); }} aria-label="Nombre del mesero nuevo" />
      <input className="input" placeholder="Teléfono (opcional)" value={phone} maxLength={30} onChange={e => setPhone(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && canSave) save(); }} aria-label="Teléfono del mesero nuevo" />
      <div className="flex" style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary sm" onClick={save} disabled={!canSave}>{create.isPending ? 'Creando…' : 'Crear'}</button>
        <button className="btn btn-ghost sm" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
