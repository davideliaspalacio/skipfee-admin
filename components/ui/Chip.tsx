import type { ReactNode } from 'react';
import { STATUSES, type StatusId } from '@/lib/data';

export function Tag({ children, tone }: { children: ReactNode; tone?: 'green' | 'sun' | 'coral' | 'active' }) {
  return <span className={`chip sm${tone ? ` tone-${tone}` : ''}`}>{children}</span>;
}

/** Estado del pedido — color tomado de STATUSES (fuente de verdad de columnas). */
export function StatusChip({ status }: { status: StatusId }) {
  const s = STATUSES.find((x) => x.id === status) ?? STATUSES[0];
  return (
    <span className="chip sm" style={{ color: s.color, background: `${s.color}1f` }}>
      <span className="cdot" />
      {s.label}
    </span>
  );
}

/** Urgencia por minutos: verde < 18, ámbar 18-30, coral > 30 (umbral del Vite app). */
export function UrgencyChip({ minutes }: { minutes: number }) {
  const tone = minutes > 30 ? 'coral' : minutes > 18 ? 'sun' : 'green';
  return (
    <span className={`chip sm tone-${tone}`}>
      <span className="cdot" />
      {minutes}m
    </span>
  );
}
