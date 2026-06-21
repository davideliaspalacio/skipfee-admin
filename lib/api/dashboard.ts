import { tenantRequest } from './client';

export interface DashboardData {
  salesAmount: number;
  completedOrders: number;
  activeOrders: number;
  avgTicket: number;
  sales7d: Array<{ day: string; sales: number; orders: number }>;
  productMix: Array<{ name: string; value: number; color: string }>;
  attentionOrders: Array<{ id: string; number: number; cliente: string; status: string; minutos: number; reason: string }>;
}

export async function fetchDashboard(): Promise<DashboardData> {
  return await tenantRequest<DashboardData>('/dashboard/today');
}
