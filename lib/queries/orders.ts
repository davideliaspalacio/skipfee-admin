import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import {
  fetchOrder,
  fetchOrders,
  fetchOrdersStats,
  patchOrderStatus,
  patchOrderCook,
  type OrdersFilter,
  type OrdersStats,
} from '../api';
import type { Order, StatusId } from '../data';
import { orderKeys } from './keys';
import { pushToast } from '../toast';

const ORDERS_LIST_POLL_MS = 4000;
const ORDER_DETAIL_POLL_MS = 4000;
const ORDERS_STATS_POLL_MS = 10_000;

export function useOrders(filter: OrdersFilter = {}) {
  return useQuery<Order[]>({
    queryKey: orderKeys.list(filter),
    queryFn: () => fetchOrders(filter),
    refetchInterval: ORDERS_LIST_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useOrdersStats({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<OrdersStats>({
    queryKey: orderKeys.stats(),
    queryFn: fetchOrdersStats,
    refetchInterval: ORDERS_STATS_POLL_MS,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useOrder(orderId: string | null | undefined) {
  return useQuery<Order | null>({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn: () => fetchOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: ORDER_DETAIL_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

interface MutationContext {
  /**
   * Snapshot de todas las queries `orders/list/*` antes de la mutación, para poder
   * revertir si falla el server. Cada entrada es `[queryKey, data]` tal como
   * `getQueriesData` los devuelve.
   */
  previousLists: Array<[QueryKey, Order[] | undefined]>;
  previousDetail: Order | null | undefined;
}

/**
 * Mueve un pedido a otro estado con actualización optimista.
 *
 * Flujo:
 * 1. `onMutate`: cancelamos refetches en vuelo y mutamos la cache local
 *    (lists + detail) para que la UI reaccione instantáneamente.
 * 2. `onError`: revertimos al snapshot anterior y mostramos un toast de error.
 * 3. `onSettled`: invalidamos para que en el próximo tick el server gane.
 *
 * Si el llamador quiere disparar varias mutaciones en paralelo (ej. despachar
 * una ruta), basta con llamar `mutateAsync` N veces — cada una hace su propio
 * snapshot y rollback independiente.
 */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();

  return useMutation<void, Error, { id: string; status: StatusId }, MutationContext>({
    mutationFn: ({ id, status }) => patchOrderStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: orderKeys.lists() });
      await qc.cancelQueries({ queryKey: orderKeys.detail(id) });

      const previousLists = qc.getQueriesData<Order[]>({ queryKey: orderKeys.lists() });
      const previousDetail = qc.getQueryData<Order | null>(orderKeys.detail(id));

      previousLists.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Order[]>(
          key,
          data.map(o => (o.id === id ? { ...o, status } : o)),
        );
      });

      if (previousDetail) {
        const next: Order = { ...previousDetail, status };
        qc.setQueryData<Order | null>(orderKeys.detail(id), next);
      }

      return { previousLists, previousDetail };
    },

    onError: (err, vars, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      if (ctx?.previousDetail !== undefined) {
        qc.setQueryData(orderKeys.detail(vars.id), ctx.previousDetail);
      }
      pushToast({
        kind: 'error',
        message: `No se pudo cambiar el estado del pedido: ${err.message}`,
      });
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(vars.id) });
      // Stats del header (activos / completados hoy) cambian con cada transición.
      qc.invalidateQueries({ queryKey: orderKeys.stats() });
    },
  });
}

/**
 * Reasigna manualmente el cocinero de un pedido, con actualización optimista
 * (mismo patrón que `useUpdateOrderStatus`). `cookId: null` lo deja sin asignar;
 * el llamador pasa `cookName` (lo tiene de la lista de cocineros) para que la UI
 * muestre el nombre al instante.
 */
export function useAssignOrderCook() {
  const qc = useQueryClient();

  return useMutation<
    void,
    Error,
    { id: string; cookId: string | null; cookName?: string },
    MutationContext
  >({
    mutationFn: ({ id, cookId }) => patchOrderCook(id, cookId),

    onMutate: async ({ id, cookId, cookName }) => {
      await qc.cancelQueries({ queryKey: orderKeys.lists() });
      await qc.cancelQueries({ queryKey: orderKeys.detail(id) });

      const previousLists = qc.getQueriesData<Order[]>({ queryKey: orderKeys.lists() });
      const previousDetail = qc.getQueryData<Order | null>(orderKeys.detail(id));

      const patch = {
        cookId: cookId ?? undefined,
        cookName: cookId ? cookName : undefined,
      };

      previousLists.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<Order[]>(
          key,
          data.map(o => (o.id === id ? { ...o, ...patch } : o)),
        );
      });

      if (previousDetail) {
        qc.setQueryData<Order | null>(orderKeys.detail(id), { ...previousDetail, ...patch });
      }

      return { previousLists, previousDetail };
    },

    onError: (err, vars, ctx) => {
      ctx?.previousLists.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      if (ctx?.previousDetail !== undefined) {
        qc.setQueryData(orderKeys.detail(vars.id), ctx.previousDetail);
      }
      pushToast({ kind: 'error', message: `No se pudo asignar el cocinero: ${err.message}` });
    },

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: orderKeys.detail(vars.id) });
    },
  });
}
