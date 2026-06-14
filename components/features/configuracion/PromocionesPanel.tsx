'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP, type Product } from '@/lib/data';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import {
  useProducts,
  usePromotions,
  useCreatePromotion,
  usePatchPromotion,
  useArchivePromotion,
} from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import type { Promotion, PromotionKind, DiscountType, CreatePromotionBody } from '@/lib/api';
import styles from './configuracion.module.css';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percent: '% off', fixed: '$ off', free_item: 'Item gratis', two_for_one: '2 × 1',
};

/** Panel "Promociones": se aplican automáticamente al carrito del cliente. */
export function PromocionesPanel() {
  const { data: productsData } = useProducts();
  const products: Product[] = productsData ?? [];

  const { data: promotionsData, isLoading } = usePromotions(true);
  const createPromo = useCreatePromotion();
  const patchPromo = usePatchPromotion();
  const archivePromo = useArchivePromotion();

  const all = promotionsData ?? [];
  const active = all.filter(p => !p.archived);
  const archived = all.filter(p => p.archived);

  const [tab, setTab] = useState<'activas' | 'archivadas'>('activas');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Promotion | null>(null);

  const togglePromoActive = (p: Promotion) => patchPromo.mutate({ id: p.id, body: { active: !p.active } });

  const handleSubmit = async (d: PromoFormDraft) => {
    try {
      if (editing) {
        await patchPromo.mutateAsync({ id: editing.id, body: draftToBody(d) });
        pushToast({ kind: 'success', message: `Promoción "${d.name}" actualizada.` });
      } else {
        await createPromo.mutateAsync(draftToBody(d));
        pushToast({ kind: 'success', message: `Promoción "${d.name}" creada.` });
      }
      setOpen(false);
      setEditing(null);
    } catch {
      /* toast lo emite la mutation */
    }
  };

  const handleArchive = async () => {
    if (!confirmArchive) return;
    try {
      await archivePromo.mutateAsync(confirmArchive.id);
      pushToast({ kind: 'success', message: `Promoción "${confirmArchive.name}" archivada.` });
    } catch {
      /* toast */
    } finally {
      setConfirmArchive(null);
    }
  };

  const handleRestore = (p: Promotion) => {
    patchPromo.mutate({ id: p.id, body: { archived: false } }, {
      onSuccess: () => pushToast({ kind: 'success', message: `Promoción "${p.name}" reactivada (pausada).` }),
    });
  };

  const shown = tab === 'activas' ? active : archived;

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <div className={styles.cardTitle}><Icon.Percent size={15} /> Promociones</div>
            <div className={styles.cardSub}>Se aplican automáticamente al carrito del cliente.</div>
          </div>
          <button className="btn btn-primary sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Icon.Plus size={13} /> Nueva promoción
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <Tabs
            tabs={[{ id: 'activas', label: `Activas (${active.length})` }, { id: 'archivadas', label: `Archivadas (${archived.length})` }]}
            value={tab}
            onChange={id => setTab(id as 'activas' | 'archivadas')}
          />

          {isLoading && <div className={styles.loading}>Cargando promociones…</div>}

          {!isLoading && shown.length === 0 && (
            <div className={styles.loading}>
              {tab === 'activas' ? 'Aún no hay promociones activas. Tocá Nueva promoción para crear una.' : 'No hay promociones archivadas.'}
            </div>
          )}

          <div className={styles.promoGrid} style={{ marginTop: 14 }}>
            {shown.map(p => (
              <div key={p.id} className={`${styles.promoCard}${p.archived ? ` ${styles.dim}` : ''}`}>
                <div className={styles.promoMark}>{markFor(p)}</div>
                <div>
                  <div className={styles.promoTitle}>{p.name}</div>
                  <div className={styles.promoDesc}>{summarize(p, products)}</div>
                </div>
                <div className={styles.promoMeta}>
                  <span className={`chip sm ${p.archived ? '' : p.active ? 'tone-green' : ''}`}>
                    {p.archived ? 'Archivada' : p.active ? 'Activa' : 'Pausada'}
                  </span>
                  <div className={styles.promoActions}>
                    {p.archived ? (
                      <button className="btn btn-ghost sm" onClick={() => handleRestore(p)} disabled={patchPromo.isPending}>
                        <Icon.Check size={12} /> Reactivar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`${styles.switch}${p.active ? ` ${styles.on}` : ''}`}
                          onClick={() => togglePromoActive(p)}
                          aria-pressed={p.active}
                          aria-label={`Activar promoción ${p.name}`}
                        />
                        <button className="iconbtn" onClick={() => { setEditing(p); setOpen(true); }} aria-label={`Editar ${p.name}`}>
                          <Icon.Edit size={14} />
                        </button>
                        <button className="iconbtn" style={{ color: 'var(--coral)' }} onClick={() => setConfirmArchive(p)} aria-label={`Archivar ${p.name}`} title="Archivar promoción">
                          <Icon.X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {open && (
        <PromoFormModal
          editing={editing}
          products={products}
          submitting={createPromo.isPending || patchPromo.isPending}
          onSave={handleSubmit}
          onClose={() => { setOpen(false); setEditing(null); }}
        />
      )}

      {confirmArchive && (
        <Modal
          open
          onClose={() => setConfirmArchive(null)}
          title="Archivar promoción"
          sub="Sale del admin y deja de aplicarse al carrito, pero queda guardada."
          size="sm"
          footer={
            <>
              <button className="btn" onClick={() => setConfirmArchive(null)} disabled={archivePromo.isPending}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={handleArchive} disabled={archivePromo.isPending}>
                <Icon.X size={13} /> {archivePromo.isPending ? 'Archivando…' : 'Archivar'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 14 }}>¿Archivar <strong>{confirmArchive.name}</strong>?</p>
          <p className={styles.subtle} style={{ marginTop: 10 }}>
            Se desactiva y desaparece de la lista activa. Los pedidos pasados conservan el descuento. Podés reactivarla después.
          </p>
        </Modal>
      )}
    </div>
  );
}

function markFor(p: Promotion): string {
  switch (p.discount_type) {
    case 'percent': return `${p.discount_value}%`;
    case 'fixed': return `−$${Math.round(p.discount_value / 1000)}k`;
    case 'free_item': return 'FREE';
    case 'two_for_one': return '2×1';
  }
}

function summarize(p: Promotion, products: Product[]): string {
  const dt = DISCOUNT_TYPE_LABELS[p.discount_type];
  const productNames = (p.config.product_ids ?? [])
    .map(id => products.find(x => x.id === id)?.name)
    .filter(Boolean) as string[];
  const productsText = productNames.length
    ? productNames.length <= 2 ? `en ${productNames.join(' y ')}` : `en ${productNames.length} productos`
    : 'en todo el carrito';

  if (p.kind === 'product') return `${dt} ${productsText}`;
  const days = (p.config.weekdays ?? []).map(d => DAY_LABELS[d]).join(', ');
  const window = p.config.starts_hhmm && p.config.ends_hhmm ? ` ${p.config.starts_hhmm}-${p.config.ends_hhmm}` : '';
  return `${dt} ${productsText} · ${days}${window}`;
}

interface PromoFormDraft {
  kind: PromotionKind;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_subtotal: number;
  product_ids: string[];
  weekdays: number[];
  starts_hhmm: string;
  ends_hhmm: string;
  active: boolean;
}

function draftToBody(d: PromoFormDraft): CreatePromotionBody {
  return {
    kind: d.kind,
    name: d.name,
    description: d.description,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    min_subtotal: d.min_subtotal,
    config: {
      product_ids: d.product_ids.length > 0 ? d.product_ids : undefined,
      weekdays: d.kind === 'weekday' ? d.weekdays : undefined,
      starts_hhmm: d.kind === 'weekday' && d.starts_hhmm ? d.starts_hhmm : undefined,
      ends_hhmm: d.kind === 'weekday' && d.ends_hhmm ? d.ends_hhmm : undefined,
    },
    active: d.active,
  };
}

function PromoFormModal({
  editing, products, submitting, onSave, onClose,
}: {
  editing: Promotion | null;
  products: Product[];
  submitting: boolean;
  onSave: (draft: PromoFormDraft) => void;
  onClose: () => void;
}) {
  const isEdit = !!editing;

  const [kind, setKind] = useState<PromotionKind>(editing?.kind ?? 'product');
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(editing?.discount_type ?? 'percent');
  const [discountValue, setDiscountValue] = useState(editing ? String(editing.discount_value) : '10');
  const [minSubtotal, setMinSubtotal] = useState(editing ? String(editing.min_subtotal) : '0');
  const [productIds, setProductIds] = useState<string[]>(editing?.config.product_ids ?? []);
  const [weekdays, setWeekdays] = useState<number[]>(editing?.config.weekdays ?? []);
  const [startsHhmm, setStartsHhmm] = useState(editing?.config.starts_hhmm ?? '');
  const [endsHhmm, setEndsHhmm] = useState(editing?.config.ends_hhmm ?? '');
  const [active, setActive] = useState(editing?.active ?? true);

  const requiresValue = discountType === 'percent' || discountType === 'fixed';
  const valueNum = parseInt(discountValue.replace(/[^\d]/g, ''), 10);
  const minNum = parseInt(minSubtotal.replace(/[^\d]/g, ''), 10) || 0;

  const canSave =
    !submitting &&
    name.trim().length > 0 &&
    (!requiresValue || (valueNum > 0 && (discountType !== 'percent' || valueNum <= 100))) &&
    (kind === 'weekday' ? weekdays.length > 0 : productIds.length > 0);

  const toggleProduct = (id: string) => setProductIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const toggleWeekday = (d: number) => setWeekdays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]));

  const submit = () => {
    if (!canSave) return;
    const cleanDesc = description.trim();
    onSave({
      kind,
      name: name.trim(),
      description: cleanDesc ? cleanDesc : null,
      discount_type: discountType,
      discount_value: requiresValue ? valueNum : 0,
      min_subtotal: minNum,
      product_ids: productIds,
      weekdays,
      starts_hhmm: startsHhmm,
      ends_hhmm: endsHhmm,
      active,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar promoción' : 'Nueva promoción'}
      sub={isEdit ? 'Editá los datos y guardá los cambios.' : 'Las promociones se aplican automáticamente al carrito.'}
      size="lg"
      footer={
        <>
          <button className="btn" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={!canSave}>
            <Icon.Check size={13} /> {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </>
      }
    >
      <div className={styles.col} style={{ gap: 14 }}>
        <div className={styles.col}>
          <span className={styles.label}>Tipo de promoción</span>
          <div className={styles.chipWrap}>
            <button type="button" className={`${styles.chipPick}${kind === 'product' ? ` ${styles.sel}` : ''}`} onClick={() => setKind('product')}>🥪 Por producto</button>
            <button type="button" className={`${styles.chipPick}${kind === 'weekday' ? ` ${styles.sel}` : ''}`} onClick={() => setKind('weekday')}>📅 Por día</button>
          </div>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Nombre</span>
          <input className="input" placeholder={kind === 'product' ? 'Ej. 20% off Pastrami' : 'Ej. Jueves cerveza 2×1'} value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Descripción <span className={styles.subtle}>(opcional, se muestra al cliente)</span></span>
          <textarea
            className="input"
            rows={2}
            maxLength={500}
            placeholder={kind === 'product' ? 'Descuento especial sobre nuestros sándwiches premium' : 'Cerveza Club Colombia 2 por 1 todos los jueves de 6 a 11pm.'}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.col}>
            <span className={styles.label}>Tipo de descuento</span>
            <select className="select" value={discountType} onChange={e => setDiscountType(e.target.value as DiscountType)}>
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Monto fijo ($)</option>
              <option value="free_item">Item gratis (el más barato elegible)</option>
              <option value="two_for_one">2×1</option>
            </select>
          </div>
          {requiresValue && (
            <div className={styles.col}>
              <span className={styles.label}>{discountType === 'percent' ? '% de descuento' : 'Descuento (COP)'}</span>
              <input className="input" inputMode="numeric" placeholder={discountType === 'percent' ? '15' : '5000'} value={discountValue} onChange={e => setDiscountValue(e.target.value.replace(/[^\d]/g, ''))} />
              {discountType === 'fixed' && valueNum > 0 && <span className={styles.subtle} style={{ fontFamily: 'var(--font-mono)' }}>{COP(valueNum)}</span>}
            </div>
          )}
        </div>

        <div className={styles.col}>
          <span className={styles.label}>Mínimo de subtotal <span className={styles.subtle}>(opcional, 0 = sin mínimo)</span></span>
          <input className="input" inputMode="numeric" placeholder="0" value={minSubtotal} onChange={e => setMinSubtotal(e.target.value.replace(/[^\d]/g, ''))} />
          {minNum > 0 && <span className={styles.subtle} style={{ fontFamily: 'var(--font-mono)' }}>{COP(minNum)}</span>}
        </div>

        {kind === 'weekday' && (
          <>
            <div className={styles.col}>
              <span className={styles.label}>Días de la semana</span>
              <div className={styles.chipWrap}>
                {DAY_LABELS.map((d, i) => (
                  <button key={i} type="button" className={`${styles.chipPick}${weekdays.includes(i) ? ` ${styles.sel}` : ''}`} onClick={() => toggleWeekday(i)}>{d}</button>
                ))}
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={styles.col}>
                <span className={styles.label}>Hora inicio (opcional)</span>
                <input className="input" type="time" value={startsHhmm} onChange={e => setStartsHhmm(e.target.value)} />
              </div>
              <div className={styles.col}>
                <span className={styles.label}>Hora fin (opcional)</span>
                <input className="input" type="time" value={endsHhmm} onChange={e => setEndsHhmm(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className={styles.col}>
          <span className={styles.label}>Productos elegibles{kind === 'product' ? '' : <span className={styles.subtle}> (opcional)</span>}</span>
          <div className={`${styles.chipWrap} ${styles.chipScroll}`}>
            {products.length === 0 && <span className={styles.subtle}>No hay productos cargados todavía.</span>}
            {products.map(p => (
              <button key={p.id} type="button" className={`${styles.chipPick}${productIds.includes(p.id) ? ` ${styles.sel}` : ''}`} onClick={() => toggleProduct(p.id)}>{p.name}</button>
            ))}
          </div>
        </div>

        <label className={styles.checkRow} style={{ justifyContent: 'space-between' }}>
          <div className={styles.col} style={{ gap: 2 }}>
            <b style={{ fontSize: 13.5 }}>Activa</b>
            <span className={styles.subtle}>Si la pausás, no se aplica al carrito pero queda guardada.</span>
          </div>
          <button type="button" className={`${styles.switch}${active ? ` ${styles.on}` : ''}`} onClick={() => setActive(a => !a)} aria-pressed={active} aria-label="Activa" />
        </label>
      </div>
    </Modal>
  );
}
