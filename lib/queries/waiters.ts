import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchWaiters,
  createWaiter,
  patchWaiter,
  deleteWaiter,
  type Waiter,
  type CreateWaiterBody,
  type PatchWaiterBody,
} from '../api';
import { waiterKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

const WAITERS_POLL_MS = 60_000;

export function useWaiters(includeArchived = false) {
  const company = useActiveCompany();
  return useQuery<Waiter[]>({
    queryKey: waiterKeys.list(includeArchived),
    queryFn: () => fetchWaiters(includeArchived),
    enabled: !!company,
    refetchInterval: WAITERS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useCreateWaiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWaiterBody) => createWaiter(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waiterKeys.all });
      pushToast({ kind: 'success', message: 'Mesero agregado' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear el mesero: ${err.message}` });
    },
  });
}

export function usePatchWaiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchWaiterBody }) => patchWaiter(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waiterKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar el mesero: ${err.message}` });
    },
  });
}

export function useDeleteWaiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWaiter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: waiterKeys.all });
      pushToast({ kind: 'success', message: 'Mesero archivado' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo archivar el mesero: ${err.message}` });
    },
  });
}
