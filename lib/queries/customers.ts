import { useQuery } from '@tanstack/react-query';
import { fetchCustomers, type CustomersFilter } from '../api';
import type { Customer } from '../data';
import { customerKeys } from './keys';
import { useActiveCompany } from './company';

const CUSTOMERS_POLL_MS = 15_000;

export function useCustomers(filter: CustomersFilter = {}) {
  const company = useActiveCompany();
  return useQuery<Customer[]>({
    queryKey: customerKeys.list(filter),
    queryFn: () => fetchCustomers(filter),
    enabled: !!company,
    refetchInterval: CUSTOMERS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
