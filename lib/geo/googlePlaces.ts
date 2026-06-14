/**
 * Autocompletado de lugares con la API NUEVA de Google Places
 * (AutocompleteSuggestion). La API vieja (AutocompleteService/Autocomplete) ya
 * no está disponible para keys nuevas desde marzo 2025. Requiere
 * `VITE_GOOGLE_MAPS_API_KEY` con "Places API (New)" habilitada.
 *
 * Usamos tipos mínimos propios para no depender de la versión de
 * @types/google.maps (que puede no traer aún los símbolos de la API New).
 */

export interface PlacePrediction {
  placeId: string;
  /** Texto principal (ej. "Laureles"). */
  mainText: string;
  /** Texto secundario (ej. "Medellín, Antioquia, Colombia"). */
  secondaryText: string;
  /** Texto completo. */
  fullText: string;
  /** Objeto nativo, para resolver el lugar (toPlace). */
  raw: GPlacePrediction;
}

interface GText { toString(): string }

interface GPlace {
  fetchFields(req: { fields: string[] }): Promise<unknown>;
  location?: { lat(): number; lng(): number } | null;
  displayName?: string | null;
}

interface GPlacePrediction {
  placeId: string;
  text: GText;
  mainText?: GText | null;
  secondaryText?: GText | null;
  toPlace(): GPlace;
}

interface GSuggestion { placePrediction: GPlacePrediction | null }

/** Forma mínima de la librería `places` que devuelve useMapsLibrary('places'). */
export interface GPlacesLibrary {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(req: Record<string, unknown>): Promise<{ suggestions: GSuggestion[] }>;
  };
  AutocompleteSessionToken: new () => object;
}

/** Castea la librería de @vis.gl al shape mínimo que usamos. */
export function asPlacesLibrary(lib: unknown): GPlacesLibrary | null {
  if (lib && typeof (lib as GPlacesLibrary).AutocompleteSuggestion?.fetchAutocompleteSuggestions === 'function') {
    return lib as GPlacesLibrary;
  }
  return null;
}

/** Un token de sesión agrupa las pulsaciones + la selección (facturación/UX). */
export function createSessionToken(lib: GPlacesLibrary): object {
  return new lib.AutocompleteSessionToken();
}

/** Predicciones de autocompletado para `input`, limitadas a Colombia. */
export async function fetchPlacePredictions(
  lib: GPlacesLibrary,
  input: string,
  sessionToken: object,
): Promise<PlacePrediction[]> {
  const request: Record<string, unknown> = {
    input,
    includedRegionCodes: ['co'],
    language: 'es',
    region: 'co',
    sessionToken,
  };
  const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
  const out: PlacePrediction[] = [];
  for (const s of suggestions) {
    const p = s.placePrediction;
    if (!p) continue;
    out.push({
      placeId: p.placeId,
      mainText: (p.mainText ?? p.text).toString(),
      secondaryText: p.secondaryText ? p.secondaryText.toString() : '',
      fullText: p.text.toString(),
      raw: p,
    });
  }
  return out;
}

/** Resuelve la predicción a su ubicación (centro). null si no trae coordenadas. */
export async function fetchPlaceLocation(
  prediction: PlacePrediction,
): Promise<{ name: string; lat: number; lng: number } | null> {
  const place = prediction.raw.toPlace();
  await place.fetchFields({ fields: ['displayName', 'location', 'formattedAddress'] });
  if (!place.location) return null;
  return {
    name: place.displayName ?? prediction.mainText,
    lat: place.location.lat(),
    lng: place.location.lng(),
  };
}
