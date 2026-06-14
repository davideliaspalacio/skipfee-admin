'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import type { Settings } from '@/lib/api';
import type { Survey } from '@/lib/api/surveys';
import { useSettings, usePatchSettings, useSurveys, useProducts } from '@/lib/queries';
import { DataTable, type Column } from '@/components/ui/DataTable';
import styles from './configuracion.module.css';

/**
 * Panel "Reseñas": configura la encuesta post-entrega + el regalo de postre, y
 * lista las calificaciones recibidas. La verificación del regalo se hace en el
 * chat del cliente (WhatsApp), no acá.
 */
export function ResenasPanel() {
  const { data: settings } = useSettings();
  return (
    <div className={styles.stack}>
      {settings ? (
        <ResenasConfig key={settings.updatedAt} settings={settings} />
      ) : (
        <div className={styles.card}><div className={styles.loading}>Cargando configuración…</div></div>
      )}
      <ResenasListado />
    </div>
  );
}

function fmt(dt: string): string {
  try {
    return new Date(dt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return dt;
  }
}

function ResenasConfig({ settings }: { settings: Settings }) {
  const patch = usePatchSettings();
  const { data: products } = useProducts();
  const [draft, setDraft] = useState({
    surveyEnabled: settings.surveyEnabled,
    surveyDelayMinutes: settings.surveyDelayMinutes,
    surveyMinDays: settings.surveyMinDays,
    reviewGiftEnabled: settings.reviewGiftEnabled,
    reviewGiftName: settings.reviewGiftName,
    reviewGiftExpiryDays: settings.reviewGiftExpiryDays,
    reviewGiftProductId: settings.reviewGiftProductId,
    reviewLink: settings.reviewLink,
  });

  const keys = Object.keys(draft) as Array<keyof typeof draft>;
  const dirty = keys.some(k => draft[k] !== settings[k]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}><Icon.Star size={15} /> Encuesta y regalo por reseña</div>
          <div className={styles.cardSub}>Tras entregar, el bot pregunta del 1 al 5. Con 4–5 invita a reseñar y regala un postre; con 1–3 pasa el chat a un humano.</div>
        </div>
        <button className="btn btn-primary sm" disabled={!dirty || patch.isPending} onClick={() => patch.mutate(draft)}>
          <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div className={styles.cardBody}>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={draft.surveyEnabled} onChange={e => setDraft({ ...draft, surveyEnabled: e.target.checked })} />
          <span><b>Enviar encuesta</b> de satisfacción tras entregar el pedido</span>
        </label>

        <div className={styles.flexInput}>
          <span style={{ fontSize: 13.5 }}>Enviar la encuesta</span>
          <input className={`input ${styles.numSm}`} type="number" min={1} max={1440} value={draft.surveyDelayMinutes} onChange={e => setDraft({ ...draft, surveyDelayMinutes: Number(e.target.value) })} aria-label="Minutos tras la entrega" />
          <span className={styles.subtle}>minutos después de entregar</span>
        </div>

        <div className={styles.flexInput}>
          <span style={{ fontSize: 13.5 }}>No repetir antes de</span>
          <input className={`input ${styles.numSm}`} type="number" min={0} max={365} value={draft.surveyMinDays} onChange={e => setDraft({ ...draft, surveyMinDays: Number(e.target.value) })} aria-label="Días mínimos entre encuestas" />
          <span className={styles.subtle}>días (0 = en cada pedido)</span>
        </div>

        <hr className={styles.divider} />

        <label className={styles.checkRow}>
          <input type="checkbox" checked={draft.reviewGiftEnabled} onChange={e => setDraft({ ...draft, reviewGiftEnabled: e.target.checked })} />
          <span><b>Regalar un postre</b> cuando el cliente deja la reseña</span>
        </label>

        <div className={styles.grid2}>
          <div className={styles.col}>
            <span className={styles.label}>Nombre del regalo</span>
            <input className="input" value={draft.reviewGiftName} maxLength={60} placeholder="Ej: Brownie" onChange={e => setDraft({ ...draft, reviewGiftName: e.target.value })} />
          </div>
          <div className={styles.col}>
            <span className={styles.label}>Vigencia (días)</span>
            <input className="input" type="number" min={1} max={365} value={draft.reviewGiftExpiryDays} onChange={e => setDraft({ ...draft, reviewGiftExpiryDays: Number(e.target.value) })} />
          </div>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Producto de regalo (se agrega al pedido a $0)</span>
          <select className="select" value={draft.reviewGiftProductId ?? ''} onChange={e => setDraft({ ...draft, reviewGiftProductId: e.target.value || null })}>
            <option value="">— Ninguno (solo aviso, sin línea en el pedido) —</option>
            {(products ?? []).map(p => (
              <option key={p.id} value={p.id}>{p.name} · {COP(p.price)}{p.available ? '' : ' (oculto del menú)'}</option>
            ))}
          </select>
          <span className={styles.hint}>Creá un producto de categoría “Regalo” a $0 en el Catálogo (conviene marcarlo como NO disponible) y elegilo acá. Saldrá como línea “Gratis” en el carrito.</span>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Link de reseña (Google Maps)</span>
          <input className="input" value={draft.reviewLink} placeholder="https://maps.app.goo.gl/…" onChange={e => setDraft({ ...draft, reviewLink: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function ResenasListado() {
  const { data: surveys, isLoading } = useSurveys(90);
  const items = surveys ?? [];
  const low = items.filter(s => s.rating <= 3).length;

  const columns: Column<Survey>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      render: s => (
        <div className={styles.col} style={{ gap: 2 }}>
          <b>{s.name ?? s.phone}</b>
          <span className={styles.subtle}>{s.phone}</span>
          {s.comment && <span className={styles.subtle}>“{s.comment}”</span>}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Calificación',
      render: s => (
        <span
          className={styles.statusChip}
          style={s.rating <= 3 ? { color: 'var(--coral)', background: 'oklch(0.7 0.18 25 / .16)' } : { color: 'var(--blue)', background: 'oklch(0.7 0.13 240 / .16)' }}
          title={`${s.rating} de 5`}
        >
          <span className={styles.stars}>{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</span> {s.rating}/5
        </span>
      ),
    },
    { key: 'respondedAt', label: 'Fecha', render: s => <span className={styles.subtle}>{fmt(s.respondedAt)}</span> },
    {
      key: 'chat',
      label: '',
      align: 'right',
      render: s => (
        <a className="btn btn-ghost sm" href={`/whatsapp?phone=${encodeURIComponent(s.phone)}`}>
          <Icon.MessageCircle size={12} /> Ver chat
        </a>
      ),
    },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>
            Reseñas y calificaciones
            {low > 0 && <span className={`chip sm tone-coral`} style={{ marginLeft: 8 }}>{low} baja{low === 1 ? '' : 's'}</span>}
          </div>
          <div className={styles.cardSub}>Calificaciones recibidas (últimos 90 días). Las bajas (1–3) las atiende un humano desde el chat.</div>
        </div>
      </div>
      <div style={{ padding: '4px 0' }}>
        {isLoading ? (
          <div className={styles.loading}>Cargando…</div>
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={s => s.id}
            empty={<div className={styles.loading}>Aún no hay calificaciones.</div>}
          />
        )}
      </div>
    </div>
  );
}
