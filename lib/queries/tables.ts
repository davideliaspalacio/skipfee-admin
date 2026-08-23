import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTables,
  createTable,
  patchTable,
  deleteTable,
  type DiningTable,
  type CreateTableBody,
  type PatchTableBody,
} from '../api';
import { tableKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

const TABLES_POLL_MS = 60_000;

export function useTables(includeArchived = false) {
  const company = useActiveCompany();
  return useQuery<DiningTable[]>({
    queryKey: tableKeys.list(includeArchived),
    queryFn: () => fetchTables(includeArchived),
    enabled: !!company,
    refetchInterval: TABLES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTableBody) => createTable(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tableKeys.all });
      pushToast({ kind: 'success', message: 'Mesa creada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear la mesa: ${err.message}` });
    },
  });
}

export function usePatchTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchTableBody }) => patchTable(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tableKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar la mesa: ${err.message}` });
    },
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tableKeys.all });
      pushToast({ kind: 'success', message: 'Mesa archivada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo archivar la mesa: ${err.message}` });
    },
  });
}
