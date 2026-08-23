import { tenantRequest } from './client';

/** Un ítem dentro de una cuenta de mesa. */
export interface TabItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  price: number;
  lineTotal: number;
  kitchenStatus: string;
  note: string | null;
  sentAt: string | null;
}

/** Cuenta de mesa (order_type='dine_in') con sus ítems y totales. */
export interface Tab {
  orderId: string;
  orderNumber: number | null;
  tableId: string | null;
  tableCode: string | null;
  waiterId: string | null;
  status: string;
  subtotal: number;
  tip: number;
  total: number;
  itemCount: number;
  pendingCount: number;
  items: TabItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TabItemInput {
  productId: string;
  qty: number;
  note?: string | null;
}

export async function fetchOpenTabs(): Promise<Tab[]> {
  const { tabs } = await tenantRequest<{ ok: true; tabs: Tab[] }>('/tabs');
  return tabs;
}

export async function fetchTab(orderId: string): Promise<Tab> {
  const { tab } = await tenantRequest<{ ok: true; tab: Tab }>(`/tabs/${encodeURIComponent(orderId)}`);
  return tab;
}

/** Abre (o recupera) la cuenta de una mesa. */
export async function openTableTab(tableId: string, waiterId?: string): Promise<Tab> {
  const { tab } = await tenantRequest<{ ok: true; tab: Tab }>(
    `/tables/${encodeURIComponent(tableId)}/open`,
    { method: 'POST', body: JSON.stringify(waiterId ? { waiterId } : {}) },
  );
  return tab;
}

export async function addTabItems(orderId: string, items: TabItemInput[]): Promise<Tab> {
  const { tab } = await tenantRequest<{ ok: true; tab: Tab }>(
    `/tabs/${encodeURIComponent(orderId)}/items`,
    { method: 'POST', body: JSON.stringify({ items }) },
  );
  return tab;
}

export async function sendTabKitchen(orderId: string): Promise<Tab> {
  const { tab } = await tenantRequest<{ ok: true; tab: Tab }>(
    `/tabs/${encodeURIComponent(orderId)}/send-kitchen`,
    { method: 'POST' },
  );
  return tab;
}

export interface PatchTabBody {
  status?: 'abierta' | 'por_cobrar' | 'cerrada';
  waiterId?: string | null;
  tip?: number;
}

export async function patchTab(orderId: string, body: PatchTabBody): Promise<Tab> {
  const { tab } = await tenantRequest<{ ok: true; tab: Tab }>(
    `/tabs/${encodeURIComponent(orderId)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return tab;
}

/** Una porción del split de la cuenta. */
export interface SplitShare {
  id: string;
  amount: number;
  status: string;
  method: string;
  label: string | null;
  paidAt: string | null;
}

export interface SplitView {
  orderId: string;
  status: string;
  total: number;
  collected: number;
  remaining: number;
  fullyPaid: boolean;
  shares: SplitShare[];
}

export async function fetchTabSplit(orderId: string): Promise<SplitView> {
  const { split } = await tenantRequest<{ ok: true; split: SplitView }>(
    `/tabs/${encodeURIComponent(orderId)}/split`,
  );
  return split;
}

export interface PayCashBody {
  amount: number;
  method: 'efectivo' | 'datafono';
  label?: string;
}

/** Registra un pago presencial (efectivo/datáfono) del mesero sobre la cuenta. */
export async function payTabCash(orderId: string, body: PayCashBody): Promise<SplitView> {
  const { split } = await tenantRequest<{ ok: true; split: SplitView }>(
    `/tabs/${encodeURIComponent(orderId)}/split`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return split;
}
