import { tenantRequest } from './client';

/** Mesero (staff) asignable a una cuenta de mesa. */
export interface Waiter {
  id: string;
  name: string;
  phone: string | null;
  archived: boolean;
  createdAt: string;
}

export async function fetchWaiters(includeArchived = false): Promise<Waiter[]> {
  const qs = includeArchived ? '?all=1' : '';
  const { waiters } = await tenantRequest<{ ok: true; waiters: Waiter[] }>(`/waiters${qs}`);
  return waiters;
}

export interface CreateWaiterBody {
  name: string;
  phone?: string;
}

export async function createWaiter(body: CreateWaiterBody): Promise<Waiter> {
  const { waiter } = await tenantRequest<{ ok: true; waiter: Waiter }>('/waiters', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return waiter;
}

export interface PatchWaiterBody {
  name?: string;
  phone?: string | null;
  /** Archivar (true) / desarchivar (false). */
  archived?: boolean;
}

export async function patchWaiter(id: string, body: PatchWaiterBody): Promise<Waiter> {
  const { waiter } = await tenantRequest<{ ok: true; waiter: Waiter }>(
    `/waiters/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return waiter;
}

/** Archiva el mesero (soft-delete). */
export async function deleteWaiter(id: string): Promise<void> {
  await tenantRequest(`/waiters/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
