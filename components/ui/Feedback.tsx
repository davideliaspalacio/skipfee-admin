import type { CSSProperties, ReactNode } from 'react';

export function Skeleton({
  width,
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return <span className="skel" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function EmptyState({ icon, title, sub }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div className="ei">{icon}</div>}
      <b>{title}</b>
      {sub && <span>{sub}</span>}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {sub && <div className="ph-sub">{sub}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, sub, action }: { children: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display), sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
          {children}
        </div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
