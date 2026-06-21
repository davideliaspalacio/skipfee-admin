import { useQuery } from '@tanstack/react-query';
import { fetchSurveys, type Survey } from '../api';
import { surveyKeys } from './keys';
import { useActiveCompany } from './company';

const SURVEYS_POLL_MS = 60_000;

/** Todas las reseñas/calificaciones respondidas (reporte en Configuración). */
export function useSurveys(days = 90) {
  const company = useActiveCompany();
  return useQuery<Survey[]>({
    queryKey: surveyKeys.list(days),
    queryFn: () => fetchSurveys({ days }),
    enabled: !!company,
    refetchInterval: SURVEYS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
