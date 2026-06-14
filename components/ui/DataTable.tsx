import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Tipografía monoespaciada + alineado a la derecha (números/códigos). */
  num?: boolean;
  render?: (row: T) => ReactNode;
}

/** Tabla de datos sobre la clase de marca .dtable. Genérica. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }
  return (
    <table className="dtable">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{ textAlign: c.align ?? (c.num ? 'right' : 'left') }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={rowKey(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
          >
            {columns.map((c) => (
              <td
                key={c.key}
                className={c.num ? 'num' : undefined}
                style={!c.num && c.align ? { textAlign: c.align } : undefined}
              >
                {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
