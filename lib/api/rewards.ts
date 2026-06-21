import { tenantRequest } from './client';

export type RewardStatus = 'pendiente' | 'otorgado' | 'canjeado' | 'expirado' | 'rechazado';

export interface Reward {
  id: string;
  phone: string;
  kind: string;
  status: RewardStatus;
  orderIdOrigen: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  grantedAt: string | null;
  grantedBy: string | null;
  expiresAt: string | null;
}

export async function fetchRewards(status: RewardStatus = 'pendiente'): Promise<Reward[]> {
  const { rewards } = await tenantRequest<{ ok: true; rewards: Reward[] }>(`/rewards?status=${status}`);
  return rewards;
}

export async function approveReward(id: string, grantedBy?: string): Promise<void> {
  await tenantRequest(`/rewards/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify(grantedBy ? { grantedBy } : {}),
  });
}

export async function rejectReward(id: string, opts?: { notes?: string; notify?: boolean }): Promise<void> {
  await tenantRequest(`/rewards/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(opts ?? {}),
  });
}
