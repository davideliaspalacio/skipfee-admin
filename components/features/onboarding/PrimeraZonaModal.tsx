'use client';

import { useEffect, useRef, useState } from 'react';
import { ColorScheme, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Icon } from '@/lib/icons';
import { ModalCartoon } from './ModalCartoon';
import { EscenaZona } from './EscenaZona';
import cartoon from './cartoon.module.css';
import { COP } from '@/lib/data';
import { useIsDark } from '@/lib/hooks';
import { useCreateZone, usePatchZone, usePatchSettings, useSettings } from '@/lib/queries';
import { BuscadorDireccion, type PuntoElegido } from './BuscadorDireccion';
import styles from './onboarding.module.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const RADIO_MIN_M = 500;
const RADIO_MAX_M = 8000;
const RADIO_PASO_M = 250;
const RADIO_DEFAULT_M = 2000;
const TARIFA_DEFAULT = 5000;
const COLOR_DEFAULT = '#22C55E';

function enMetros(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${m} m`;
}

function zoomParaRadio(r: number): number {
  if (r <= 800) return 14;
  if (r <= 1500) return 13;
  if (r <= 3000) return 12;
  if (r <= 6000) return 11;
  return 10;
}

/**
 * Asistente de primera zona.
 *
 * Por qué existe: la zona de cobertura es el concepto que más gente abandona.
 * No es que el editor sea difícil —es que "polígono" no significa nada para
 * quien vende sánduches—. Así que esto hace dos cosas antes de pedir un dato:
 * explica qué es una zona con un dibujo, y ofrece la versión de treinta
 * segundos (mi local + cuántas cuadras a la redonda + cuánto cobro).
 *
 * El polígono sigue existiendo en Configuración → Zonas, como refinamiento. Un
 * dueño a las once de la noche no quiere dibujar un contorno; lo va a querer el
 * mes siguiente, cuando ya esté vendiendo.
 */
export function PrimeraZonaModal({
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
  const [paso, setPaso] = useState<'explicacion' | 'definir'>('explicacion');

  // Cada vez que se abre, arranca por la explicación: quien lo cerró sin
  // entender merece leerla de nuevo, y a quien ya entendió le cuesta un clic.
  useEffect(() => {
    if (open) setPaso('explicacion');
  }, [open]);

  if (paso === 'explicacion') {
    return (
      <ModalCartoon
        open={open}
        onClose={onClose}
        tono="cielo"
        progreso={progreso}
        escena={<EscenaZona />}
        titulo="¿Hasta dónde repartes?"
        sub="Un minuto de contexto antes de configurarlo."
        pie={
          <>
            <button type="button" className={cartoon.accionSuave} onClick={onClose}>
              Ahora no
            </button>
            <button type="button" className={cartoon.accion} onClick={() => setPaso('definir')}>
              Definir mi zona <Icon.ArrowRight size={15} />
            </button>
          </>
        }
      >
        <ul className={cartoon.lista}>
          <li>
            <Icon.MapPin size={16} />
            <span>
              <b>La zona es hasta dónde llevas.</b> Cuando un cliente da su dirección, el bot mira
              si cae adentro.
            </span>
          </li>
          <li>
            <Icon.DollarSign size={16} />
            <span>
              <b>Cada zona tiene su tarifa.</b> El bot la suma al pedido sin que tengas que decir
              nada.
            </span>
          </li>
          <li>
            <Icon.MessageCircle size={16} />
            <span>
              <b>Si queda fuera, el bot lo dice.</b> No te llega el pedido ni tienes que responder
              que no llegas hasta allá.
            </span>
          </li>
        </ul>
        <p className={cartoon.pista}>
          Empieza con un radio desde tu local. Si después quieres afinar el contorno calle por
          calle, se hace en Configuración.
        </p>
      </ModalCartoon>
    );
  }

  return (
    <DefinirZona
      open={open}
      onClose={onClose}
      onCompletado={onCompletado ?? onClose}
      progreso={progreso}
      onVolver={() => setPaso('explicacion')}
    />
  );
}

function DefinirZona({
  open,
  onClose,
  onCompletado,
  onVolver,
  progreso,
}: {
  open: boolean;
  onClose: () => void;
  onCompletado: () => void;
  onVolver: () => void;
  progreso?: { actual: number; total: number };
}) {
  const { data: settings } = useSettings();
  const crear = useCreateZone();
  const parchar = usePatchZone();
  const guardarSettings = usePatchSettings();
  const dark = useIsDark();

  const guardado = useRef(false);
  const [nombre, setNombre] = useState('');
  const [tarifa, setTarifa] = useState(TARIFA_DEFAULT);
  const [radio, setRadio] = useState(RADIO_DEFAULT_M);
  const [punto, setPunto] = useState<PuntoElegido | null>(null);

  // Prefill solo si el negocio ya confirmó su dirección. `localLat`/`localLng`
  // traen por defecto el centro de Medellín: dar eso por bueno le arma a un
  // restaurante de Bogotá una zona en otra ciudad sin que se entere.
  useEffect(() => {
    if (!open || !settings?.localAddress) return;
    if (Number.isFinite(settings.localLat) && Number.isFinite(settings.localLng)) {
      setPunto({ lat: settings.localLat, lng: settings.localLng, label: settings.localAddress });
    }
  }, [open, settings]);

  const guardando = crear.isPending || parchar.isPending;
  const listo = !!punto && nombre.trim().length > 0 && tarifa >= 0 && !guardando;

  const guardar = () => {
    if (!punto || guardado.current) return;
    guardado.current = true;
    crear.mutate(
      { name: nombre.trim(), tarifa, color: COLOR_DEFAULT, lat: punto.lat, lng: punto.lng },
      {
        onSuccess: zona => {
          // El radio va en un PATCH aparte: `createZone` no lo recibe.
          parchar.mutate(
            { zoneId: zona.id, body: { coverageRadiusM: radio } },
            { onSettled: () => { guardado.current = false; onCompletado(); } },
          );
          // Si el negocio todavía no tiene dirección, la que acaba de elegir es
          // la suya: se guarda para que Despachos y el bot tengan origen.
          if (settings && !settings.localAddress) {
            guardarSettings.mutate({
              localAddress: punto.label,
              localLat: punto.lat,
              localLng: punto.lng,
            });
          }
        },
        onError: () => { guardado.current = false; },
      },
    );
  };

  return (
    <ModalCartoon
      open={open}
      onClose={onClose}
      tono="cielo"
      ancho="ancho"
      progreso={progreso}
      escena={<EscenaZona radio={radio} />}
      titulo="Tu primera zona"
      sub="Dónde queda tu local, cuántos kilómetros a la redonda y cuánto cobras."
      pie={
        <>
          <button
            type="button"
            className={cartoon.accionSuave}
            onClick={onVolver}
            disabled={guardando}
          >
            Atrás
          </button>
          <button type="button" className={cartoon.accion} onClick={guardar} disabled={!listo}>
            {guardando ? 'Creando…' : 'Crear zona'}
          </button>
        </>
      }
    >
      <div className={styles.zonaForm}>
        <div className={styles.zonaCampos}>
          <BuscadorDireccion
            valor={punto}
            estilo="cartoon"
            onElegir={p => {
              setPunto(p);
              if (!nombre.trim()) setNombre(p.label.split(',')[0].slice(0, 60));
            }}
          />

          <label className={cartoon.campo}>
            <span className={cartoon.etiqueta}>¿Hasta dónde repartes?</span>
            <input
              type="range"
              className={styles.rango}
              min={RADIO_MIN_M}
              max={RADIO_MAX_M}
              step={RADIO_PASO_M}
              value={radio}
              onChange={e => setRadio(Number(e.target.value))}
            />
            <span className={cartoon.pista}>
              <b>{enMetros(radio)}</b> a la redonda desde tu local
            </span>
          </label>

          <div className={cartoon.dosColumnas}>
            <label className={cartoon.campo}>
              <span className={cartoon.etiqueta}>Nombre de la zona</span>
              <input
                className={cartoon.entrada}
                value={nombre}
                maxLength={60}
                placeholder="Ej. El Poblado"
                onChange={e => setNombre(e.target.value)}
              />
              <span className={cartoon.pista}>Así la ve el cliente en el chat.</span>
            </label>

            <label className={cartoon.campo}>
              <span className={cartoon.etiqueta}>Domicilio</span>
              <input
                className={cartoon.entrada}
                type="number"
                min={0}
                step={500}
                value={tarifa}
                onChange={e => setTarifa(Math.max(0, Number(e.target.value)))}
              />
              <span className={cartoon.pista}>
                {tarifa === 0 ? 'Domicilio gratis.' : `${COP(tarifa)} por pedido.`}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.zonaMapa}>
          {API_KEY && punto ? (
            <Map
              mapId={MAP_ID}
              defaultCenter={punto}
              defaultZoom={zoomParaRadio(radio)}
              gestureHandling="greedy"
              disableDefaultUI
              colorScheme={dark ? ColorScheme.DARK : ColorScheme.LIGHT}
              style={{ width: '100%', height: '100%' }}
            >
              <AnilloCobertura centro={punto} radio={radio} />
            </Map>
          ) : (
            <div className={styles.mapaVacio}>
              <Icon.MapPin size={20} />
              <span>
                {punto
                  ? 'El mapa no está disponible, pero la zona se crea igual.'
                  : 'Busca la dirección de tu local y verás aquí hasta dónde llega tu domicilio.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </ModalCartoon>
  );
}

/** Dibuja el radio sobre el mapa. Se redibuja al mover el slider. */
function AnilloCobertura({ centro, radio }: { centro: { lat: number; lng: number }; radio: number }) {
  const map = useMap();
  // `google.maps.Circle` no existe hasta que carga la librería `maps`.
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;
    const anillo = new google.maps.Circle({
      map,
      center: centro,
      radius: radio,
      strokeColor: COLOR_DEFAULT,
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: COLOR_DEFAULT,
      fillOpacity: 0.16,
      clickable: false,
    });
    const punto = new google.maps.Circle({
      map,
      center: centro,
      radius: Math.max(radio * 0.03, 25),
      strokeWeight: 0,
      fillColor: COLOR_DEFAULT,
      fillOpacity: 0.95,
      clickable: false,
    });
    map.fitBounds(anillo.getBounds()!, 24);
    return () => {
      anillo.setMap(null);
      punto.setMap(null);
    };
  }, [map, mapsLib, centro, radio]);

  return null;
}
