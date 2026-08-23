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
          /* Ancla estable para el recorrido guiado del demo (`lib/tour.ts`),
             que necesita poder abrir una pestaña concreta antes de resaltarla. */
          data-tour={`tab-${t.id}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
