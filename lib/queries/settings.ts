import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, patchSettings, type Settings } from '../api';
import { settingsKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

const SETTINGS_POLL_MS = 60_000;

export function useSettings() {
  const company = useActiveCompany();
  return useQuery<Settings>({
    queryKey: settingsKeys.current(),
    queryFn: () => fetchSettings(),
    enabled: !!company,
    refetchInterval: SETTINGS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

type PatchSettingsContext = { previous: Settings | undefined };

export function usePatchSettings() {
  const qc = useQueryClient();
  return useMutation<void, Error, Partial<Settings>, PatchSettingsContext>({
    mutationFn: body => patchSettings(body),
    onMutate: async body => {
      await qc.cancelQueries({ queryKey: settingsKeys.current() });
      const previous = qc.getQueryData<Settings>(settingsKeys.current());
      if (previous) {
        qc.setQueryData<Settings>(settingsKeys.current(), { ...previous, ...body });
      }
      return { previous };
    },
    onError: (err, _body, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(settingsKeys.current(), ctx.previous);
      }
      pushToast({ kind: 'error', message: `No se pudo guardar la configuración: ${err.message}` });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: settingsKeys.current() });
    },
  });
}
