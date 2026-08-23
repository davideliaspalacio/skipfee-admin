import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectWhatsAppSession,
  fetchWhatsAppProvider,
  fetchWhatsAppSession,
  logoutWhatsAppSession,
  updateWhatsAppProvider,
  type UpdateProviderBody,
  type WhatsAppProviderConfig,
  type WhatsAppSessionResult,
} from '../api';
import { ApiError } from '../api';
import { useActiveCompany } from './company';
import { whatsappKeys } from './keys';
import { pushToast } from '../toast';

/**
 * El QR de WhatsApp caduca cerca del minuto, así que mientras se está
 * vinculando hay que refrescar seguido. Una vez vinculado, la pregunta cambia:
 * ya no es "¿escaneó?" sino "¿está entrando tráfico?", que tolera menos ritmo.
 */
const POLL_LINKING_MS = 3_000;
const POLL_WAITING_TRAFFIC_MS = 5_000;
const POLL_IDLE_MS = 30_000;

export function useWhatsAppProvider() {
  const company = useActiveCompany();
  return useQuery<WhatsAppProviderConfig>({
    queryKey: whatsappKeys.provider(),
    queryFn: fetchWhatsAppProvider,
    enabled: !!company,
  });
}

/**
 * Sesión del proveedor. Solo aplica a Evolution: en Kapso el backend responde
 * 409 (no es un error, es que la pregunta no aplica), así que ni se consulta.
 */
export function useWhatsAppSession(enabled: boolean) {
  const company = useActiveCompany();
  const qc = useQueryClient();
  return useQuery<WhatsAppSessionResult>({
    queryKey: whatsappKeys.session(),
    // El GET pregunta el ESTADO, y Evolution no devuelve el QR ahí: solo lo
    // entrega el connect. Sin este merge, el primer sondeo (3 s después de
    // generarlo) borraba el código de la pantalla; el dueño creía que se había
    // caído y pedía otro, lo que invalida el anterior. De ahí salía la
    // sensación de "se generan QR sin parar".
    //
    // El código se conserva SOLO mientras la sesión sigue intentando vincularse
    // (`connecting`). Antes se conservaba en cualquier estado distinto de
    // `connected`, y eso tapaba justo el caso que hay que ver: si el dueño
    // cierra la sesión desde el celular, el estado cae a `disconnected` y el
    // panel seguía mostrando un QR muerto como si aún hubiera algo que
    // escanear. Un QR que sobrevive a la desconexión es una mentira en
    // pantalla.
    queryFn: async () => {
      const fresco = await fetchWhatsAppSession();
      // El caché se lee DESPUÉS de la respuesta, no antes: si el sondeo salió
      // volando justo antes de que el connect trajera el código, leerlo antes
      // devolvía "no había QR" y al aterrizar pisaba el que el connect acababa
      // de guardar. El dueño veía el código parpadear y desaparecer.
      const previo = qc.getQueryData<WhatsAppSessionResult>(whatsappKeys.session());
      if (fresco.session.status === 'connecting' && !fresco.session.qr && previo?.session.qr) {
        return { ...fresco, session: { ...fresco.session, qr: previo.session.qr } };
      }
      return fresco;
    },
    enabled: !!company && enabled,
    // No reintentar un 409/502: el primero ya dijo todo lo que hay que saber.
    retry: (count, err) => !(err instanceof ApiError) && count < 2,
    refetchInterval: query => {
      const data = query.state.data;
      if (!data) return POLL_LINKING_MS;
      if (data.session.status !== 'connected') return POLL_LINKING_MS;
      // Vinculado pero sin tráfico: seguimos mirando hasta el primer mensaje.
      if (!data.lastInboundAt) return POLL_WAITING_TRAFFIC_MS;
      return POLL_IDLE_MS;
    },
    refetchIntervalInBackground: false,
  });
}

export function useUpdateWhatsAppProvider() {
  const qc = useQueryClient();
  return useMutation<{ provider?: string }, Error, UpdateProviderBody>({
    mutationFn: updateWhatsAppProvider,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: whatsappKeys.all() });
      pushToast({
        kind: 'success',
        message: vars.provider
          ? `Canal cambiado a ${vars.provider === 'kapso' ? 'WhatsApp oficial' : 'Evolution'}`
          : 'Datos del servidor guardados',
      });
    },
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}

export function useConnectWhatsAppSession() {
  const qc = useQueryClient();
  return useMutation<WhatsAppSessionResult, Error, void>({
    mutationFn: connectWhatsAppSession,
    onSuccess: data => {
      qc.setQueryData(whatsappKeys.session(), data);
      qc.invalidateQueries({ queryKey: whatsappKeys.provider() });
      // El webhook es lo que hace que ENTREN pedidos. Si no quedó registrado,
      // la sesión se vería conectada y no llegaría nada: hay que decirlo.
      if (data.webhook && !data.webhook.registered) {
        pushToast({
          kind: 'error',
          message: 'WhatsApp se vinculó, pero no se pudo avisar al servidor dónde entregarnos los mensajes.',
        });
      }
    },
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}

export function useLogoutWhatsAppSession() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, void>({
    mutationFn: logoutWhatsAppSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whatsappKeys.all() });
      pushToast({ kind: 'success', message: 'WhatsApp desvinculado' });
    },
    onError: err => pushToast({ kind: 'error', message: err.message }),
  });
}
