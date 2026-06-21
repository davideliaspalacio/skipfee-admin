import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBotMessages,
  patchBotMessage,
  resetBotMessage,
  type BotMessage,
  type PatchBotMessageBody,
} from '../api/botMessages';
import { botMessageKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

export function useBotMessages() {
  const company = useActiveCompany();
  return useQuery<BotMessage[]>({
    queryKey: botMessageKeys.list(),
    queryFn: () => fetchBotMessages(),
    enabled: !!company,
  });
}

export function usePatchBotMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, body }: { key: string; body: PatchBotMessageBody }) => patchBotMessage(key, body),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: botMessageKeys.all });
      if (res.warnings?.length) pushToast({ kind: 'info', message: res.warnings[0] });
      else pushToast({ kind: 'success', message: 'Mensaje guardado' });
    },
    onError: (err: Error) => {
      pushToast({ kind: 'error', message: `No se pudo guardar: ${err.message}` });
    },
  });
}

export function useResetBotMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => resetBotMessage(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: botMessageKeys.all });
      pushToast({ kind: 'success', message: 'Mensaje restaurado al original' });
    },
    onError: (err: Error) => {
      pushToast({ kind: 'error', message: `No se pudo restaurar: ${err.message}` });
    },
  });
}
