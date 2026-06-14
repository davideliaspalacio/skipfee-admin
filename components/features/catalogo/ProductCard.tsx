'use client';

import { COP, type Product } from '@/lib/data';
import { Icon } from '@/lib/icons';
import styles from './catalogo.module.css';

/**
 * Tarjeta de producto (vitrina). Foto arriba con badge de categoría + acciones
 * al hover, cuerpo con nombre/precio/ventas y toggle de disponibilidad.
 *
 * El toggle aplica un "dim optimista": el padre ya patchea optimista en cache
 * (usePatchProduct), pero mientras la mutación está en vuelo bajamos la opacidad
 * para dar feedback inmediato de manipulación directa.
 */
export function ProductCard({
  product,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: Product;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const off = !product.available;

  return (
    <article className={`${styles.card}${off ? ` ${styles.off}` : ''}`}>
      <div className={styles.media}>
        {product.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.img} alt={product.name} loading="lazy" />
        ) : (
          <div className={styles.mediaEmpty}>
            <Icon.Sandwich size={26} />
            <span>Sin foto</span>
          </div>
        )}

        {product.cat && <span className={styles.catBadge}>{product.cat}</span>}

        {off && (
          <div className={styles.soldout}>
            <span className={styles.soldoutTag}>Agotado</span>
          </div>
        )}

        <div className={styles.mediaActions}>
          <button
            type="button"
            className={styles.fab}
            onClick={onEdit}
            aria-label={`Editar ${product.name}`}
            title="Editar"
          >
            <Icon.Edit size={14} />
          </button>
          <button
            type="button"
            className={`${styles.fab} ${styles.danger}`}
            onClick={onDelete}
            aria-label={`Archivar ${product.name}`}
            title="Archivar"
          >
            <Icon.X size={14} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.name}>{product.name}</div>
        {product.description && <p className={styles.desc}>{product.description}</p>}
        <div className={styles.price}>{COP(product.price)}</div>
        <span className={styles.sold}>{product.sold} vendidos · semana</span>

        <div className={styles.cardFoot}>
          <span className={styles.sold}>{off ? 'Oculto del menú' : 'En el menú'}</span>
          <div className={styles.availRow}>
            <span className={`${styles.availLbl}${product.available ? ` ${styles.on}` : ''}`}>
              {product.available ? 'Disponible' : 'Agotado'}
            </span>
            <button
              type="button"
              className={`${styles.toggle}${product.available ? ` ${styles.on}` : ''}`}
              onClick={onToggle}
              disabled={toggling}
              aria-pressed={product.available}
              aria-label={`Disponibilidad de ${product.name}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
