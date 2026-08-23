import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchOpenTabs,
  fetchTab,
  openTableTab,
  addTabItems,
  sendTabKitchen,
  patchTab,
  fetchTabSplit,
  payTabCash,
  type Tab,
  type TabItemInput,
  type PatchTabBody,
  type SplitView,
  type PayCashBody,
} from '../api';
import { tabKeys, tableKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

/** Vista Salón en vivo: refresco frecuente de las cuentas abiertas. */
const TABS_POLL_MS = 5_000;

export function useOpenTabs() {
  const company = useActiveCompany();
  return useQuery<Tab[]>({
    queryKey: tabKeys.list(),
    queryFn: fetchOpenTabs,
    enabled: !!company,
    refetchInterval: TABS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useTab(orderId: string | null) {
  const company = useActiveCompany();
  return useQuery<Tab>({
    queryKey: tabKeys.detail(orderId ?? ''),
    queryFn: () => fetchTab(orderId as string),
    enabled: !!company && !!orderId,
    refetchInterval: TABS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useTabSplit(orderId: string | null) {
  const company = useActiveCompany();
  return useQuery<SplitView>({
    queryKey: tabKeys.split(orderId ?? ''),
    queryFn: () => fetchTabSplit(orderId as string),
    enabled: !!company && !!orderId,
    refetchInterval: TABS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

function invalidateTabs(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: tabKeys.all });
  qc.invalidateQueries({ queryKey: tableKeys.all });
}

export function useOpenTableTab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, waiterId }: { tableId: string; waiterId?: string }) =>
      openTableTab(tableId, waiterId),
    onSuccess: () => invalidateTabs(qc),
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo abrir la cuenta: ${err.message}` });
    },
  });
}

export function useAddTabItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }: { orderId: string; items: TabItemInput[] }) =>
      addTabItems(orderId, items),
    onSuccess: () => invalidateTabs(qc),
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudieron agregar los ítems: ${err.message}` });
    },
  });
}

export function useSendTabKitchen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => sendTabKitchen(orderId),
    onSuccess: () => {
      invalidateTabs(qc);
      pushToast({ kind: 'success', message: 'Enviado a cocina' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo enviar a cocina: ${err.message}` });
    },
  });
}

export function usePatchTab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: PatchTabBody }) => patchTab(orderId, body),
    onSuccess: () => invalidateTabs(qc),
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar la cuenta: ${err.message}` });
    },
  });
}

export function usePayTabCash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: PayCashBody }) => payTabCash(orderId, body),
    onSuccess: () => {
      invalidateTabs(qc);
      pushToast({ kind: 'success', message: 'Pago registrado' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo registrar el pago: ${err.message}` });
    },
  });
}
