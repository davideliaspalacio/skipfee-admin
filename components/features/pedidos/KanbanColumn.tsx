'use client';

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Status } from '@/lib/data';
import styles from './pedidos.module.css';

export function KanbanColumn({
  status,
  total,
  count,
  children,
  headerAction,
}: {
  status: Status;
  total: number;
  /** Cuántas tarjetas se renderizan (≤ total); muestra "+N" si hay más. */
  count: number;
  children: ReactNode;
  headerAction?: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const hidden = total - count;
  return (
    <div ref={setNodeRef} className={`${styles.col}${isOver ? ` ${styles.over}` : ''}`}>
      <div className={styles.colHead}>
        <div className={styles.colHeadLeft}>
          <span className={styles.colDot} style={{ background: status.color }} />
          {status.label}
        </div>
        <div className={styles.headAction}>
          {headerAction}
          <span className={styles.count}>{total}</span>
        </div>
      </div>
      <div className={styles.list}>
        {total === 0 ? <div className={styles.empty}>Sin pedidos</div> : children}
        {hidden > 0 && <div className={styles.more}>+{hidden} más</div>}
      </div>
    </div>
  );
}
