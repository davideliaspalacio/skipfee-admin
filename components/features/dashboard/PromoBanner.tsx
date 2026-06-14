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

/** Banner de la promoción viva AHORA (primer match de useActivePromotions). */
export function PromoBanner({ promo }: { promo: ActivePromotion }) {
  return (
    <div className={styles.promo}>
      <div className={styles.promoMark}>{promoMark(promo)}</div>
      <div className={styles.promoBody}>
        <span className={styles.promoKicker}>Promoción activa ahora</span>
        <span className={styles.promoName}>{promo.name}</span>
        {promo.description && <span className={styles.promoDesc}>{promo.description}</span>}
      </div>
      <Icon.Sparkles size={26} className={styles.promoSpark} />
    </div>
  );
}
