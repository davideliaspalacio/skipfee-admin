'use client';

import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import type { ActivePromotion } from '@/lib/api';
import styles from './dashboard.module.css';

/**
 * Etiqueta corta del badge cuadrado a la izquierda del banner.
 * Los valores de discount_type vienen de backend/src/lib/checkout/promotions.ts.
 */
function promoMark(p: ActivePromotion): string {
  switch (p.discount_type) {
    case 'two_for_one': return '2×1';
    case 'percent':     return `${p.discount_value}%`;
    case 'fixed':       return COP(p.discount_value);
    case 'free_item':   return 'FREE';
    default:            return '★';
  }
}

/** Banner de promociones vivas AHORA. */
export function PromoBanner({ promotions }: { promotions: ActivePromotion[] }) {
  const multiple = promotions.length > 1;

  return (
    <div className={multiple ? styles.promoWrap : undefined}>
      {multiple && (
        <div className={styles.promoSummary}>
          <span>Promociones activas ahora</span>
          <b>{promotions.length}</b>
        </div>
      )}
      <div className={multiple ? styles.promoGrid : undefined}>
        {promotions.map((promo) => (
          <div key={promo.id} className={`${styles.promo}${multiple ? ` ${styles.compact}` : ''}`}>
            <div className={styles.promoMark}>{promoMark(promo)}</div>
            <div className={styles.promoBody}>
              <span className={styles.promoKicker}>{multiple ? 'Activa ahora' : 'Promoción activa ahora'}</span>
              <span className={styles.promoName}>{promo.name}</span>
              {promo.description && <span className={styles.promoDesc}>{promo.description}</span>}
            </div>
            <Icon.Sparkles size={multiple ? 22 : 26} className={styles.promoSpark} />
          </div>
        ))}
      </div>
    </div>
  );
}
