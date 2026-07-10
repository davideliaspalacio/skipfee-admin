import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchChannels,
  simulateChannelOrder,
  updateChannelAction,
  type ChannelAction,
  type ChannelProvider,
  type ChannelsOverview,
} from '../api';
import { useActiveCompany } from './company';
import { channelKeys, orderKeys } from './keys';
import { pushToast } from '../toast';

const CHANNELS_POLL_MS = 10_000;

export function useChannels() {
  const company = useActiveCompany();
  return useQuery<ChannelsOverview>({
    queryKey: channelKeys.overview(),
    queryFn: fetchChannels,
    enabled: !!company,
    refetchInterval: CHANNELS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useChannelAction() {
  const qc = useQueryClient();
  return useMutation<
    ChannelsOverview,
    Error,
    { provider: ChannelProvider; action: ChannelAction }
  >({
    mutationFn: ({ provider, action }) => updateChannelAction(provider, action),
    onSuccess: (data, vars) => {
      qc.setQueryData(channelKeys.overview(), data);
      pushToast({
        kind: 'success',
        message:
          vars.action === 'enable_simulator'
            ? 'Simulador activado'
            : vars.action === 'pause'
              ? 'Canal pausado'
              : 'Canal actualizado',
      });
    },
    onError: (err) => {
      pushToast({ kind: 'error', message: `No se pudo actualizar el canal: ${err.message}` });
    },
  });
}

export function useSimulateChannelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: simulateChannelOrder,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: channelKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.lists() });
      qc.invalidateQueries({ queryKey: orderKeys.stats() });
      pushToast({
        kind: 'success',
        message: `Pedido #${result.orderNumber ?? result.orderId.slice(0, 6)} creado desde ${result.provider.toUpperCase()}`,
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      pushToast({ kind: 'error', message: `No se pudo simular el pedido: ${message}` });
    },
  });
}
