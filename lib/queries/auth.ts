import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, logout, me, type AuthUser } from '../api';
import { authKeys } from './keys';

export function useMe() {
  return useQuery<AuthUser | null>({
    queryKey: authKeys.me(),
    queryFn: () => me(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: ({ user }) => {
      qc.setQueryData(authKeys.me(), user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      qc.setQueryData(authKeys.me(), null);
      qc.clear();
    },
  });
}
