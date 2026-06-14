import { request } from './client';

export type ReportPeriod = '7d' | '30d' | '90d';

export interface ReportsData {
  period: ReportPeriod;
  financial: {
    bruto: number;
    domicilios: number;
    neto: number;
    variation: number;
  };
  weeklyComparison: Array<{ label: string; thisMonth: number; lastMonth: number }>;
  topProducts: Array<{ id: string; name: string; sold: number }>;
  zoneAnalysis: Array<{
    zone: string;
    zoneName: string;
    orders: number;
    revenue: number;
    avgTicket: number;
    deliveryCost: number;
  }>;
  heatmap: number[][];
  conversion: { openChats: number; closedOrders: number; nonConverted: number; rate: number };
}

export async function fetchReports(period: ReportPeriod = '30d'): Promise<ReportsData> {
  return await request<ReportsData>(`/api/reports/summary?period=${period}`);
}
