'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { useActiveCompany, useMe, useOnboarding, usePatchSettings, useSettings } from '@/lib/queries';
import { BuscadorDireccion, type PuntoElegido } from './BuscadorDireccion';
import { EscenaTienda } from './EscenaTienda';
import { ModalCartoon } from './ModalCartoon';
import escenas from './escenas.module.css';
import styles from './cartoon.module.css';

/**
 * "Cuéntanos de tu negocio" — el primer modal del recorrido.
 *
 * Pide dos cosas que la migración 0049 dejó de heredar del piloto: en qué se
 * especializa el negocio y dónde queda. Sin la primera, el bot se presenta como
 * un restaurante genérico; sin la segunda, Despachos no tiene desde dónde
 * calcular una ruta.
 *
 * La decisión de diseño que lo sostiene: **el dueño ve el resultado mientras
 * escribe**. La burbuja de arriba es literalmente el saludo que su bot va a
 * mandar por WhatsApp, armándose palabra por palabra. No es una vista previa
 * decorativa — es la respuesta a "¿y esto para qué me sirve?", contestada antes
 * de que alcance a preguntarla.
 */

const SUGERENCIAS = [
  'pizzería napolitana',
  'hamburguesas a la parrilla',
  'comida casera y almuerzos',
  'sushi y comida asiática',
  'panadería y repostería',
];

export function DatosNegocioModal({
  open,
  onClose,
  onCompletado,
  progreso,
}: {
  open: boolean;
  onClose: () => void;
  /** Se llama al terminar el paso. En el recorrido guiado abre el siguiente. */
  onCompletado?: () => void;
  progreso?: { actual: number; total: number };
}) {
  const terminar = onCompletado ?? onClose;
  const { data: settings } = useSettings();
  const { data: me } = useMe();
  const companyCode = useActiveCompany();
  const guardar = usePatchSettings();
  const { refetch } = useOnboarding();

  const [descripcion, setDescripcion] = useState('');
  const [punto, setPunto] = useState<PuntoElegido | null>(null);
  const [apertura, setApertura] = useState('11:00');
  const [cierre, setCierre] = useState('22:00');
  const [listo, setListo] = useState(false);
  const [latido, setLatido] = useState(false);

  const nombre =
    me?.memberships.find(m => String(m.companyCode) === companyCode)?.companyName ?? 'Tu negocio';

  // Se rellena UNA vez por apertura. Con `[open, settings]` a secas, guardar
  // cambia `settings` (actualización optimista), el efecto vuelve a correr y
  // apaga la pantalla de éxito que se acaba de encender.
  const preparado = useRef(false);
  useEffect(() => {
    if (!open) {
      preparado.current = false;
      return;
    }
    if (preparado.current || !settings) return;
    preparado.current = true;
    setListo(false);
    setDescripcion(settings.businessDescription ?? '');
    setApertura(settings.openHour || '11:00');
    setCierre(settings.closeHour || '22:00');
    if (settings.localAddress && Number.isFinite(settings.localLat)) {
      setPunto({ lat: settings.localLat, lng: settings.localLng, label: settings.localAddress });
    }
  }, [open, settings]);

  // Latido de la burbuja al cambiar el texto: confirma que lo que escribe es
  // exactamente lo que va a decir su bot.
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    setLatido(true);
    const t = setTimeout(() => setLatido(false), 340);
    return () => clearTimeout(t);
  }, [descripcion]);

  const puedeGuardar = descripcion.trim().length >= 8 && !!punto && !guardar.isPending;

  const enviar = () => {
    if (!puedeGuardar || !punto) return;
    guardar.mutate(
      {
        businessDescription: descripcion.trim(),
        localAddress: punto.label,
        localLat: punto.lat,
        localLng: punto.lng,
        openHour: apertura,
        closeHour: cierre,
      },
      {
        onSuccess: () => {
          refetch();
          // El éxito se muestra, no se anuncia con un toast que ya se fue: es
          // el primer paso que este negocio completa en su vida.
          setListo(true);
        },
      },
    );
  };

  const saludo = descripcion.trim();

  if (listo) {
    return (
      <ModalCartoon
        open={open}
        onClose={onClose}
        tono="verde"
        progreso={progreso}
        escena={<EscenaTienda nombre={nombre} celebrando />}
        titulo=""
        pie={
          <>
            {!progreso && <span />}
            <button type="button" className={styles.accion} onClick={terminar}>
              Seguir <Icon.ArrowRight size={15} />
            </button>
          </>
        }
      >
        <div className={styles.exito}>
          <h2>¡{nombre} ya tiene cara!</h2>
          <p>
            Tu bot ya sabe cómo presentarse y desde dónde salen tus domicilios. Sigue la carta: es
            lo que te falta para poder vender.
          </p>
        </div>
      </ModalCartoon>
    );
  }

  return (
    <ModalCartoon
      open={open}
      onClose={onClose}
      tono="verde"
      progreso={progreso}
      escena={
        <>
          <EscenaTienda nombre={nombre} />
          <div className={escenas.burbujaWrap}>
            <div className={escenas.burbuja} data-latido={latido}>
              ¡Hola! Somos <b>{nombre}</b>
              {saludo ? <>, {saludo}. ¿Qué se te antoja hoy? 🙌</> : <>. ¿Qué se te antoja hoy? 🙌</>}
              <span className={escenas.burbujaPie}>Así saluda tu bot</span>
            </div>
          </div>
        </>
      }
      titulo="Cuéntanos de tu negocio"
      sub="Dos datos y tu bot deja de hablar como un restaurante cualquiera."
      pie={
        <>
          <button type="button" className={styles.accionSuave} onClick={onClose}>
            Ahora no
          </button>
          <button type="button" className={styles.accion} disabled={!puedeGuardar} onClick={enviar}>
            {guardar.isPending ? 'Guardando…' : 'Guardar y seguir'}
            {!guardar.isPending && <Icon.ArrowRight size={15} />}
          </button>
        </>
      }
    >
      <label className={styles.campo}>
        <span className={styles.etiqueta}>¿Qué venden?</span>
        <textarea
          className={styles.entrada}
          rows={2}
          maxLength={300}
          value={descripcion}
          placeholder="Ej. hamburguesas a la parrilla, carne fresca todos los días"
          onChange={e => setDescripcion(e.target.value)}
        />
      </label>

      <div className={styles.sugerencias}>
        {SUGERENCIAS.map(s => (
          <button key={s} type="button" className={styles.sugerencia} onClick={() => setDescripcion(s)}>
            {s}
          </button>
        ))}
      </div>

      <BuscadorDireccion
        valor={punto}
        onElegir={setPunto}
        etiqueta="¿Dónde queda tu local?"
        estilo="cartoon"
      />

      <div className={styles.dosColumnas}>
        <label className={styles.campo}>
          <span className={styles.etiqueta}>Abren a las</span>
          <input
            className={styles.entrada}
            type="time"
            value={apertura}
            onChange={e => setApertura(e.target.value)}
          />
        </label>
        <label className={styles.campo}>
          <span className={styles.etiqueta}>Cierran a las</span>
          <input
            className={styles.entrada}
            type="time"
            value={cierre}
            onChange={e => setCierre(e.target.value)}
          />
        </label>
      </div>

      <p className={styles.pista}>
        Fuera de ese horario el bot avisa que están cerrados en vez de tomar el pedido.
      </p>
    </ModalCartoon>
  );
}
