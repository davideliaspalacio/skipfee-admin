import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPayments, updatePayments, type PaymentsConfig, type UpdatePaymentsBody } from '../api';
import { useActiveCompany } from './company';
import { onboardingKeys, paymentKeys } from './keys';
import { pushToast } from '../toast';

export function usePayments() {
  const company = useActiveCompany();
  return useQuery<PaymentsConfig>({
    queryKey: paymentKeys.config(),
    queryFn: fetchPayments,
    enabled: !!company,
  });
}

export function useUpdatePayments() {
  const qc = useQueryClient();
  return useMutation<{ ok: true; mode?: PaymentsConfig['mode'] }, Error, UpdatePaymentsBody>({
    mutationFn: body => updatePayments(body),
    onSuccess: (_res, body) => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: onboardingKeys.all() });
      pushToast({
        kind: 'success',
        message:
          body.mode === 'real'
            ? 'Wompi activado'
            : body.mode === 'mock'
              ? 'Pasarela de prueba activada'
              : 'Llaves de Wompi guardadas',
      });
    },
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}
