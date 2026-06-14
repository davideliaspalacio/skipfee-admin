import type { ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: ReactNode;
}

/** Segmented control sobre la clase de marca .tablist / .tab.is-active. Controlado. */
export function Tabs({ tabs, value, onChange }: { tabs: TabDef[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="tablist" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={`tab${value === t.id ? ' is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
