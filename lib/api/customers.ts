import { tenantRequest } from './client';
import type { Customer } from '../data';

export interface CustomersFilter {
  tag?: 'VIP' | 'Recurrente' | 'Nuevo';
  search?: string;
}

export async function fetchCustomers(params: CustomersFilter = {}): Promise<Customer[]> {
  const search = new URLSearchParams();
  if (params.tag) search.set('tag', params.tag);
  if (params.search) search.set('search', params.search);
  const qs = search.toString();
  const { customers } = await tenantRequest<{ ok: true; customers: Customer[] }>(
    `/customers${qs ? '?' + qs : ''}`,
  );
  return customers;
}
