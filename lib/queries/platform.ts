import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  listCompanies,
  createCompany,
  type Company,
  type CreateCompanyBody,
  type CreateCompanyResult,
} from '../api';
import { platformKeys } from './keys';
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
