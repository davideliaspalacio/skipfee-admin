import { request } from './client';
import type { WeekHours } from './settings';

export interface Cook {
  id: string;
  name: string;
  /** Horario semanal. `null` = sin horario configurado (disponible siempre). */
  hours: WeekHours | null;
  archived: boolean;
}

export async function fetchCooks(includeArchived = false): Promise<Cook[]> {
  const qs = includeArchived ? '?all=1' : '';
  const { cooks } = await request<{ ok: true; cooks: Cook[] }>(`/api/cooks${qs}`);
  return cooks;
}

export interface CreateCookBody {
  name: string;
  hours?: WeekHours;
}

export async function createCook(body: CreateCookBody): Promise<Cook> {
  const { cook } = await request<{ ok: true; cook: Cook }>('/api/cooks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return cook;
}

export interface PatchCookBody {
  name?: string;
  hours?: WeekHours;
  /** Para archivar (true) o desarchivar (false). */
  archived?: boolean;
}

export async function patchCook(cookId: string, body: PatchCookBody): Promise<Cook> {
  const { cook } = await request<{ ok: true; cook: Cook }>(
    `/api/cooks/${encodeURIComponent(cookId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return cook;
}

/** Archiva el cocinero (soft-delete). Deja de recibir asignaciones nuevas. */
export async function deleteCook(cookId: string): Promise<void> {
  await request(`/api/cooks/${encodeURIComponent(cookId)}`, { method: 'DELETE' });
}
