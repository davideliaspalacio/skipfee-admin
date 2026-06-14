import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRewards, approveReward, rejectReward, type Reward, type RewardStatus } from '../api';
import { rewardKeys } from './keys';
import { pushToast } from '../toast';

const REWARDS_POLL_MS = 30_000;

export function useRewards(status: RewardStatus = 'pendiente') {
  return useQuery<Reward[]>({
    queryKey: rewardKeys.list(status),
    queryFn: () => fetchRewards(status),
    refetchInterval: REWARDS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useApproveReward() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; grantedBy?: string }>({
    mutationFn: ({ id, grantedBy }) => approveReward(id, grantedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rewardKeys.all });
      pushToast({ kind: 'success', message: 'Postre aprobado 🍰 Se le avisó al cliente.' });
    },
    onError: err => pushToast({ kind: 'error', message: `No se pudo aprobar: ${err.message}` }),
  });
}

export function useRejectReward() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; notes?: string; notify?: boolean }>({
    mutationFn: ({ id, notes, notify }) => rejectReward(id, { notes, notify }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rewardKeys.all });
      pushToast({ kind: 'info', message: 'Reseña rechazada.' });
    },
    onError: err => pushToast({ kind: 'error', message: `No se pudo rechazar: ${err.message}` }),
  });
}
