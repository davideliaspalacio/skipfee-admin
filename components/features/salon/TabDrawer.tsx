'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import {
  useProducts,
  useTab,
  useAddTabItems,
  useSendTabKitchen,
  usePatchTab,
  useTabSplit,
  usePayTabCash,
} from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import styles from './salon.module.css';

const STOREFRONT_BASE =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'https://tienda.skipfee.co';

/**
 * Drawer de una cuenta de mesa: ítems (por enviar / en cocina), selector de
 * productos para armar rondas, y el panel de cobro (split): efectivo/datáfono
 * del mesero + link para que los comensales paguen su parte por Wompi.
 */
export function TabDrawer({
  orderId,
  tableCode,
  onClose,
}: {
  orderId: string;
  tableCode: string | null;
  onClose: () => void;
}) {
  const { data: tab, isLoading } = useTab(orderId);
  const { data: products } = useProducts();
  const addItems = useAddTabItems();
  const sendKitchen = useSendTabKitchen();
  const patch = usePatchTab();

  const [round, setRound] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');

  const available = (products ?? []).filter(p => p.available);
  const filtered = query.trim()
    ? available.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : available;

  const roundEntries = Object.entries(round).filter(([, q]) => q > 0);
  const roundCount = roundEntries.reduce((s, [, q]) => s + q, 0);
  const roundTotal = roundEntries.reduce((s, [pid, q]) => {
    const p = available.find(x => x.id === pid);
    return s + (p ? p.price * q : 0);
  }, 0);

  function inc(pid: string) {
    setRound(r => ({ ...r, [pid]: (r[pid] ?? 0) + 1 }));
  }
  function dec(pid: string) {
    setRound(r => {
      const n = (r[pid] ?? 0) - 1;
      const next = { ...r };
      if (n <= 0) delete next[pid];
      else next[pid] = n;
      return next;
    });
  }
  function addRound() {
    const items = roundEntries.map(([productId, qty]) => ({ productId, qty }));
    if (items.length === 0) return;
    addItems.mutate({ orderId, items }, { onSuccess: () => setRound({}) });
  }

  const pending = tab ? tab.items.filter(i => i.kitchenStatus === 'pendiente') : [];
  const inKitchen = tab ? tab.items.filter(i => i.kitchenStatus !== 'pendiente') : [];
  const closed = tab?.status === 'cerrada' || tab?.status === 'pagado';

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cuenta · Mesa ${tableCode ?? ''}`}
      sub={tab ? `${tab.itemCount} ítem(s) · ${COP(tab.total)}` : 'Cargando…'}
      size="lg"
      footer={
        <>
          <button className="btn" onClick={onClose}>Cerrar</button>
          {tab && !closed && (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => patch.mutate({ orderId, body: { status: 'por_cobrar' } })}
                disabled={patch.isPending || tab.status === 'por_cobrar'}
              >
                {tab.status === 'por_cobrar' ? 'Cuenta pedida' : 'Pedir la cuenta'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => sendKitchen.mutate(orderId)}
                disabled={sendKitchen.isPending || tab.pendingCount === 0}
              >
                <Icon.Send size={13} /> Enviar a cocina{tab.pendingCount ? ` (${tab.pendingCount})` : ''}
              </button>
            </>
          )}
        </>
      }
    >
      {isLoading && <div className={styles.muted}>Cargando cuenta…</div>}

      {tab && (
        <>
          <div className={styles.tabBody}>
            <div className={styles.tabItems}>
              {tab.items.length === 0 && (
                <div className={styles.muted}>Sin ítems todavía. Agregá productos abajo.</div>
              )}
              {pending.length > 0 && <div className={styles.tabGroupLabel}>Por enviar a cocina</div>}
              {pending.map(it => (
                <div key={it.id} className={styles.tabItemRow}>
                  <span className={styles.tabItemName}>{it.qty}× {it.name}</span>
                  <span className={styles.pendingTag}>pendiente</span>
                  <span className={styles.mono}>{COP(it.lineTotal)}</span>
                </div>
              ))}
              {inKitchen.length > 0 && <div className={styles.tabGroupLabel}>En cocina / servido</div>}
              {inKitchen.map(it => (
                <div key={it.id} className={styles.tabItemRow}>
                  <span className={styles.tabItemName}>{it.qty}× {it.name}</span>
                  <span className={styles.kitchenTag}>{it.kitchenStatus}</span>
                  <span className={styles.mono}>{COP(it.lineTotal)}</span>
                </div>
              ))}
              <div className={styles.tabTotalRow}>
                <span>Total</span>
                <span className={styles.mono}>{COP(tab.total)}</span>
              </div>
            </div>

            {!closed && (
              <div className={styles.picker}>
                <div className={styles.pickerHead}>
                  <input
                    className="input"
                    placeholder="Buscar producto…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  {roundCount > 0 && (
                    <button className="btn btn-primary sm" onClick={addRound} disabled={addItems.isPending}>
                      <Icon.Plus size={12} /> {addItems.isPending ? 'Agregando…' : `Agregar ${roundCount} · ${COP(roundTotal)}`}
                    </button>
                  )}
                </div>
                <div className={styles.pickerList}>
                  {filtered.map(p => (
                    <div key={p.id} className={styles.pickerRow}>
                      <span className={styles.pickerName}>{p.name}</span>
                      <span className={styles.mono}>{COP(p.price)}</span>
                      <div className={styles.stepper}>
                        <button className="iconbtn" onClick={() => dec(p.id)} disabled={!round[p.id]} aria-label="Quitar uno">–</button>
                        <span className={styles.qty}>{round[p.id] ?? 0}</span>
                        <button className="iconbtn" onClick={() => inc(p.id)} aria-label="Agregar uno">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <SplitPanel orderId={orderId} />
        </>
      )}
    </Modal>
  );
}

/** Cobro / split: efectivo-datáfono del mesero + link de pago Wompi por comensal. */
function SplitPanel({ orderId }: { orderId: string }) {
  const { data: split } = useTabSplit(orderId);
  const payCash = usePayTabCash();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'efectivo' | 'datafono'>('efectivo');

  if (!split) return null;

  const remaining = split.remaining;
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const canPay = amt > 0 && amt <= remaining && !payCash.isPending;
  const link = `${STOREFRONT_BASE}/mesa/cuenta?orderId=${orderId}`;
  const paid = split.shares.filter(s => s.status === 'pagado');

  function register() {
    payCash.mutate({ orderId, body: { amount: amt, method } }, { onSuccess: () => setAmount('') });
  }
  function copyLink() {
    if (!navigator.clipboard) {
      pushToast({ kind: 'error', message: 'Copia no disponible' });
      return;
    }
    navigator.clipboard.writeText(link).then(
      () => pushToast({ kind: 'success', message: 'Link de pago copiado' }),
      () => pushToast({ kind: 'error', message: 'No se pudo copiar' }),
    );
  }

  return (
    <div className={styles.splitPanel}>
      <div className={styles.splitHead}>
        <span>Cobro</span>
        <span className={styles.mono}>{COP(split.collected)} / {COP(split.total)}</span>
      </div>

      {split.fullyPaid ? (
        <div className={styles.splitDone}>✅ Cuenta saldada</div>
      ) : (
        <>
          <div className={styles.muted}>Falta {COP(remaining)}</div>
          <div className={styles.splitForm}>
            <input
              className="input"
              inputMode="numeric"
              placeholder="Monto"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              style={{ maxWidth: 120 }}
            />
            <select
              className="input"
              value={method}
              onChange={e => setMethod(e.target.value as 'efectivo' | 'datafono')}
              style={{ maxWidth: 130 }}
            >
              <option value="efectivo">Efectivo</option>
              <option value="datafono">Datáfono</option>
            </select>
            <button className="btn btn-primary sm" onClick={register} disabled={!canPay}>
              {payCash.isPending ? 'Registrando…' : 'Registrar'}
            </button>
          </div>
          <button className="btn btn-ghost sm" onClick={copyLink}>
            <Icon.Copy size={12} /> Copiar link para que paguen por Wompi
          </button>
        </>
      )}

      {paid.length > 0 && (
        <div className={styles.splitShares}>
          {paid.map(s => (
            <span key={s.id} className={styles.kitchenTag}>{s.method} · {COP(s.amount)}</span>
          ))}
        </div>
      )}
    </div>
  );
}
