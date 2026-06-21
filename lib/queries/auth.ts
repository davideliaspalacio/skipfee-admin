import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, logout, me, type MeResult } from '../api';
import { authKeys } from './keys';
import { useActiveCompany } from './company';
import { normalizeRole, type UserRole } from '../roles';

export function useMe() {
  return useQuery<MeResult | null>({
    queryKey: authKeys.me(),
    queryFn: () => me(),
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Rol efectivo del usuario en la empresa activa.
 *
 * Cruza las membresías (`useMe`) con el code activo (`useActiveCompany`, el
 * identificador de ruta) y devuelve el rol normalizado de esa empresa. Si aún no
 * hay datos, cae a `admin` (mismo default histórico de `normalizeRole`).
 */
export function useActiveRole(): UserRole {
  const me = useMe();
  const activeCode = useActiveCompany();
  const membership = me.data?.memberships.find(
    (m) => String(m.companyCode) === activeCode,
  );
  // Fallback al rol del user (compat con backends que aún no mandan memberships).
  return normalizeRole(membership?.role ?? me.data?.user.role);
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      // Login no devuelve membresías/empresa activa: invalidamos `me` para que
      // el bootstrap (GET /api/auth/me) hidrate memberships + empresa activa.
      qc.invalidateQueries({ queryKey: authKeys.me() });
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
