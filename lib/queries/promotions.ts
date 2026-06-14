import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPromotions,
  fetchActivePromotions,
  createPromotion,
  patchPromotion,
  deletePromotion,
  type Promotion,
  type ActivePromotion,
  type CreatePromotionBody,
  type PatchPromotionBody,
} from '../api';
import { promotionKeys } from './keys';
import { pushToast } from '../toast';

const PROMOTIONS_POLL_MS = 15_000;
const ACTIVE_PROMOTIONS_POLL_MS = 60_000;

export function usePromotions(includeArchived = false) {
  return useQuery<Promotion[]>({
    queryKey: promotionKeys.list(includeArchived),
    queryFn: () => fetchPromotions(includeArchived),
    refetchInterval: PROMOTIONS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/**
 * Solo las promos que están vivas AHORA (incluye filtro por día/hora Bogotá
 * que ya hace el endpoint). Usada por el banner del Dashboard. Refetch lento
 * porque las promos no cambian rápido.
 */
export function useActivePromotions() {
  return useQuery<ActivePromotion[]>({
    queryKey: promotionKeys.active(),
    queryFn: () => fetchActivePromotions(),
    refetchInterval: ACTIVE_PROMOTIONS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

// Helpers cache: actualizan ambas listas (con y sin archivadas) en sitio para
// evitar el delay del refetch + race con el polling. Mismo patrón que `useProducts`.
function updateAllLists(
  qc: ReturnType<typeof useQueryClient>,
  fn: (prev: Promotion[]) => Promotion[],
) {
  for (const key of [promotionKeys.list(false), promotionKeys.list(true)]) {
    qc.setQueryData<Promotion[]>(key, prev => (prev ? fn(prev) : prev));
  }
}

function replaceInCache(qc: ReturnType<typeof useQueryClient>, updated: Promotion) {
  updateAllLists(qc, prev => prev.map(p => (p.id === updated.id ? updated : p)));
}

function addToCache(qc: ReturnType<typeof useQueryClient>, created: Promotion) {
  updateAllLists(qc, prev => [created, ...prev]);
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePromotionBody) => createPromotion(body),
    onSuccess: created => {
      addToCache(qc, created);
      qc.invalidateQueries({ queryKey: promotionKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo crear la promoción: ${err.message}` });
    },
  });
}

export function usePatchPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchPromotionBody }) => patchPromotion(id, body),
    onSuccess: updated => {
      replaceInCache(qc, updated);
      qc.invalidateQueries({ queryKey: promotionKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar: ${err.message}` });
    },
  });
}

/**
 * Archiva una promoción (soft-delete). El backend devuelve la promo actualizada
 * (archived=true, active=false) y refrescamos la caché en sitio para que la lista
 * con archivadas la muestre en la sección "Archivadas" sin esperar al refetch.
 */
export function useArchivePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: archived => {
      replaceInCache(qc, archived);
      qc.invalidateQueries({ queryKey: promotionKeys.all });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo archivar: ${err.message}` });
    },
  });
}

/** @deprecated alias retro-compatible — usar `useArchivePromotion`. */
export const useDeletePromotion = useArchivePromotion;
