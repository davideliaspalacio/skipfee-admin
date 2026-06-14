'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { Modal } from '@/components/ui/Modal';
import { Avatar, initialsOf } from '@/components/ui/Avatar';
import { useCooks, useCreateCook, usePatchCook, useDeleteCook } from '@/lib/queries';
import { isOpenNow, nextOpeningLabel, DAY_ORDER } from '@/lib/hours';
import type { Cook } from '@/lib/api/cooks';
import type { WeekHours } from '@/lib/api/settings';
import styles from './configuracion.module.css';

const DAY_LABELS: Record<string, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
  fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
};

function defaultWeek(): WeekHours {
  const out: WeekHours = {};
  for (const d of DAY_ORDER) out[d] = { closed: false, open: '11:00', close: '22:00' };
  return out;
}

function normalizeWeek(hours: WeekHours | null): WeekHours {
  const out: WeekHours = {};
  for (const d of DAY_ORDER) {
    if (hours && hours[d]) out[d] = { ...hours[d] };
    else if (hours) out[d] = { closed: true, open: '11:00', close: '22:00' };
    else out[d] = { closed: false, open: '11:00', close: '22:00' };
  }
  return out;
}

function cookKey(c: Cook): string {
  return `${c.id}:${c.name}:${JSON.stringify(c.hours)}`;
}

/**
 * Panel "Cocineros": lista editable de cocineros con su horario semanal. El
 * backend reparte los pedidos pagados entre los cocineros en turno con menos carga.
 */
export function CocinerosPanel() {
  const { data: cooks, isLoading, isError } = useCooks(true);
  const [creating, setCreating] = useState(false);

  const active = (cooks ?? []).filter(c => !c.archived);
  const archived = (cooks ?? []).filter(c => c.archived);

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.User size={15} /> Cocineros</div>
            <div className={styles.cardSub}>Definí quién cocina y su horario. Los pedidos pagados se reparten entre los cocineros en turno con menos carga.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => setCreating(v => !v)}>
            <Icon.Plus size={13} /> Nuevo cocinero
          </button>
        </div>
        {creating && <CookCreateForm onClose={() => setCreating(false)} />}
        {isLoading && <div className={styles.loading}>Cargando cocineros…</div>}
        {isError && <div className={styles.loading}>No se pudieron cargar los cocineros.</div>}
        {cooks && active.length === 0 && !creating && <div className={styles.loading}>No hay cocineros activos. Agregá el primero.</div>}
      </div>

      {active.map(c => <CookCard key={cookKey(c)} cook={c} />)}

      {archived.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>Cocineros archivados</div>
              <div className={styles.cardSub}>No reciben pedidos nuevos. Podés reactivarlos cuando quieras.</div>
            </div>
          </div>
          {archived.map(c => <CookArchivedRow key={c.id} cook={c} />)}
        </div>
      )}
    </div>
  );
}

