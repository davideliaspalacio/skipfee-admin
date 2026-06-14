export interface LatLng {
  lat: number;
  lng: number;
}

const R_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

function validCoord(p: LatLng | null | undefined): p is LatLng {
  return !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
}

export function haversineKm(a: LatLng, b: LatLng): number {
  // Si cualquiera de los dos puntos tiene coords inválidas (null, NaN, settings
  // sin cargar todavía) devolvemos 0 — preferimos un total subestimado a un NaN
  // que rompe la UI ("NaN km", "$NaN").
  if (!validCoord(a) || !validCoord(b)) return 0;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

export function tourLengthKm(origin: LatLng, stops: LatLng[]): number {
  if (stops.length === 0) return 0;
  let total = haversineKm(origin, stops[0]);
  for (let i = 1; i < stops.length; i++) {
    total += haversineKm(stops[i - 1], stops[i]);
  }
  return total;
}

function nearestNeighbor<T extends LatLng>(origin: LatLng, stops: T[]): T[] {
  const remaining = stops.slice();
  const ordered: T[] = [];
  let cursor: LatLng = origin;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(cursor, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

// 2-opt: repeatedly try reversing each sub-tour and keep improvements.
// Cap iterations as a guard; converges fast for ≤20 stops.
function twoOpt<T extends LatLng>(origin: LatLng, route: T[]): T[] {
  const n = route.length;
  if (n < 3) return route;
  let best = route.slice();
  let bestLen = tourLengthKm(origin, best);
  let improved = true;
  let iter = 0;
  while (improved && iter < 100) {
    improved = false;
    iter++;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const candidate = best.slice(0, i)
          .concat(best.slice(i, k + 1).reverse())
          .concat(best.slice(k + 1));
        const len = tourLengthKm(origin, candidate);
        if (len + 1e-9 < bestLen) {
          best = candidate;
          bestLen = len;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeOrder<T extends LatLng>(origin: LatLng, stops: T[]): T[] {
  if (stops.length <= 1) return stops.slice();
  return twoOpt(origin, nearestNeighbor(origin, stops));
}
