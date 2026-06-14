'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useProducts, useSettings, usePatchSettings } from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import styles from './configuracion.module.css';

/**
 * Panel "Categorías": edita la lista oficial de categorías (tabs del Catálogo +
 * dropdown del modal de producto). Reordenar (subir/bajar), agregar y quitar.
 * Las categorías huérfanas (productos con .cat fuera de la lista) se listan aparte.
 */
export function CategoriasPanel() {
  const { data: settings } = useSettings();
  const { data: productsData } = useProducts();
  const patch = usePatchSettings();
  const [draft, setDraft] = useState('');

  const products = productsData ?? [];
  const officialCats = useMemo(() => settings?.categories ?? [], [settings]);

  const countByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.cat, (map.get(p.cat) ?? 0) + 1);
    return map;
  }, [products]);

  const orphanCats = useMemo(() => {
    const officialSet = new Set(officialCats);
    const found = new Set<string>();
    for (const p of products) if (p.cat && !officialSet.has(p.cat)) found.add(p.cat);
    return Array.from(found);
  }, [products, officialCats]);

  if (!settings) return <div className={styles.card}><div className={styles.loading}>Cargando categorías…</div></div>;

  const saveCats = (cats: string[], msg: string) => {
    patch.mutate({ categories: cats }, {
      onSuccess: () => pushToast({ kind: 'success', message: msg }),
    });
  };

  const addCategory = () => {
    const name = draft.trim();
    if (!name) return;
    if (officialCats.some(c => c.toLowerCase() === name.toLowerCase())) {
      pushToast({ kind: 'error', message: `"${name}" ya está en la lista.` });
      return;
    }
    patch.mutate({ categories: [...officialCats, name] }, {
      onSuccess: () => { pushToast({ kind: 'success', message: `Categoría "${name}" agregada.` }); setDraft(''); },
    });
  };

  const removeCategory = (name: string) => {
    const count = countByCat.get(name) ?? 0;
    if (count > 0) {
      pushToast({ kind: 'error', message: `"${name}" tiene ${count} ${count === 1 ? 'producto' : 'productos'}. Reasigná o archivá esos productos antes de eliminar la categoría.` });
      return;
    }
    saveCats(officialCats.filter(c => c !== name), `Categoría "${name}" eliminada.`);
  };

  const adoptCategory = (name: string) => saveCats([...officialCats, name], `"${name}" agregada a la lista oficial.`);

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= officialCats.length) return;
    const next = [...officialCats];
    [next[idx], next[j]] = [next[j], next[idx]];
    saveCats(next, 'Orden actualizado.');
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}><Icon.Tag size={15} /> Categorías</div>
          <div className={styles.cardSub}>Aparecen como tabs en el Catálogo y como dropdown al crear un producto. Para eliminar una categoría primero hay que mover o archivar los productos que la usan.</div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.flexInput}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder="Ej. Burgers"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !patch.isPending && draft.trim()) { e.preventDefault(); addCategory(); } }}
            maxLength={60}
          />
          <button className="btn btn-primary" onClick={addCategory} disabled={!draft.trim() || patch.isPending}>
            <Icon.Plus size={13} /> Agregar
          </button>
        </div>

        <div className={styles.col} style={{ gap: 7 }}>
          {officialCats.length === 0 && <div className={styles.subtle} style={{ padding: 8 }}>Sin categorías. Agregá la primera arriba.</div>}
          {officialCats.map((cat, idx) => {
            const count = countByCat.get(cat) ?? 0;
            const blocked = count > 0;
            return (
              <div key={cat} className={styles.catRow}>
                <div className="flex" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="flex" style={{ display: 'flex', flexDirection: 'column' }}>
                    <button className="iconbtn" onClick={() => move(idx, -1)} disabled={idx === 0 || patch.isPending} aria-label="Subir" style={{ width: 22, height: 18 }}>
                      <Icon.ArrowUp size={12} />
                    </button>
                    <button className="iconbtn" onClick={() => move(idx, 1)} disabled={idx === officialCats.length - 1 || patch.isPending} aria-label="Bajar" style={{ width: 22, height: 18 }}>
                      <Icon.ArrowDown size={12} />
                    </button>
                  </div>
                  <b>{cat}</b>
                </div>
                <span className={styles.catCount}>{count} {count === 1 ? 'producto' : 'productos'}</span>
                <button
                  className="iconbtn"
                  onClick={() => removeCategory(cat)}
                  disabled={patch.isPending}
                  title={blocked ? `Tiene ${count} ${count === 1 ? 'producto' : 'productos'}. Movelos o archivalos antes de eliminar.` : 'Eliminar categoría'}
                  style={blocked ? { opacity: 0.4, color: 'var(--coral)' } : { color: 'var(--coral)' }}
                  aria-label={`Eliminar ${cat}`}
                >
                  <Icon.X size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {orphanCats.length > 0 && (
          <div className={styles.col} style={{ gap: 7, marginTop: 4 }}>
            <div className={styles.sectionTag}>Categorías sueltas</div>
            <span className={styles.hint}>Estas categorías aparecen porque hay productos que las usan, pero no están en la lista oficial. Adoptalas para administrarlas desde acá.</span>
            {orphanCats.map(cat => {
              const count = countByCat.get(cat) ?? 0;
              return (
                <div key={cat} className={styles.catRow}>
                  <b>{cat}</b>
                  <span className={styles.catCount}>{count} {count === 1 ? 'producto' : 'productos'}</span>
                  <button className="btn btn-ghost sm" onClick={() => adoptCategory(cat)} disabled={patch.isPending}>
                    <Icon.Plus size={11} /> Adoptar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
