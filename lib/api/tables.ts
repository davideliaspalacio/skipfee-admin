import { tenantRequest } from './client';

/** Mesa del salón (dine-in). `qrToken` alimenta el QR de autoservicio. */
export interface DiningTable {
  id: string;
  code: string;
  label: string | null;
  area: string | null;
  seats: number;
  qrToken: string;
  isActive: boolean;
  archived: boolean;
  createdAt: string;
}

export async function fetchTables(includeArchived = false): Promise<DiningTable[]> {
  const qs = includeArchived ? '?all=1' : '';
  const { tables } = await tenantRequest<{ ok: true; tables: DiningTable[] }>(`/tables${qs}`);
  return tables;
}

export interface CreateTableBody {
  code: string;
  label?: string;
  area?: string;
  seats?: number;
}

export async function createTable(body: CreateTableBody): Promise<DiningTable> {
  const { table } = await tenantRequest<{ ok: true; table: DiningTable }>('/tables', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return table;
}

export interface PatchTableBody {
  code?: string;
  label?: string | null;
  area?: string | null;
  seats?: number;
  isActive?: boolean;
  /** Archivar (true) / desarchivar (false). */
  archived?: boolean;
  /** Genera un nuevo `qrToken` (invalida el QR anterior). */
  regenerateQr?: boolean;
}

export async function patchTable(id: string, body: PatchTableBody): Promise<DiningTable> {
  const { table } = await tenantRequest<{ ok: true; table: DiningTable }>(
    `/tables/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return table;
}

/** Archiva la mesa (soft-delete). Las cuentas viejas conservan su `table_id`. */
export async function deleteTable(id: string): Promise<void> {
  await tenantRequest(`/tables/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
