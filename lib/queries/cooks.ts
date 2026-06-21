import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCooks,
  createCook,
  patchCook,
  deleteCook,
  type Cook,
  type CreateCookBody,
  type PatchCookBody,
} from '../api';
import { cookKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

const COOKS_POLL_MS = 60_000;

export function useCooks(includeArchived = false) {
  const company = useActiveCompany();
  return useQuery<Cook[]>({
    queryKey: cookKeys.list(includeArchived),
    queryFn: () => fetchCooks(includeArchived),
    enabled: !!company,
    refetchInterval: COOKS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useCreateCook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCookBody) => createCook(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cookKeys.all });
      pushToast({ kind: 'success', message: 'Cocinero agregado' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear el cocinero: ${err.message}` });
    },
  });
}

export function usePatchCook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cookId, body }: { cookId: string; body: PatchCookBody }) =>
      patchCook(cookId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cookKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar el cocinero: ${err.message}` });
    },
  });
}

export function useDeleteCook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cookId: string) => deleteCook(cookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cookKeys.all });
      pushToast({ kind: 'success', message: 'Cocinero archivado' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo archivar el cocinero: ${err.message}` });
    },
  });
}
