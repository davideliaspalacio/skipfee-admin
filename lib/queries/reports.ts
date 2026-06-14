import { useQuery } from '@tanstack/react-query';
import { fetchReports, type ReportPeriod, type ReportsData } from '../api';
import { reportKeys } from './keys';

const REPORTS_POLL_MS = 60_000;

export function useReports(period: ReportPeriod) {
  return useQuery<ReportsData>({
    queryKey: reportKeys.summary(period),
    queryFn: () => fetchReports(period),
    refetchInterval: REPORTS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
