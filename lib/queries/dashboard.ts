import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, type DashboardData } from '../api';
import { dashboardKeys } from './keys';

const DASHBOARD_POLL_MS = 20_000;

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.today(),
    queryFn: () => fetchDashboard(),
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
