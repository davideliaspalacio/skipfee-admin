import { useQuery } from '@tanstack/react-query';
import { fetchCustomers, type CustomersFilter } from '../api';
import type { Customer } from '../data';
import { customerKeys } from './keys';

const CUSTOMERS_POLL_MS = 15_000;

export function useCustomers(filter: CustomersFilter = {}) {
  return useQuery<Customer[]>({
    queryKey: customerKeys.list(filter),
    queryFn: () => fetchCustomers(filter),
    refetchInterval: CUSTOMERS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
