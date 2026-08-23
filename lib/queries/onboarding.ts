import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  extraerCarta,
  fetchOnboarding,
  importarCarta,
  type CartaExtraida,
  type EstadoOnboarding,
  type ProductoAImportar,
} from '../api';
import { useActiveCompany } from './company';
import { onboardingKeys, productKeys, settingsKeys, zoneKeys } from './keys';
import { pushToast } from '../toast';

/**
 * Estado de puesta en marcha. Se refresca solo mientras el negocio todavía no
 * puede vender: es cuando el operario está configurando cosas en otra pestaña
 * y espera ver el progreso reflejado.
 */
export function useOnboarding() {
  const company = useActiveCompany();
  return useQuery<EstadoOnboarding>({
    queryKey: onboardingKeys.estado(),
    queryFn: fetchOnboarding,
    enabled: !!company,
    refetchInterval: query => (query.state.data?.puedeVender ? false : 15_000),
    refetchIntervalInBackground: false,
  });
}

/** Lee la carta de una foto. NO guarda: devuelve un borrador para revisar. */
export function useExtraerCarta() {
  return useMutation<CartaExtraida, Error, File>({
    mutationFn: extraerCarta,
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}

export function useImportarCarta() {
  const qc = useQueryClient();
  return useMutation<
    { importados: number; categorias: string[] },
    Error,
    { productos: ProductoAImportar[]; reemplazar?: boolean }
  >({
    mutationFn: ({ productos, reemplazar }) => importarCarta(productos, reemplazar),
    onSuccess: data => {
      // La carta toca catálogo, categorías (settings) y el estado de onboarding.
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: settingsKeys.all });
      qc.invalidateQueries({ queryKey: onboardingKeys.all() });
      pushToast({
        kind: 'success',
        message: `${data.importados} ${data.importados === 1 ? 'producto guardado' : 'productos guardados'}`,
      });
    },
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}

export { zoneKeys };
