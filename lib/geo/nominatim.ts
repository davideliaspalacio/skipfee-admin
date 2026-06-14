/**
 * Forma geográfica de un barrio/comuna desde OpenStreetMap (Nominatim), por
 * REVERSE geocoding sobre un punto. Se usa así: el admin busca con Google Places
 * (preciso) y elige un lugar; con sus coordenadas le pedimos a OSM el área
 * administrativa que las contiene (típicamente la comuna en Medellín) y su
 * polígono real, que guardamos como `coverage`. Si el área no tiene polígono,
 * el editor cae a "centro + radio".
 *
 * Por qué reverse y no buscar por nombre: el barrio que devuelve Google suele
 * existir en OSM sólo como un punto; la comuna que lo contiene sí tiene el
 * contorno. Reverse sobre las coordenadas resuelve eso sin depender del nombre.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REVERSE_ZOOM = 12; // nivel comuna/suburb (validado para Medellín)
const MAX_POLYGON_POINTS = 40;

// ---------- Geometría (exportada para test) ----------

/** Área (sin signo) de un anillo por la fórmula del cordón (shoelace). */
export function ringArea(ring: LatLng[]): number {
  let acc = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    acc += (ring[j].lng + ring[i].lng) * (ring[j].lat - ring[i].lat);
  }
  return Math.abs(acc / 2);
}

type GeoJsonGeom = { type?: string; coordinates?: unknown };

function coordToLatLng(c: unknown): LatLng | null {
  if (!Array.isArray(c) || c.length < 2) return null;
  const lng = Number(c[0]);
  const lat = Number(c[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function ringFromCoords(coords: unknown): LatLng[] | null {
  if (!Array.isArray(coords)) return null;
  const ring: LatLng[] = [];
  for (const c of coords) {
    const p = coordToLatLng(c);
    if (p) ring.push(p);
  }
  return ring.length >= 3 ? ring : null;
}

/**
 * Extrae el anillo exterior de un GeoJSON Polygon/MultiPolygon. En MultiPolygon
 * elige el polígono de mayor área (el cuerpo principal de la zona). Devuelve
 * null para Point/LineString u otros sin área. GeoJSON usa orden [lng, lat].
 */
export function geojsonToRing(geojson: GeoJsonGeom | null | undefined): LatLng[] | null {
  if (!geojson || typeof geojson !== 'object') return null;
  if (geojson.type === 'Polygon') {
    const outer = (geojson.coordinates as unknown[] | undefined)?.[0];
    return ringFromCoords(outer);
  }
  if (geojson.type === 'MultiPolygon') {
    const polys = geojson.coordinates;
    if (!Array.isArray(polys)) return null;
    let best: LatLng[] | null = null;
    let bestArea = -1;
    for (const poly of polys) {
      const outer = (poly as unknown[] | undefined)?.[0];
      const ring = ringFromCoords(outer);
      if (!ring) continue;
      const area = ringArea(ring);
      if (area > bestArea) {
        bestArea = area;
        best = ring;
      }
    }
    return best;
  }
  return null;
}

// Distancia perpendicular de p al segmento a–b (en grados; suficiente a escala barrial).
function perpDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  if (dx === 0 && dy === 0) return Math.hypot(p.lng - a.lng, p.lat - a.lat);
  const t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy);
  const projLng = a.lng + t * dx;
  const projLat = a.lat + t * dy;
  return Math.hypot(p.lng - projLng, p.lat - projLat);
}

// Ramer–Douglas–Peucker sobre una polilínea abierta.
function rdp(points: LatLng[], epsilon: number): LatLng[] {
  if (points.length < 3) return points.slice();
  let maxDist = 0;
  let index = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon);
    const right = rdp(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[last]];
}

/**
 * Reduce un anillo de cientos de vértices a un puñado manejable (≤ maxPoints)
 * conservando la forma. Sube la tolerancia hasta cumplir el tope.
 */
export function simplifyPolygon(points: LatLng[], maxPoints = MAX_POLYGON_POINTS): LatLng[] {
  // Quita el vértice de cierre duplicado (anillo cerrado) si lo hay.
  let ring = points.slice();
  if (ring.length > 1) {
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lng - b.lng) < 1e-9) {
      ring = ring.slice(0, -1);
    }
  }
  if (ring.length <= maxPoints) return ring;

  let epsilon = 0.0002; // ~22 m
  let out = ring;
  for (let i = 0; i < 14 && out.length > maxPoints; i++) {
    out = rdp(ring, epsilon);
    epsilon *= 1.6;
  }
  return out;
}

// ---------- Parseo del reverse (exportado para test) ----------

export interface ZoneShape {
  /** Nombre del área que contiene el punto (ej. "Comuna 11 - Laureles-Estadio"). */
  areaName: string | null;
  /** Polígono exterior simplificado, o null si el área no tiene forma. */
  polygon: LatLng[] | null;
}

export interface RawNominatimReverse {
  name?: string;
  display_name?: string;
  error?: string;
  geojson?: GeoJsonGeom;
}

/** Convierte la respuesta cruda del reverse en {areaName, polygon}. Puro → testeable. */
export function parseReverseShape(raw: RawNominatimReverse | null | undefined): ZoneShape | null {
  if (!raw || raw.error) return null;
  const ring = geojsonToRing(raw.geojson);
  const simplified = ring ? simplifyPolygon(ring) : null;
  const polygon = simplified && simplified.length >= 3 ? simplified : null;
  const areaName = (raw.name && raw.name.trim())
    || (raw.display_name ?? '').split(',')[0].trim()
    || null;
  return { areaName, polygon };
}

// ---------- Red ----------

/**
 * Pide a OSM el área administrativa (comuna/suburb) que contiene el punto y su
 * polígono. `polygon` es null si el área no tiene contorno → caer a centro+radio.
 */
export async function fetchShapeAtPoint(
  lat: number,
  lng: number,
  opts: { signal?: AbortSignal } = {},
): Promise<ZoneShape | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    polygon_geojson: '1',
    zoom: String(REVERSE_ZOOM),
    'accept-language': 'es',
  });

  const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const raw = (await res.json()) as RawNominatimReverse;
  return parseReverseShape(raw);
}
