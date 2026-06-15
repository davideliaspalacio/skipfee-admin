'use client';

import { useEffect, useRef, useState } from 'react';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Icon } from '@/lib/icons';
import type { Zone } from '@/lib/data';
import type { PatchZoneBody } from '@/lib/api';
import { usePatchZone } from '@/lib/queries';
import { pushToast } from '@/lib/toast';
import { fetchShapeAtPoint } from '@/lib/geo/nominatim';
import {
  asPlacesLibrary,
  createSessionToken,
  fetchPlacePredictions,
  fetchPlaceLocation,
  type PlacePrediction,
} from '@/lib/geo/googlePlaces';
import styles from './configuracion.module.css';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const MEDELLIN = { lat: 6.2442, lng: -75.5812 };

const DEFAULT_RADIUS_M = 600;
const MIN_RADIUS_M = 150;
const MAX_RADIUS_M = 4000;
const RADIUS_STEP_M = 50;

type Pt = { lat: number; lng: number };
type Mode = 'polygon' | 'radius';
type SearchState = 'idle' | 'searching' | 'resolving' | 'empty' | 'error';

function formatMeters(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${Math.round(m)} m`;
}

function radiusToZoom(r: number): number {
  if (r <= 250) return 16;
  if (r <= 500) return 15;
  if (r <= 1000) return 14;
  if (r <= 2000) return 13;
  return 12;
}

function hasCoverage(z: Zone): boolean {
  return Boolean((z.coverage && z.coverage.length >= 3) || (z.coverageRadiusM && z.coverageRadiusM > 0));
}

/**
 * Editor de cobertura por zona (portado del Vite app). Buscás el barrio/comuna con
 * Google Places (autocompletado); al elegirlo tomamos sus coordenadas y le pedimos a
 * OpenStreetMap la forma real del área que las contiene. Si trae contorno se carga como
 * polígono; si no, cae a "centro + radio". El <APIProvider> se monta a nivel de app.
 */
export function ZonaCoverageMap({ zones }: { zones: Zone[] }) {
  if (!API_KEY) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div className={styles.cardTitle}><Icon.MapPin size={15} /> Mapa de cobertura</div>
        </div>
        <div className={styles.loading}>
          Configurá <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> (con Places API New) para buscar y marcar la cobertura.
        </div>
      </div>
    );
  }
  return <CoverageEditor zones={zones} />;
}

function CoverageEditor({ zones }: { zones: Zone[] }) {
  const active = zones.filter((z) => !z.archived);
  const patch = usePatchZone();
  const placesLib = asPlacesLibrary(useMapsLibrary('places'));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('radius');
  const [draft, setDraft] = useState<Pt[]>([]);
  const [center, setCenter] = useState<Pt | null>(null);
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_M);
  const [focusKey, setFocusKey] = useState(0);

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [appliedLabel, setAppliedLabel] = useState<string | null>(null);
  const tokenRef = useRef<object | null>(null);

  function resetEditing() {
    setEditingId(null);
    setMode('radius');
    setDraft([]);
    setCenter(null);
    setRadius(DEFAULT_RADIUS_M);
    setQuery('');
    setPredictions([]);
    setSearchState('idle');
    setAppliedLabel(null);
    tokenRef.current = null;
  }

  function startEdit(z: Zone) {
    if (editingId === z.id) {
      resetEditing();
      return;
    }
    setEditingId(z.id);
    setQuery('');
    setPredictions([]);
    setSearchState('idle');
    setAppliedLabel(null);
    tokenRef.current = null;
    setCenter({ lat: z.lat, lng: z.lng });
    if (z.coverage && z.coverage.length >= 3) {
      setMode('polygon');
      setDraft(z.coverage.map((p) => ({ lat: p.lat, lng: p.lng })));
    } else if (z.coverageRadiusM && z.coverageRadiusM > 0) {
      setMode('radius');
      setDraft([]);
      setRadius(z.coverageRadiusM);
    } else {
      setMode('radius');
      setDraft([]);
      setRadius(DEFAULT_RADIUS_M);
    }
    setFocusKey((k) => k + 1);
  }

  async function applyPrediction(pred: PlacePrediction) {
    setPredictions([]);
    setQuery(pred.mainText);
    setSearchState('resolving');
    try {
      const loc = await fetchPlaceLocation(pred);
      tokenRef.current = placesLib ? createSessionToken(placesLib) : null;
      if (!loc) {
        pushToast({ kind: 'error', message: 'No se pudo ubicar ese lugar.' });
        setSearchState('idle');
        return;
      }
      setCenter({ lat: loc.lat, lng: loc.lng });

      let shape = null;
      try {
        shape = await fetchShapeAtPoint(loc.lat, loc.lng);
      } catch {
        /* sin forma → radio */
      }

      if (shape && shape.polygon && shape.polygon.length >= 3) {
        setMode('polygon');
        setDraft(shape.polygon);
        setAppliedLabel(`${pred.mainText} · forma de ${shape.areaName ?? 'la zona'}`);
      } else {
        setMode('radius');
        setDraft([]);
        setRadius((r) => (r > 0 ? r : DEFAULT_RADIUS_M));
        setAppliedLabel(`${pred.mainText} · sin contorno → punto + radio`);
      }
      setSearchState('idle');
      setFocusKey((k) => k + 1);
    } catch {
      setSearchState('error');
    }
  }

  function save() {
    if (!editingId) return;
    if (mode === 'polygon') {
      if (draft.length < 3) {
        pushToast({ kind: 'error', message: 'Buscá una zona con forma para guardar el contorno.' });
        return;
      }
      const body: PatchZoneBody = { coverage: draft, coverageRadiusM: null };
      if (center) {
        body.lat = center.lat;
        body.lng = center.lng;
      }
      patch.mutate(
        { zoneId: editingId, body },
        { onSuccess: () => { pushToast({ kind: 'success', message: 'Cobertura guardada 🗺️' }); resetEditing(); } },
      );
    } else {
      if (!center || radius <= 0) {
        pushToast({ kind: 'error', message: 'Buscá una zona y ajustá el radio.' });
        return;
      }
      const body: PatchZoneBody = { coverage: null, coverageRadiusM: Math.round(radius), lat: center.lat, lng: center.lng };
      patch.mutate(
        { zoneId: editingId, body },
        { onSuccess: () => { pushToast({ kind: 'success', message: 'Cobertura guardada 🗺️' }); resetEditing(); } },
      );
    }
  }

  // Autocompletado de Google con debounce.
  useEffect(() => {
    const q = query.trim();
    if (!editingId || !placesLib || q.length < 3) return;
    if (!tokenRef.current) tokenRef.current = createSessionToken(placesLib);
    let alive = true;
    const t = setTimeout(() => {
      setSearchState('searching');
      fetchPlacePredictions(placesLib, q, tokenRef.current as object)
        .then((preds) => { if (alive) { setPredictions(preds); setSearchState(preds.length ? 'idle' : 'empty'); } })
        .catch(() => { if (alive) { setPredictions([]); setSearchState('error'); } });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [query, editingId, placesLib]);

  const center0 = active[0] ? { lat: active[0].lat, lng: active[0].lng } : MEDELLIN;
  const editingZone = active.find((z) => z.id === editingId) ?? null;
  const canSave = mode === 'polygon' ? draft.length >= 3 : Boolean(center) && radius > 0;
  const queryReady = query.trim().length >= 3;
  const showPredictions = queryReady && searchState !== 'resolving' && predictions.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}><Icon.MapPin size={15} /> Mapa de cobertura</div>
          <div className={styles.cardSub}>
            Elegí una zona y buscá su barrio o comuna: se marca con la forma real (OSM). Si no tiene contorno, ajustás el radio. El bot valida la dirección del cliente contra esto.
          </div>
        </div>
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {active.map((z) => (
            <button
              key={z.id}
              type="button"
              className={`btn sm ${editingId === z.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => startEdit(z)}
            >
              <span className={styles.dot} style={{ background: z.color }} />
              {z.name}
              {hasCoverage(z) ? ' ✓' : ''}
            </button>
          ))}
          {active.length === 0 && <span className={styles.subtle}>Creá una zona arriba para marcar su cobertura.</span>}
        </div>

        {editingId && (
          <>
            <div className="input-search">
              <Icon.Search size={15} />
              <input
                placeholder="Buscá un barrio o comuna (ej. Laureles)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar barrio o comuna"
              />
              {queryReady && searchState === 'searching' && <span className={styles.subtle}>Buscando…</span>}
              {searchState === 'resolving' && <span className={styles.subtle}>Cargando forma…</span>}
            </div>

            {!placesLib && (
              <span className={styles.subtle} style={{ fontSize: 12 }}>
                Cargando el buscador de Google… Si no aparece, revisá que la key tenga <b>Places API (New)</b>.
              </span>
            )}

            {showPredictions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => applyPrediction(p)}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '8px 12px' }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <b style={{ fontSize: 13 }}>{p.mainText}</b>
                      {p.secondaryText && <span className={styles.subtle} style={{ fontSize: 12, whiteSpace: 'normal' }}>{p.secondaryText}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {queryReady && searchState === 'empty' && <span className={styles.subtle} style={{ fontSize: 12 }}>Sin resultados. Probá con otro nombre.</span>}
            {searchState === 'error' && <span className={styles.err}>No se pudo buscar. Revisá la conexión o la Places API (New).</span>}
            {appliedLabel && !queryReady && <span className={styles.subtle} style={{ fontSize: 12 }}>Aplicado: <b>{appliedLabel}</b>. Revisá en el mapa y guardá.</span>}
          </>
        )}

        <div style={{ height: 340, borderRadius: 8, overflow: 'hidden' }}>
          <Map
            mapId={MAP_ID}
            defaultCenter={center0}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI
            style={{ width: '100%', height: '100%' }}
          >
            <CoverageLayer
              zones={active}
              editingId={editingId}
              editingColor={editingZone?.color ?? '#2BD15A'}
              mode={mode}
              draft={draft}
              center={center}
              radius={radius}
              focusKey={focusKey}
            />
          </Map>
        </div>

        {editingId && (
          <>
            {mode === 'radius' ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={styles.subtle}>Radio: <b>{formatMeters(radius)}</b></span>
                <input
                  type="range"
                  min={MIN_RADIUS_M}
                  max={MAX_RADIUS_M}
                  step={RADIUS_STEP_M}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  aria-label="Radio de cobertura"
                  style={{ flex: '1 1 160px', accentColor: 'var(--green)' }}
                  disabled={!center}
                />
              </div>
            ) : (
              <span className={styles.subtle}>Forma cargada · {draft.length} puntos</span>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-primary sm" onClick={save} disabled={patch.isPending || !canSave}>
                <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar cobertura'}
              </button>
              <button type="button" className="btn btn-ghost sm" onClick={resetEditing} disabled={patch.isPending}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CoverageLayer({
  zones,
  editingId,
  editingColor,
  mode,
  draft,
  center,
  radius,
  focusKey,
}: {
  zones: Zone[];
  editingId: string | null;
  editingColor: string;
  mode: Mode;
  draft: Pt[];
  center: Pt | null;
  radius: number;
  focusKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    const shapes: Array<google.maps.Polygon | google.maps.Circle> = [];
    for (const z of zones) {
      if (z.id === editingId) continue;
      if (z.coverage && z.coverage.length >= 3) {
        shapes.push(new google.maps.Polygon({ paths: z.coverage, strokeColor: z.color, strokeOpacity: 0.7, strokeWeight: 2, fillColor: z.color, fillOpacity: 0.1, clickable: false }));
      } else if (z.coverageRadiusM && z.coverageRadiusM > 0) {
        shapes.push(new google.maps.Circle({ center: { lat: z.lat, lng: z.lng }, radius: z.coverageRadiusM, strokeColor: z.color, strokeOpacity: 0.7, strokeWeight: 2, fillColor: z.color, fillOpacity: 0.1, clickable: false }));
      }
    }
    shapes.forEach((s) => s.setMap(map));
    return () => shapes.forEach((s) => s.setMap(null));
  }, [map, zones, editingId]);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !editingId || mode !== 'polygon' || draft.length < 3) return;
    const poly = new google.maps.Polygon({ paths: draft, strokeColor: editingColor, strokeOpacity: 0.95, strokeWeight: 2, fillColor: editingColor, fillOpacity: 0.2, clickable: false });
    poly.setMap(map);
    return () => poly.setMap(null);
  }, [map, editingId, mode, editingColor, draft]);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !editingId || mode !== 'radius' || !center) return;
    const ring = new google.maps.Circle({ center, radius, strokeColor: editingColor, strokeOpacity: 0.95, strokeWeight: 2, fillColor: editingColor, fillOpacity: 0.18, clickable: false });
    const dot = new google.maps.Circle({ center, radius: Math.max(radius * 0.04, 18), strokeColor: editingColor, strokeOpacity: 1, strokeWeight: 1, fillColor: editingColor, fillOpacity: 0.9, clickable: false });
    ring.setMap(map);
    dot.setMap(map);
    return () => { ring.setMap(null); dot.setMap(null); };
  }, [map, editingId, mode, center, radius, editingColor]);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !editingId) return;
    if (mode === 'polygon' && draft.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      draft.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 56);
    } else if (center) {
      map.panTo(center);
      map.setZoom(radiusToZoom(radius));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  return null;
}
