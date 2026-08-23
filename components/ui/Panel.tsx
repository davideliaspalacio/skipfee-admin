import type { ReactNode } from 'react';

/** Panel de datos sobre la clase de marca .panel / .panel-bar / .panel-body. */
export function Panel({
  title,
  meta,
  actions,
  onInk,
  bodyClassName,
  noPad,
  dataTour,
  children,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onInk?: boolean;
  bodyClassName?: string;
  /** Sin padding en el body (para tablas/listas a sangre). */
  noPad?: boolean;
  /** Ancla estable para el recorrido guiado del demo (`lib/tour.ts`). */
  dataTour?: string;
  children: ReactNode;
}) {
  return (
    <div className={`panel${onInk ? ' on-ink' : ''}`} data-tour={dataTour}>
      {(title || meta || actions) && (
        <div className="panel-bar">
          <span>{title}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {meta}
            {actions}
          </span>
        </div>
      )}
      <div className={`${noPad ? '' : 'panel-body'}${bodyClassName ? ` ${bodyClassName}` : ''}`}>{children}</div>
    </div>
  );
}
