'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Icon } from '@/lib/icons';
import {
  asPlacesLibrary,
  createSessionToken,
  fetchPlaceLocation,
  fetchPlacePredictions,
  type PlacePrediction,
} from '@/lib/geo/googlePlaces';
import styles from './onboarding.module.css';
import cartoon from './cartoon.module.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PuntoElegido {
  lat: number;
  lng: number;
  label: string;
}

/** Autocompletado de Google Places, limitado a Colombia. */
export function BuscadorDireccion({
  valor,
  onElegir,
  etiqueta = 'Dirección de tu local',
  estilo = 'panel',
}: {
  valor: PuntoElegido | null;
  onElegir: (p: PuntoElegido) => void;
  etiqueta?: string;
  /** 'cartoon' lo viste con el mundo de Primeros pasos; 'panel' con el del admin. */
  estilo?: 'panel' | 'cartoon';
}) {
  const c = estilo === 'cartoon' ? cartoon : null;
  const placesLib = asPlacesLibrary(useMapsLibrary('places'));
  const token = useRef<object | null>(null);
  const [texto, setTexto] = useState('');
  const [sugerencias, setSugerencias] = useState<PlacePrediction[]>([]);
  const [resolviendo, setResolviendo] = useState(false);
  const listaRef = useRef<HTMLUListElement>(null);

  const consulta = texto.trim();

  useEffect(() => {
    if (!placesLib || consulta.length < 3) {
      setSugerencias([]);
      return;
    }
    if (!token.current) token.current = createSessionToken(placesLib);
    let vivo = true;
    const t = setTimeout(() => {
      fetchPlacePredictions(placesLib, consulta, token.current as object)
        .then(r => { if (vivo) setSugerencias(r.slice(0, 5)); })
        .catch(() => { if (vivo) setSugerencias([]); });
    }, 280);
    return () => { vivo = false; clearTimeout(t); };
  }, [consulta, placesLib]);

  // El desplegable puede abrirse por debajo del borde del modal, que scrollea.
  // Traerlo a la vista evita el caso peor: escribir, no ver nada y creer que la
  // búsqueda no funcionó.
  useEffect(() => {
    if (sugerencias.length > 0) {
      listaRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [sugerencias]);

  const elegir = async (p: PlacePrediction) => {
    setResolviendo(true);
    try {
      const lugar = await fetchPlaceLocation(p);
      if (lugar) onElegir({ lat: lugar.lat, lng: lugar.lng, label: p.fullText });
      setTexto('');
      setSugerencias([]);
      token.current = null;
    } finally {
      setResolviendo(false);
    }
  };

  const ayuda = useMemo(() => {
    if (!API_KEY || !placesLib) return 'Escribe la dirección tal como la conocen tus clientes.';
    return 'Empieza a escribir y elige de la lista.';
  }, [placesLib]);

  return (
    <div className={c ? c.campo : styles.campo}>
      <span className={c ? c.etiqueta : styles.campoLabel}>{etiqueta}</span>

      {valor && (
        <div className={c ? c.elegido : styles.direccionElegida}>
          <Icon.MapPin size={14} />
          <span>{valor.label}</span>
        </div>
      )}

      <div className={c ? c.buscador : styles.buscador}>
        <input
          className={c ? c.entrada : 'input'}
          value={texto}
          placeholder={valor ? 'Cambiar la dirección…' : 'Ej. Carrera 43A #7-50, Medellín'}
          onChange={e => setTexto(e.target.value)}
          aria-label="Buscar la dirección del local"
        />
        {resolviendo && <span className={c ? c.buscando : styles.buscadorEstado}>Buscando…</span>}

        {sugerencias.length > 0 && (
          <ul ref={listaRef} className={c ? c.sugerenciasLugar : styles.sugerencias}>
            {sugerencias.map(s => (
              <li key={s.placeId}>
                <button type="button" onClick={() => elegir(s)}>
                  <b>{s.mainText}</b>
                  <small>{s.secondaryText}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className={c ? c.pista : styles.campoAyuda}>{ayuda}</span>
    </div>
  );
}
