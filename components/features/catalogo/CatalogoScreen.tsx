'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/data';
import { Icon } from '@/lib/icons';
import {
  useProducts,
  useSettings,
  usePatchProduct,
  useCreateProduct,
  useDeleteProduct,
  useUploadProductImage,
} from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { SectionTitle, EmptyState, Skeleton } from '@/components/ui/Feedback';
import { ProductCard } from './ProductCard';
import { ProductFormModal, type ProductFormDraft } from './ProductFormModal';
import styles from './catalogo.module.css';

// Fallback solo mientras settings carga; la lista real vive en
// settings.categories (Configuración → Categorías).
const DEFAULT_CATEGORIES = ['Sándwiches', 'Bebidas', 'Postres', 'Combos'];

export function CatalogoScreen() {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const { data: productsData, isLoading } = useProducts();
  const { data: settings } = useSettings();
  const patchProduct = usePatchProduct();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();

  const products = useMemo(() => productsData ?? [], [productsData]);

  // Categorías = settings.categories ∪ categorías huérfanas que algún producto
  // ya usa (compat: no esconder productos por una .cat fuera de la lista oficial).
  const categories = useMemo(() => {
    const set = new Set<string>(settings?.categories ?? DEFAULT_CATEGORIES);
    for (const p of products) if (p.cat) set.add(p.cat);
    return Array.from(set);
  }, [products, settings]);

  const tabs = useMemo(
    () => [{ id: 'all', label: 'Todos' }, ...categories.map((c) => ({ id: c, label: c }))],
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === 'all' || p.cat === cat) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [products, cat, query]);

  const submitting = createProduct.isPending || patchProduct.isPending || uploadImage.isPending;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const toggleAvailable = (p: Product) => {
    patchProduct.mutate({ productId: p.id, body: { available: !p.available } });
  };

  /**
   * Persiste el producto. Modo crear o editar según `editing`. La subida de
   * imagen va separada (multipart) para no acoplar el flow JSON normal.
   */
  const handleSubmit = async (draft: ProductFormDraft) => {
    try {
      if (editing) {
        const patch: Record<string, unknown> = {};
        if (draft.name !== editing.name) patch.name = draft.name;
        if (draft.price !== editing.price) patch.price = draft.price;
        if (draft.cat !== editing.cat) patch.cat = draft.cat;
        if (draft.available !== editing.available) patch.available = draft.available;
        if (draft.description !== (editing.description ?? null)) patch.description = draft.description;
        // "Quitar" sin subir nueva → limpiamos img en BD. Si subió una nueva, la
        // mutation de upload pisa el valor después, así que no se toca acá.
        if (draft.imgRemoved && !draft.imgFile) patch.img = '';
        if (Object.keys(patch).length > 0) {
          await patchProduct.mutateAsync({ productId: editing.id, body: patch });
        }
        if (draft.imgFile) {
          await uploadImage.mutateAsync({ productId: editing.id, file: draft.imgFile });
        }
        pushToast({ kind: 'success', message: `"${draft.name}" actualizado.` });
      } else {
        const created = await createProduct.mutateAsync({
          name: draft.name,
          price: draft.price,
          cat: draft.cat,
          available: draft.available,
          description: draft.description,
        });
        if (draft.imgFile) {
          await uploadImage.mutateAsync({ productId: created.id, file: draft.imgFile });
        }
        setCat(draft.cat);
        pushToast({ kind: 'success', message: `"${draft.name}" se agregó al catálogo.` });
      }
      closeForm();
    } catch {
      // Los toasts de error ya los emite cada mutation desde queries/products.
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const name = confirmDelete.name;
    try {
      await deleteProduct.mutateAsync(confirmDelete.id);
      pushToast({ kind: 'success', message: `"${name}" archivado del catálogo.` });
    } catch {
      // toast de error ya lo emite la mutation
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.toolLeft} data-tour="catalogo-categorias">
          <Tabs tabs={tabs} value={cat} onChange={setCat} />
        </div>
        <div className={styles.toolRight}>
          <div className="input-search" style={{ width: 200 }}>
            <Icon.Search size={16} />
            <input
              placeholder="Buscar producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar producto"
            />
          </div>
          <button type="button" className="btn btn-primary sm" data-tour="catalogo-nuevo" onClick={openCreate}>
            <Icon.Plus size={14} />
            Nuevo producto
          </button>
        </div>
      </div>

      <SectionTitle
        sub={
          isLoading
            ? 'Cargando catálogo…'
            : `${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}${cat === 'all' ? '' : ` en ${cat}`}`
        }
      >
        Productos
      </SectionTitle>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton width="100%" height={186} radius={0} />
              <div className={styles.body}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="40%" height={20} />
                <Skeleton width="55%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Icon.Sandwich size={22} />}
          title={query.trim() ? 'Sin coincidencias' : 'Aún no hay productos'}
          sub={
            query.trim()
              ? 'Probá con otro nombre o cambiá de categoría.'
              : 'Agregá tu primer producto para que aparezca en el menú del cliente.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              toggling={patchProduct.isPending && patchProduct.variables?.productId === p.id}
              onToggle={() => toggleAvailable(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => setConfirmDelete(p)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <ProductFormModal
          editing={editing}
          categories={categories}
          submitting={submitting}
          onSave={handleSubmit}
          onClose={closeForm}
        />
      )}

      {confirmDelete && (
        <Modal
          open
          onClose={() => setConfirmDelete(null)}
          title="Archivar producto"
          sub="Sale del catálogo y del menú del cliente, pero queda guardado para preservar el historial de pedidos."
          size="sm"
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteProduct.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary sm"
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
                style={{ background: 'var(--coral)', boxShadow: '0 6px 0 oklch(0.45 0.16 25)', color: '#fff' }}
              >
                <Icon.X size={14} />
                {deleteProduct.isPending ? 'Archivando…' : 'Archivar producto'}
              </button>
            </>
          }
        >
          <p className={styles.delText}>
            ¿Archivar <strong>{confirmDelete.name}</strong>?
          </p>
          <p className={styles.delNote}>
            Deja de aparecer en el catálogo, en el menú del storefront, en el bot de WhatsApp y en el
            selector de promociones. Los pedidos pasados que lo contenían siguen mostrando el nombre
            normalmente. La imagen se libera del storage.
          </p>
        </Modal>
      )}
    </div>
  );
}
