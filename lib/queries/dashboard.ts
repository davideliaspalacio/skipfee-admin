import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, type DashboardData } from '../api';
import { dashboardKeys } from './keys';
import { useActiveCompany } from './company';

const DASHBOARD_POLL_MS = 20_000;

export function useDashboard() {
  const company = useActiveCompany();
  return useQuery<DashboardData>({
    queryKey: dashboardKeys.today(),
    queryFn: () => fetchDashboard(),
    enabled: !!company,
    refetchInterval: DASHBOARD_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
