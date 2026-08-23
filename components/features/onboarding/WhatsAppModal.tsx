'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { qrToDataUrl } from '@/lib/api';
import {
  useConnectWhatsAppSession,
  useOnboarding,
  useUpdateWhatsAppProvider,
  useWhatsAppProvider,
  useWhatsAppSession,
} from '@/lib/queries';
import { EscenaTelefono } from './EscenaTelefono';
import { GuiaVincular } from './GuiaVincular';
import { ModalCartoon } from './ModalCartoon';
import styles from './cartoon.module.css';
import escenas from './escenas.module.css';

/**
 * "Conecta tu WhatsApp", dentro de Primeros pasos.
 *
 * Antes este paso mandaba a Canales, una pantalla de operación con tablas de
 * comisiones y simuladores de marketplace. Alguien que lleva cuatro minutos en
 * la plataforma no debería aterrizar ahí para hacer lo único que le falta: el
 * recorrido no puede escupirte a mitad de camino.
 *
 * La decisión de fondo es cuál de los dos caminos ofrecer primero. El QR vende
 * solo —dos minutos, sin trámites— pero corre sobre el protocolo no oficial y
 * Meta puede banear el número. Así que aquí no se esconde: los dos caminos se
 * muestran con lo bueno Y lo malo de cada uno, y el riesgo del QR se acepta
 * marcando una casilla. Que alguien pierda su número por algo que no le
 * dijimos cuesta mucho más que una conversión.
 *
 * **La sesión no es un interruptor de dos posiciones.** La vinculación por QR
 * vive en un WhatsApp Web que se cae solo: el dueño cierra la sesión desde
 * "Dispositivos vinculados", el celular se queda sin internet una tarde, el
 * servidor se reinicia. Por eso esta pantalla pinta los cuatro estados que
 * puede devolver el proveedor —vinculando, conectado, desconectado y "no
 * sabemos"— y no solo los dos bonitos. Una pantalla que dice "conectado"
 * mientras nadie atiende el número es peor que una que dice "no sé".
 */
