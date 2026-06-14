'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Feedback';
import styles from './dashboard.module.css';

/** Rejilla de stats del dashboard: tarjetas sharp con cabecera + sub accionable. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.statGrid}>{children}</div>;
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
  hot,
  skelWidth = 110,
}: {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** Acento "requiere atención" (fondo coral suave + texto coral en el sub). */
  hot?: boolean;
  loading?: boolean;
  skelWidth?: number;
}) {
  return (
    <div className={`${styles.statCell}${hot ? ` ${styles.hot}` : ''}`}>
      <div className={styles.statHead}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValue}>
        {loading ? <Skeleton width={skelWidth} height={30} /> : value}
      </div>
      {sub != null && (
        <div className={`${styles.statSub}${hot && !loading ? ` ${styles.alert}` : ''}`}>
          {loading ? <Skeleton width={90} height={11} /> : sub}
        </div>
      )}
    </div>
  );
}
