import { tenantRequest } from './client';
import type { Zone } from '../data';

export async function fetchZones(includeArchived = false): Promise<Zone[]> {
  const qs = includeArchived ? '?all=1' : '';
  const { zones } = await tenantRequest<{ ok: true; zones: Zone[] }>(`/zones${qs}`);
  return zones;
}

export interface CreateZoneBody {
  name: string;
  tarifa: number;
  color?: string;
  lat?: number;
  lng?: number;
}

export async function createZone(body: CreateZoneBody): Promise<Zone> {
  const { zone } = await tenantRequest<{ ok: true; zone: Zone }>('/zones', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return zone;
}

export type PatchZoneBody = {
  name?: string;
  tarifa?: number;
  color?: string;
  lat?: number;
  lng?: number;
  /** Para archivar (true) o desarchivar (false). */
  archived?: boolean;
  /** Polígono de cobertura (≥3 puntos) o null para borrarlo. */
  coverage?: Array<{ lat: number; lng: number }> | null;
  /** Radio de respaldo en metros (si no hay polígono). */
  coverageRadiusM?: number | null;
};

export async function patchZone(zoneId: string, body: PatchZoneBody): Promise<Zone> {
  const { zone } = await tenantRequest<{ ok: true; zone: Zone }>(
    `/zones/${encodeURIComponent(zoneId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
  return zone;
}

/** Archiva la zona (soft-delete). El bot/admin dejan de ofrecerla. */
export async function deleteZone(zoneId: string): Promise<void> {
  await tenantRequest(`/zones/${encodeURIComponent(zoneId)}`, { method: 'DELETE' });
}
