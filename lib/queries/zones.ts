import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchZones, patchZone, createZone, deleteZone, type CreateZoneBody, type PatchZoneBody } from '../api';
import type { Zone } from '../data';
import { zoneKeys } from './keys';
import { pushToast } from '../toast';

const ZONES_POLL_MS = 60_000;

export function useZones(includeArchived = false) {
  return useQuery<Zone[]>({
    queryKey: zoneKeys.list(includeArchived),
    queryFn: () => fetchZones(includeArchived),
    refetchInterval: ZONES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function usePatchZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, body }: { zoneId: string; body: PatchZoneBody }) => patchZone(zoneId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar la zona: ${err.message}` });
    },
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneBody) => createZone(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all });
      pushToast({ kind: 'success', message: 'Zona creada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear la zona: ${err.message}` });
    },
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => deleteZone(zoneId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all });
      pushToast({ kind: 'success', message: 'Zona archivada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo archivar la zona: ${err.message}` });
    },
  });
}

/** Desarchiva una zona (la vuelve a ofrecer en el bot). */
export function useUnarchiveZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => patchZone(zoneId, { archived: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zoneKeys.all });
      pushToast({ kind: 'success', message: 'Zona restaurada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo restaurar la zona: ${err.message}` });
    },
  });
}
