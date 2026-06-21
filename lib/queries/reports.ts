import { useQuery } from '@tanstack/react-query';
import { fetchReports, type ReportPeriod, type ReportsData } from '../api';
import { reportKeys } from './keys';
import { useActiveCompany } from './company';

const REPORTS_POLL_MS = 60_000;

export function useReports(period: ReportPeriod) {
  const company = useActiveCompany();
  return useQuery<ReportsData>({
    queryKey: reportKeys.summary(period),
    queryFn: () => fetchReports(period),
    enabled: !!company,
    refetchInterval: REPORTS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
