import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  listCompanies,
  createCompany,
  updateCompany,
  fetchPlatformSettings,
  patchPlatformSettings,
  type Company,
  type CreateCompanyBody,
  type CreateCompanyResult,
  type PlatformSettings,
  type UpdateCompanyBody,
} from '../api';
import { authKeys, platformKeys } from './keys';
import { useActiveRole } from './auth';
import { isPlatformOwner } from '../roles';
import { pushToast } from '../toast';

/**
 * Lista de empresas de la plataforma. Solo tiene sentido para el owner (rol
 * `platform`): se gatea con `enabled` para no disparar un 403 al resto.
 */
export function usePlatformCompanies() {
  const role = useActiveRole();
  return useQuery<Company[]>({
    queryKey: platformKeys.companies(),
    queryFn: () => listCompanies(),
    enabled: isPlatformOwner(role),
  });
}

/**
 * Crea una empresa. Al éxito invalida la lista. Los errores se muestran como
 * toast; el caso 409 (slug ya existe) se traduce a un mensaje claro. El llamador
 * puede además leer el error en `onError` (p. ej. para resaltar el campo slug).
 */
export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation<CreateCompanyResult, Error, CreateCompanyBody>({
    mutationFn: body => createCompany(body),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: platformKeys.companies() });
      pushToast({ kind: 'success', message: `Empresa "${result.company.name}" creada` });
    },
    onError: err => {
      const msg =
        err instanceof ApiError && err.status === 409
          ? 'Ese slug ya existe. Elegí otro.'
          : `No se pudo crear la empresa: ${err.message}`;
      pushToast({ kind: 'error', message: msg });
    },
  });
}

/**
 * Ficha de empresa: activar/suspender, cambiar plan, extender o reiniciar la
 * prueba. Invalida también `me`: el banner de días restantes del panel se
 * alimenta de ahí.
 */
export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation<Company, Error, { codeOrSlug: string | number; body: UpdateCompanyBody }>({
    mutationFn: ({ codeOrSlug, body }) => updateCompany(codeOrSlug, body),
    onSuccess: company => {
      qc.invalidateQueries({ queryKey: platformKeys.companies() });
      qc.invalidateQueries({ queryKey: authKeys.me() });
      pushToast({ kind: 'success', message: `"${company.name}" actualizada` });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo actualizar: ${err.message}` });
    },
  });
}

export function usePlatformSettings() {
  const role = useActiveRole();
  return useQuery<PlatformSettings>({
    queryKey: platformKeys.settings(),
    queryFn: () => fetchPlatformSettings(),
    enabled: isPlatformOwner(role),
  });
}

export function usePatchPlatformSettings() {
  const qc = useQueryClient();
  return useMutation<PlatformSettings, Error, Partial<PlatformSettings>>({
    mutationFn: body => patchPlatformSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: platformKeys.settings() });
      pushToast({ kind: 'success', message: 'Configuración guardada' });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo guardar: ${err.message}` });
    },
  });
}
