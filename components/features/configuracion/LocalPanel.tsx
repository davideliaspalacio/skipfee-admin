'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { useSettings, usePatchSettings } from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import type { Settings } from '@/lib/api/settings';
import styles from './configuracion.module.css';

/**
 * Panel "Local": dirección + lat/lng + etiqueta corta. Es el punto de origen que
 * usa Despachos para calcular rutas. Geocodifica con Nominatim (OSM, sin API key).
 */
export function LocalPanel() {
  const { data: settings } = useSettings();
  if (!settings) return <div className={styles.card}><div className={styles.loading}>Cargando…</div></div>;
  return <LocalEditor key={settings.updatedAt} settings={settings} />;
}

const DEFAULT_LAT = 6.2447;
const DEFAULT_LNG = -75.5736;
const DEFAULT_LABEL = 'Skipfee';

async function geocodeNominatim(address: string): Promise<{ lat: number; lng: number; display: string } | null> {
  const q = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&addressdetails=0`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (data.length === 0) return null;
  const first = data[0];
  const lat = Number.parseFloat(first.lat);
  const lng = Number.parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, display: first.display_name };
}

function LocalEditor({ settings }: { settings: Settings }) {
  const patch = usePatchSettings();

  const savedAddress = settings.localAddress ?? null;
  const savedLabel = settings.localLabel || DEFAULT_LABEL;
  const savedLat = Number.isFinite(settings.localLat) ? settings.localLat : DEFAULT_LAT;
  const savedLng = Number.isFinite(settings.localLng) ? settings.localLng : DEFAULT_LNG;

  const [address, setAddress] = useState(savedAddress ?? '');
  const [label, setLabel] = useState(savedLabel);
  const [lat, setLat] = useState(String(savedLat));
  const [lng, setLng] = useState(String(savedLng));
  const [geocoding, setGeocoding] = useState(false);

  const latNum = Number.parseFloat(lat);
  const lngNum = Number.parseFloat(lng);
  const latValid = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
  const lngValid = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
  const labelValid = label.trim().length > 0 && label.trim().length <= 40;
  const allValid = latValid && lngValid && labelValid;

  const dirty =
    (address.trim() || null) !== savedAddress ||
    label.trim() !== savedLabel ||
    latNum !== savedLat ||
    lngNum !== savedLng;

  const onSave = () => {
    if (!allValid || !dirty) return;
    patch.mutate(
      {
        localAddress: address.trim() ? address.trim() : null,
        localLabel: label.trim(),
        localLat: latNum,
        localLng: lngNum,
      },
      {
        onSuccess: () => pushToast({ kind: 'success', message: 'Dirección del local actualizada.' }),
      },
    );
  };

  const onGeocode = async () => {
    const q = address.trim();
    if (!q) { pushToast({ kind: 'error', message: 'Escribí una dirección primero.' }); return; }
    setGeocoding(true);
    try {
      const hit = await geocodeNominatim(q);
      if (!hit) {
        pushToast({ kind: 'error', message: 'No se encontró esa dirección. Agregá ciudad y país (ej. "Medellín, Colombia").' });
        return;
      }
      setLat(String(hit.lat));
      setLng(String(hit.lng));
      pushToast({ kind: 'success', message: `Coordenadas encontradas: ${hit.display}` });
    } catch (err) {
      pushToast({ kind: 'error', message: `No se pudo geocodificar: ${err instanceof Error ? err.message : 'error desconocido'}` });
    } finally {
      setGeocoding(false);
    }
  };

  const mapsHref = latValid && lngValid ? `https://www.google.com/maps?q=${latNum},${lngNum}` : 'https://www.google.com/maps';
  const mapsEmbedSrc = latValid && lngValid ? `https://www.google.com/maps?q=${latNum},${lngNum}&z=16&output=embed` : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}><Icon.MapPin size={15} /> Dirección del local</div>
          <div className={styles.cardSub}>Punto de partida de los domicilios. Lo usa Despachos para optimizar rutas.</div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={`${styles.col} ${styles.full}`}>
          <span className={styles.label}>Dirección visible</span>
          <div className={styles.flexInput}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="Ej. Cra 43A #11-50, El Poblado, Medellín"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !geocoding && address.trim()) { e.preventDefault(); onGeocode(); } }}
              maxLength={200}
            />
            <button className="btn" onClick={onGeocode} disabled={!address.trim() || geocoding}>
              <Icon.Search size={13} />
              {geocoding ? 'Buscando…' : 'Buscar coordenadas'}
            </button>
          </div>
          <span className={styles.hint}>
            Escribí la dirección y presioná <b>Buscar coordenadas</b> (o Enter) para autocompletar lat/lng.
          </span>
        </div>

        <div className={styles.grid2}>
          <div className={styles.col}>
            <span className={styles.label}>Etiqueta corta (mapa)</span>
            <input className="input" placeholder="Skipfee" value={label} onChange={e => setLabel(e.target.value)} maxLength={40} />
            {!labelValid && <span className={styles.err}>Requerida (máx 40).</span>}
          </div>

          <div className={styles.col}>
            <span className={styles.label}>Coordenadas</span>
            <div className={styles.flexInput}>
              <input className="input" placeholder="Latitud" value={lat} onChange={e => setLat(e.target.value)} inputMode="decimal" />
              <input className="input" placeholder="Longitud" value={lng} onChange={e => setLng(e.target.value)} inputMode="decimal" />
            </div>
            {!latValid && <span className={styles.err}>Latitud entre -90 y 90.</span>}
            {!lngValid && <span className={styles.err}>Longitud entre -180 y 180.</span>}
          </div>
        </div>

        <div className={`${styles.col} ${styles.full}`}>
          <div className="between center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={styles.label}>Vista previa en Google Maps</span>
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm">
              <Icon.MapPin size={13} /> Ver en Google Maps
            </a>
          </div>
          {mapsEmbedSrc ? (
            <iframe
              title="Ubicación del local en Google Maps"
              src={mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ width: '100%', height: 260, border: '1px solid var(--line)', borderRadius: 10 }}
            />
          ) : (
            <div className={styles.hint} style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 10 }}>
              Ingresá coordenadas válidas para ver el mapa.
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardFoot}>
        <button className="btn btn-primary" onClick={onSave} disabled={!dirty || !allValid || patch.isPending}>
          <Icon.Check size={14} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
