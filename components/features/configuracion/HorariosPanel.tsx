'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { useSettings, usePatchSettings } from '@/lib/queries';
import { isOpenNow, nextOpeningLabel, DAY_ORDER } from '@/lib/hours';
import { pushToast } from '@/lib/toast';
import type { Settings, WeekHours } from '@/lib/api/settings';
import styles from './configuracion.module.css';

const DAY_LABELS: Record<string, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
  fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
};

function normalizeHours(s: Settings): WeekHours {
  const out: WeekHours = {};
  for (const d of DAY_ORDER) {
    if (s.hours && s.hours[d]) out[d] = { ...s.hours[d] };
    else if (s.hours) out[d] = { closed: true, open: s.openHour, close: s.closeHour };
    else out[d] = s.openDays.includes(d) ? { closed: false, open: s.openHour, close: s.closeHour } : { closed: true, open: s.openHour, close: s.closeHour };
  }
  return out;
}

/** Panel "Horarios": estado abierto/cerrado + pausa manual + horario por día. */
export function HorariosPanel() {
  const { data: settings } = useSettings();
  if (!settings) return <div className={styles.card}><div className={styles.loading}>Cargando horarios…</div></div>;
  return <HorariosEditor key={settings.updatedAt} settings={settings} />;
}

function HorariosEditor({ settings }: { settings: Settings }) {
  const patch = usePatchSettings();
  const saved = normalizeHours(settings);
  const [draft, setDraft] = useState<WeekHours>(() => saved);
  const [windowDraft, setWindowDraft] = useState(() => String(settings.deliveredWindowHours));

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const windowParsed = Number.parseInt(windowDraft, 10);
  const windowValid = Number.isFinite(windowParsed) && windowParsed >= 1 && windowParsed <= 72;
  const windowDirty = windowValid && windowParsed !== settings.deliveredWindowHours;
  const paused = settings.ordersPaused;
  const openNow = !paused && isOpenNow(saved, new Date());
  const opensLabel = nextOpeningLabel(saved, new Date());

  const tone = paused ? 's_amber' : openNow ? 's_green' : 's_red';
  const statusText = paused ? 'Pedidos pausados' : openNow ? 'Abierto ahora' : 'Cerrado ahora';
  const statusSub = paused
    ? 'El bot no toma pedidos hasta que reactives.'
    : openNow
      ? 'El bot está tomando pedidos.'
      : `El bot avisa que está cerrado${opensLabel ? ` y abre ${opensLabel}` : ''}.`;

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

  return (
    <div className={styles.stack}>
      {/* Estado + pausa */}
      <div className={styles.card}>
        <div className={styles.statusBar}>
          <div className={styles.col} style={{ gap: 4 }}>
            <span className={`${styles.statusChip} ${styles[tone]}`}>
              <span className={styles.statusDot} /> {statusText}
            </span>
            <span className={styles.cardSub} style={{ marginTop: 0 }}>{statusSub}</span>
          </div>
          <label className={styles.toggleLabel}>
            <span className={styles.subtle}>Pausar pedidos</span>
            <button
              type="button"
              className={`${styles.switch}${paused ? ` ${styles.on}` : ''}`}
              onClick={() => {
                const next = !paused;
                patch.mutate({ ordersPaused: next });
                pushToast({ kind: next ? 'info' : 'success', message: next ? 'Pedidos pausados' : 'Pedidos reactivados' });
              }}
              aria-label="Pausar pedidos"
            />
          </label>
        </div>
      </div>

      {/* Horario por día */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.Clock size={15} /> Horario por día</div>
            <div className={styles.cardSub}>Definí apertura y cierre de cada día. Apagá los días que no atendés.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => patch.mutate({ hours: draft })} disabled={!dirty || patch.isPending}>
            <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar horario'}
          </button>
        </div>
        {DAY_ORDER.map(d => {
          const dh = draft[d] ?? { closed: true };
          const isOpen = !dh.closed;
          return (
            <div key={d} className={styles.dayRow}>
              <span className={styles.dayName}>{DAY_LABELS[d]}</span>
              <button type="button" className={`${styles.switch}${isOpen ? ` ${styles.on}` : ''}`} onClick={() => toggleDay(d)} aria-label={`${DAY_LABELS[d]} ${isOpen ? 'abierto' : 'cerrado'}`} />
              {isOpen ? (
                <div className={styles.timeRange}>
                  <input type="time" className="input" style={{ width: 120 }} value={dh.open ?? '11:00'} onChange={e => setTime(d, 'open', e.target.value)} />
                  <span className={styles.subtle}>a</span>
                  <input type="time" className="input" style={{ width: 120 }} value={dh.close ?? '22:00'} onChange={e => setTime(d, 'close', e.target.value)} />
                </div>
              ) : (
                <span className={styles.subtle}>Cerrado</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Visibilidad de entregados en el kanban */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}>Visibilidad en el kanban</div>
            <div className={styles.cardSub}>Por cuántas horas los pedidos entregados siguen apareciendo en su columna.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => patch.mutate({ deliveredWindowHours: windowParsed })} disabled={!windowDirty || patch.isPending}>
            <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        <div className={styles.row} style={{ borderBottom: 'none' }}>
          <label htmlFor="delivered-window-hours" style={{ fontSize: 13.5 }}>Mostrar entregados de las últimas</label>
          <input
            id="delivered-window-hours"
            type="number"
            min={1}
            max={72}
            className={`input ${styles.numSm}`}
            value={windowDraft}
            onChange={e => setWindowDraft(e.target.value)}
            aria-invalid={!windowValid}
          />
          <span className={styles.subtle}>horas (1–72)</span>
        </div>
      </div>
    </div>
  );
}
