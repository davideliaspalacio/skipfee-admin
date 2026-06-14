import { ApiError, request } from './client';
import type { Order, StatusId } from '../data';

export interface OrdersFilter {
  status?: StatusId;
  zoneId?: string;
}

export interface OrdersStats {
  active: number;
  completedToday: number;
}

export async function fetchOrdersStats(): Promise<OrdersStats> {
  const { active, completedToday } = await request<{
    ok: true;
    active: number;
    completedToday: number;
  }>('/api/orders/stats');
  return { active, completedToday };
}

export async function fetchOrders(params: OrdersFilter = {}): Promise<Order[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.zoneId) search.set('zoneId', params.zoneId);
  const qs = search.toString();
  const { orders } = await request<{ ok: true; orders: Order[] }>(
    `/api/orders${qs ? '?' + qs : ''}`,
  );
  return orders;
}

export async function fetchOrder(orderId: string): Promise<Order | null> {
  try {
    const { order } = await request<{ ok: true; order: Order }>(
      `/api/orders/${encodeURIComponent(orderId)}`,
    );
    return order;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function patchOrderStatus(orderId: string, status: StatusId): Promise<void> {
  await request(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** Reasignación manual del cocinero de un pedido. `cookId: null` lo deja sin asignar. */
export async function patchOrderCook(orderId: string, cookId: string | null): Promise<void> {
  await request(`/api/orders/${orderId}/cook`, {
    method: 'PATCH',
    body: JSON.stringify({ cookId }),
  });
}
