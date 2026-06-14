import { useQuery } from '@tanstack/react-query';
import { fetchSurveys, type Survey } from '../api';
import { surveyKeys } from './keys';

const SURVEYS_POLL_MS = 60_000;

/** Todas las reseñas/calificaciones respondidas (reporte en Configuración). */
export function useSurveys(days = 90) {
  return useQuery<Survey[]>({
    queryKey: surveyKeys.list(days),
    queryFn: () => fetchSurveys({ days }),
    refetchInterval: SURVEYS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}
