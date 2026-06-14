import { request } from './client';

export interface Survey {
  id: string;
  orderId: string;
  phone: string;
  name: string | null;
  rating: number;
  comment: string | null;
  respondedAt: string;
}

/**
 * Reseñas/calificaciones YA respondidas en los últimos `days` días.
 * Sin `ratingMax` trae TODAS (reporte); con `ratingMax` filtra (ej. ≤3).
 */
export async function fetchSurveys(opts: { days?: number; ratingMax?: number } = {}): Promise<Survey[]> {
  const qs = new URLSearchParams();
  qs.set('days', String(opts.days ?? 90));
  if (opts.ratingMax != null) qs.set('ratingMax', String(opts.ratingMax));
  const { surveys } = await request<{ ok: true; surveys: Survey[] }>(`/api/surveys?${qs.toString()}`);
  return surveys;
}
