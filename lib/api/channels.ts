import { tenantRequest } from './client';

export type ChannelProvider = 'whatsapp' | 'storefront' | 'rappi' | 'didi' | 'ubereats' | 'manual';
export type ChannelKind = 'direct' | 'marketplace' | 'pos';
export type ChannelMode = 'none' | 'simulated' | 'live';
export type ChannelStatus =
  | 'not_configured'
  | 'simulated_ready'
  | 'live_pending_credentials'
  | 'live_connected'
  | 'degraded'
  | 'paused';

export interface SalesChannel {
  id: string;
  provider: ChannelProvider;
  name: string;
  kind: ChannelKind;
  mode: ChannelMode;
  status: ChannelStatus;
  statusLabel: string;
  deliveryMode: string;
  deliveryLabel: string;
  commissionRateBps: number;
  externalStoreId: string | null;
  credentialsStatus: string;
  ordersToday: number;
  salesToday: number;
  commissionToday: number;
  lastEventAt: string | null;
  lastEventLabel: string;
  lastError: string | null;
  settings: Record<string, unknown>;
}

export interface ChannelRequirement {
  area: string;
  item: string;
  state: string;
  priority: string;
}

export interface ChannelsSummary {
  activeChannels: number;
  totalOrders: number;
  totalSales: number;
  directSales: number;
  marketplaceSales: number;
  commissionToday: number;
  avoidedCommission: number;
}

export interface ChannelsOverview {
  channels: SalesChannel[];
  summary: ChannelsSummary;
  requirements: ChannelRequirement[];
}

export type ChannelAction = 'enable_simulator' | 'prepare_live' | 'pause' | 'resume';

export async function fetchChannels(): Promise<ChannelsOverview> {
  const { channels, summary, requirements } = await tenantRequest<
    { ok: true } & ChannelsOverview
  >('/channels');
  return { channels, summary, requirements };
}

export async function updateChannelAction(
  provider: ChannelProvider,
  action: ChannelAction,
): Promise<ChannelsOverview> {
  const { channels, summary, requirements } = await tenantRequest<
    { ok: true } & ChannelsOverview
  >('/channels', {
    method: 'PATCH',
    body: JSON.stringify({ provider, action }),
  });
  return { channels, summary, requirements };
}

export async function simulateChannelOrder(provider: Extract<ChannelProvider, 'rappi' | 'didi'>) {
  const { result } = await tenantRequest<{
    ok: true;
    result: {
      provider: string;
      externalOrderId: string;
      eventId: string;
      orderId: string;
      orderNumber: number | null;
      total: number;
      commission: number;
      discount: number;
    };
  }>(`/channels/${provider}/simulate-order`, { method: 'POST' });
  return result;
}
