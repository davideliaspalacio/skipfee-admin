import type { ReactNode } from 'react';

/** Rejilla de stats sobre la clase de marca .stats. */
export function StatGrid({ children, cols }: { children: ReactNode; cols?: number }) {
  return (
    <div className="stats" style={cols ? { gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}>
      {children}
    </div>
  );
}

/** Número grande Bricolage (.stat .v/.u/.l). `unit` se renderiza en verde a menor tamaño. */
export function StatCard({ value, unit, label }: { value: ReactNode; unit?: ReactNode; label: ReactNode }) {
  return (
    <div className="stat">
      <div className="v">
        {value}
        {unit != null && <span className="u">{unit}</span>}
      </div>
      <div className="l">{label}</div>
    </div>
  );
}