export function WhatsAppModal({
  open,
  onClose,
  onCompletado,
  progreso,
}: {
  open: boolean;
  onClose: () => void;
  onCompletado?: () => void;
  progreso?: { actual: number; total: number };
}) {
  const terminar = onCompletado ?? onClose;
  const { data: config } = useWhatsAppProvider();
  const cambiar = useUpdateWhatsAppProvider();
  const conectar = useConnectWhatsAppSession();
  const { refetch: refetchOnboarding } = useOnboarding();

  const [camino, setCamino] = useState<'elegir' | 'qr' | 'meta'>('elegir');
  const [aceptaRiesgo, setAceptaRiesgo] = useState(false);
  /** Renovaciones automáticas ya hechas. Sin tope, esto martillaría al servidor
   *  toda la noche si alguien deja el modal abierto y se va. */
  const [renovaciones, setRenovaciones] = useState(0);

  // La sesión se consulta aunque el dueño todavía no haya entrado al camino del
  // QR: si su número ya estaba vinculado —o se cayó desde el celular— el modal
  // tiene que abrir diciendo eso, no ofreciéndole elegir camino otra vez.
  const yaEnEvolution = !!config && config.provider === 'evolution' && config.evolution.configured;
  const sesion = useWhatsAppSession(open && (camino === 'qr' || yaEnEvolution));
  const estado = sesion.data?.session.status ?? 'unknown';
  const conectado = estado === 'connected';
  const qr = qrToDataUrl(sesion.data?.session.qr);

  // Un sondeo fallido suelto no borra el código de la pantalla —sería peor
  // quitárselo a alguien que ya está apuntando el celular—, pero si llevamos
  // varios segundos sin una respuesta buena, el código que se ve es papel
  // mojado y hay que decirlo. Se mide contra la última respuesta OK y no con
  // `failureCount`, que se reinicia en cada sondeo y nunca pasaría de uno.
  const SIN_RESPUESTA_MS = 8_000;
  const sinRespuestaBuena = sesion.isError && Date.now() - sesion.dataUpdatedAt > SIN_RESPUESTA_MS;

  /**
   * Qué se ve dentro del camino del QR.
   *
   * `connecting` es ambiguo en Evolution: vale tanto para "el código está en
   * pantalla esperando a que alguien lo escanee" como para "ya lo escanearon y
   * se está emparejando". Lo que desempata es el código: mientras el proveedor
   * nos entregue uno, hay algo que escanear; cuando deja de entregarlo y la
   * sesión sigue intentándolo, es que el celular ya lo tomó.
   */
  const fase: 'preparando' | 'escanea' | 'vinculando' | 'desconectado' | 'error' =
    conectar.isPending && !qr
      ? 'preparando'
      : sinRespuestaBuena
        ? 'error'
        : estado === 'disconnected'
          ? 'desconectado'
          : qr
            ? 'escanea'
            : estado === 'connecting'
              ? 'vinculando'
              : sesion.data
                ? // Respondió, pero con un estado que no sabemos leer. Decir
                  // "preparando" aquí sería inventarse una respuesta.
                  'error'
                : 'preparando';

  useEffect(() => {
    if (!open) {
      setCamino('elegir');
      setAceptaRiesgo(false);
      setRenovaciones(0);
    }
  }, [open]);

  // El código de Evolution vence cerca del minuto. Se renueva SOLO, antes de
  // que caduque, en vez de dejar que el dueño escanee un código muerto y crea
  // que la vinculación no sirve. Con tope: a las cinco renovaciones (unos
  // cuatro minutos) se para y se le pide que lo pida a mano.
  const RENOVACIONES_MAX = 5;
  useEffect(() => {
    // Solo mientras hay un código en pantalla. Renovar durante el emparejado
    // pediría un QR nuevo justo cuando ya no hace falta, y renovar sobre una
    // sesión caída la volvería a "vincular" sola, sin que nadie lo pidiera.
    if (!open || camino !== 'qr' || fase !== 'escanea') return;
    if (renovaciones >= RENOVACIONES_MAX) return;
    const t = setTimeout(() => {
      conectar.mutate(undefined, { onSuccess: () => setRenovaciones(n => n + 1) });
    }, 50_000);
    return () => clearTimeout(t);
    // `qr` en las dependencias: cada código nuevo reinicia su propia cuenta.
  }, [open, camino, fase, qr, renovaciones, conectar]);

  // El checklist lee el estado guardado en la empresa, así que cualquier
  // cambio real —quedó conectado, o se cayó— tiene que reflejarse ahí sin que
  // el dueño adivine que debe recargar la página.
  useEffect(() => {
    if (estado === 'connected' || estado === 'disconnected') refetchOnboarding();
  }, [estado, refetchOnboarding]);

  const empezarQr = () => {
    cambiar.mutate(
      { provider: 'evolution' },
      {
        onSuccess: () => {
          setCamino('qr');
          conectar.mutate();
        },
      },
    );
  };

  const pedirCodigo = () => {
    setRenovaciones(0);
    conectar.mutate();
  };

  const volver = (
    <button type="button" className={styles.accionSuave} onClick={() => setCamino('elegir')}>
      Volver
    </button>
  );

  // ------------------------------------------------------------- conectado
  if (conectado) {
    return (
      <ModalCartoon
        open={open}
        onClose={onClose}
        tono="verde"
        progreso={progreso}
        escena={<EscenaTelefono estado="conectado" />}
        titulo=""
        pie={
          <>
            {!progreso && <span />}
            <button type="button" className={styles.accion} onClick={terminar}>
              Listo <Icon.Check size={15} />
            </button>
          </>
        }
      >
        <div className={styles.exito}>
          <h2>¡Tu WhatsApp ya atiende!</h2>
          <p>
            Escríbele a tu propio número desde otro celular y mira cómo responde. Ese primer pedido
            de prueba es el que te dice que todo quedó bien.
          </p>
        </div>
      </ModalCartoon>
    );
  }

  // -------------------------------------------------------------- el QR
  if (camino === 'qr') {
    // La sesión existe pero está cerrada. Casi siempre: la cerraron desde el
    // celular. Se dice qué se rompió y qué cuesta, no un "reintentar" pelado.
    if (fase === 'desconectado') {
      return (
        <ModalCartoon
          open={open}
          onClose={onClose}
          tono="sol"
          escena={<EscenaTelefono estado="desconectado" />}
          titulo="Tu WhatsApp no está vinculado"
          sub="La sesión está cerrada. Suele pasar cuando se cierra desde el celular, en Dispositivos vinculados, o cuando el teléfono pasa mucho tiempo sin internet."
          pie={
            <>
              {volver}
              <button
                type="button"
                className={styles.accion}
                onClick={pedirCodigo}
                disabled={conectar.isPending}
              >
                {conectar.isPending ? 'Generando…' : 'Volver a escanear'}
                {!conectar.isPending && <Icon.ArrowRight size={15} />}
              </button>
            </>
          }
        >
          <ul className={styles.lista}>
            <li>
              <Icon.AlertTriangle size={16} />
              <span>
                Mientras esté así, <b>tus clientes escriben y nadie les responde</b>: el bot no
                recibe los mensajes.
              </span>
            </li>
            <li>
              <Icon.Clock size={16} />
              <span>
                Se arregla escaneando otra vez con el celular del negocio. Toma menos de un minuto.
              </span>
            </li>
          </ul>
        </ModalCartoon>
      );
    }

    // Ni conectado ni desconectado: no logramos preguntarle al servidor. Se
    // dice tal cual — inventar "todo bien" aquí es lo que hace que un negocio
    // pase el día sin recibir un solo pedido creyendo que está al aire.
    if (fase === 'error') {
      return (
        <ModalCartoon
          open={open}
          onClose={onClose}
          tono="sol"
          escena={<EscenaTelefono estado="esperando" />}
          titulo="No pudimos confirmar tu WhatsApp"
          sub="El servidor que sostiene la conexión no respondió, así que no sabemos si tu número está atendiendo."
          pie={
            <>
              {volver}
              <button
                type="button"
                className={styles.accion}
                onClick={pedirCodigo}
                disabled={conectar.isPending}
              >
                {conectar.isPending ? 'Reintentando…' : 'Reintentar'}
              </button>
            </>
          }
        >
          <p className={styles.pista}>
            {sesion.error?.message ?? 'Vuelve a intentarlo en un momento.'}
          </p>
        </ModalCartoon>
      );
    }

    // Ya escanearon: el proveedor dejó de ofrecer código y sigue emparejando.
    // Este es el hueco en el que antes no pasaba nada en pantalla.
    if (fase === 'vinculando') {
      return (
        <ModalCartoon
          open={open}
          onClose={onClose}
          tono="cielo"
          escena={<EscenaTelefono estado="vinculando" />}
          titulo="Vinculando tu WhatsApp"
          sub="Tu celular ya tomó el código. Estamos emparejando la sesión: no cierres esta ventana."
          pie={
            <>
              {volver}
              <button
                type="button"
                className={styles.accion}
                onClick={pedirCodigo}
                disabled={conectar.isPending}
              >
                {conectar.isPending ? 'Generando…' : 'Generar otro código'}
              </button>
            </>
          }
        >
          <div className={styles.cargandoFila} role="status" aria-live="polite">
            <span className={styles.cargandoGiro} aria-hidden="true" />
            Ya casi: conectando con WhatsApp…
          </div>
          <p className={styles.pista}>
            Suele tomar unos segundos. Si se queda aquí más de un minuto, genera otro código y
            vuelve a escanear.
          </p>
        </ModalCartoon>
      );
    }

    return (
      <ModalCartoon
        open={open}
        onClose={onClose}
        tono="cielo"
        escena={<EscenaTelefono estado={fase === 'escanea' ? 'escanea' : 'esperando'} />}
        ancho="ancho"
        titulo={fase === 'escanea' ? 'Escanea con tu WhatsApp' : 'Preparando tu conexión…'}
        sub={
          fase === 'escanea'
            ? 'Sigue estos cuatro pasos en el celular del negocio.'
            : 'Esto toma unos segundos. No cierres esta ventana.'
        }
        pie={
          <>
            {volver}
            <button
              type="button"
              className={styles.accion}
              onClick={pedirCodigo}
              disabled={conectar.isPending}
            >
              {conectar.isPending ? 'Generando…' : 'Generar otro código'}
            </button>
          </>
        }
      >
        {/* La guía a la izquierda y el código a la derecha: se lee un paso y se
            mira el QR sin perder el sitio. Apilados, el código queda fuera de
            pantalla justo cuando hay que apuntarle. */}
        <div className={styles.vincular}>
          <GuiaVincular />

          <div className={styles.columnaQr}>
            <div className={escenas.qrCaja}>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="Código QR para vincular WhatsApp" />
              ) : (
                <div className={escenas.qrVacio}>
                  <span className={escenas.qrSpin} />
                </div>
              )}
            </div>
            <p className={styles.pista} role="status" aria-live="polite">
              {renovaciones >= RENOVACIONES_MAX
                ? '¿Sigues ahí? Genera otro código para continuar.'
                : 'El código se renueva solo. Apenas lo escanees, esta pantalla cambia sola.'}
            </p>
          </div>
        </div>
      </ModalCartoon>
    );
  }

  // ------------------------------------------------------------- Meta
  if (camino === 'meta') {
    return (
      <ModalCartoon
        open={open}
        onClose={onClose}
        tono="cielo"
        escena={<EscenaTelefono estado="oficial" />}
        titulo="El camino oficial de Meta"
        sub="Es el que recomendamos si ya vendes en serio: tu número queda verificado y no hay riesgo de bloqueo."
        pie={
          <>
            {volver}
            <button type="button" className={styles.accion} onClick={onClose}>
              Entendido
            </button>
          </>
        }
      >
        <ul className={styles.lista}>
          <li>
            <Icon.CheckCircle size={16} />
            <span>Tu nombre comercial aparece verificado en el chat.</span>
          </li>
          <li>
            <Icon.CheckCircle size={16} />
            <span>Botones y listas nativos: el cliente toca en vez de escribir números.</span>
          </li>
          <li>
            <Icon.Clock size={16} />
            <span>
              Meta pide verificación del número, PIN y revisión del nombre. El equipo de Skipfee
              hace el trámite contigo — <b>escríbenos y lo arrancamos</b>.
            </span>
          </li>
        </ul>
      </ModalCartoon>
    );
  }

  // ----------------------------------------------------------- elegir
  return (
    <ModalCartoon
      open={open}
      onClose={onClose}
      tono="cielo"
      progreso={progreso}
      escena={<EscenaTelefono estado={estado === 'disconnected' ? 'desconectado' : 'elegir'} />}
      titulo="Conecta tu WhatsApp"
      sub="Dos caminos. Uno es inmediato, el otro es el oficial de Meta."
      pie={
        <>
          <button type="button" className={styles.accionSuave} onClick={onClose}>
            Ahora no
          </button>
          <button
            type="button"
            className={styles.accion}
            disabled={!aceptaRiesgo || cambiar.isPending}
            onClick={empezarQr}
          >
            {cambiar.isPending ? 'Preparando…' : 'Conectar con QR'}
            {!cambiar.isPending && <Icon.ArrowRight size={15} />}
          </button>
        </>
      }
    >
      <div className={styles.caminos}>
        <div className={styles.camino} data-recomendado="true">
          <span className={styles.caminoTitulo}>
            <Icon.Wifi size={16} /> Escanear un QR
          </span>
          <span className={styles.caminoTexto}>
            Como WhatsApp Web. Dos minutos, sin trámites, con el número que ya usas.
          </span>
          <span className={styles.caminoAviso}>
            <Icon.AlertTriangle size={14} /> No es un canal oficial: Meta puede bloquear el número.
          </span>
        </div>

        <button type="button" className={styles.camino} onClick={() => setCamino('meta')}>
          <span className={styles.caminoTitulo}>
            <Icon.CheckCircle size={16} /> El oficial de Meta
          </span>
          <span className={styles.caminoTexto}>
            Número verificado, botones nativos, cero riesgo de bloqueo. Requiere trámite.
          </span>
          <span className={styles.caminoLink}>Ver cómo se hace →</span>
        </button>
      </div>

      <label className={styles.acepta}>
        <input
          type="checkbox"
          checked={aceptaRiesgo}
          onChange={e => setAceptaRiesgo(e.target.checked)}
        />
        <span>
          Entiendo que el QR usa un canal no oficial y que Meta podría bloquear mi número.
        </span>
      </label>

      {/* Redactado sin suponer historia: sirve igual para quien nunca vinculó y
          para quien acaba de cerrar la sesión desde el celular. */}
      {estado === 'disconnected' && (
        <p className={styles.pista}>
          Ahora mismo tu WhatsApp no está vinculado, así que el bot no está atendiendo. Conéctalo
          con el código QR para reactivarlo.
        </p>
      )}

      {config?.provider === 'kapso' && config.kapso.configured && (
        <p className={styles.pista}>
          Ya tienes el canal oficial configurado. Conectar por QR lo reemplaza.
        </p>
      )}
    </ModalCartoon>
  );
}