function CookCard({ cook }: { cook: Cook }) {
  const patch = usePatchCook();
  const del = useDeleteCook();
  const saved = normalizeWeek(cook.hours);
  const [name, setName] = useState(cook.name);
  const [draft, setDraft] = useState<WeekHours>(() => saved);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const nameDirty = name.trim() !== cook.name && name.trim().length > 0;
  const hoursDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const dirty = nameDirty || hoursDirty;
  const enTurno = isOpenNow(saved, new Date());
  const opensLabel = nextOpeningLabel(saved, new Date());

  function toggleDay(d: string) {
    setDraft(prev => {
      const cur = prev[d as keyof WeekHours] ?? {};
      const isOpen = !cur.closed;
      return { ...prev, [d]: { closed: isOpen, open: cur.open ?? '11:00', close: cur.close ?? '22:00' } };
    });
  }
  function setTime(d: string, field: 'open' | 'close', value: string) {
    setDraft(prev => ({ ...prev, [d]: { ...prev[d as keyof WeekHours], [field]: value } }));
  }
  function save() {
    patch.mutate({
      cookId: cook.id,
      body: { ...(nameDirty ? { name: name.trim() } : {}), ...(hoursDirty ? { hours: draft } : {}) },
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.cookHead}>
        <div className={styles.cookIdent}>
          <Avatar initials={initialsOf(name || cook.name)} size={30} />
          <input className="input" value={name} maxLength={60} onChange={e => setName(e.target.value)} aria-label="Nombre del cocinero" style={{ maxWidth: 260 }} />
          <span className={`${styles.statusChip} ${enTurno ? styles.s_green : styles.s_red}`} title={enTurno ? 'Recibe pedidos ahora' : opensLabel ? `Abre ${opensLabel}` : 'Fuera de turno'}>
            <span className={styles.statusDot} /> {enTurno ? 'En turno' : 'Fuera de turno'}
          </span>
        </div>
        <div className="flex" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {dirty && (
            <button className="btn btn-primary sm" onClick={save} disabled={patch.isPending}>
              <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          )}
          <button className="iconbtn" onClick={() => setConfirmOpen(true)} disabled={del.isPending} title="Archivar cocinero" aria-label="Archivar cocinero">
            <Icon.X size={15} />
          </button>
        </div>
      </div>
      {DAY_ORDER.map(d => {
        const dh = draft[d] ?? { closed: true };
        const isOpen = !dh.closed;
        return (
          <div key={d} className={styles.dayRow}>
            <span className={styles.dayName}>{DAY_LABELS[d]}</span>
            <button type="button" className={`${styles.switch}${isOpen ? ` ${styles.on}` : ''}`} onClick={() => toggleDay(d)} aria-label={`${DAY_LABELS[d]} ${isOpen ? 'en turno' : 'libre'}`} />
            {isOpen ? (
              <div className={styles.timeRange}>
                <input type="time" className="input" style={{ width: 120 }} value={dh.open ?? '11:00'} onChange={e => setTime(d, 'open', e.target.value)} />
                <span className={styles.subtle}>a</span>
                <input type="time" className="input" style={{ width: 120 }} value={dh.close ?? '22:00'} onChange={e => setTime(d, 'close', e.target.value)} />
              </div>
            ) : (
              <span className={styles.subtle}>Libre</span>
            )}
          </div>
        );
      })}

      <Modal
        open={confirmOpen}
        onClose={() => { if (!del.isPending) setConfirmOpen(false); }}
        title="Archivar cocinero"
        sub="Dejará de recibir pedidos."
        size="sm"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={() => del.mutate(cook.id, { onSuccess: () => setConfirmOpen(false) })} disabled={del.isPending}>
              <Icon.X size={13} /> {del.isPending ? 'Archivando…' : 'Archivar'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14 }}>¿Seguro que querés archivar a <strong>{cook.name}</strong>?</p>
        <p className={styles.subtle} style={{ marginTop: 10 }}>
          Dejará de recibir asignaciones nuevas. Los pedidos que ya tiene en cocina los conserva, y podés reactivarlo después.
        </p>
      </Modal>
    </div>
  );
}

function CookArchivedRow({ cook }: { cook: Cook }) {
  const patch = usePatchCook();
  return (
    <div className={styles.zoneArchived}>
      <Avatar initials={initialsOf(cook.name)} size={26} />
      <b>{cook.name}</b>
      <div className={styles.spacer} />
      <button className="btn btn-ghost sm" onClick={() => patch.mutate({ cookId: cook.id, body: { archived: false } })} disabled={patch.isPending}>
        <Icon.Check size={12} /> {patch.isPending ? 'Restaurando…' : 'Reactivar'}
      </button>
    </div>
  );
}

function CookCreateForm({ onClose }: { onClose: () => void }) {
  const create = useCreateCook();
  const [name, setName] = useState('');
  const canSave = name.trim().length > 0 && !create.isPending;

  const save = () => {
    create.mutate({ name: name.trim(), hours: defaultWeek() }, { onSuccess: () => { setName(''); onClose(); } });
  };

  return (
    <div className={styles.createRow} style={{ gridTemplateColumns: '1fr auto' }}>
      <input
        className="input"
        placeholder="Nombre del cocinero"
        value={name}
        maxLength={60}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && canSave) save(); }}
        aria-label="Nombre del cocinero nuevo"
      />
      <div className="flex" style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary sm" onClick={save} disabled={!canSave}>{create.isPending ? 'Creando…' : 'Crear'}</button>
        <button className="btn btn-ghost sm" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
