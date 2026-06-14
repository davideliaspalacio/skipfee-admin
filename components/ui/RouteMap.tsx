'use client';

import { useEffect } from 'react';
import { AdvancedMarker, ColorScheme, Map, Polyline, useMap } from '@vis.gl/react-google-maps';
import type { LatLng } from '@/lib/routing';

export interface RouteMapStop extends LatLng {
  id: string;
}

interface RouteMapProps {
  origin: LatLng & { label?: string };
  stops: RouteMapStop[];
  color: string;
  dark: boolean;
  height?: number;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

/**
 * Mapa de ruta (origen → paradas). El <APIProvider> se monta una sola vez a nivel
 * de app (providers.tsx) cuando hay NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Sin key → placeholder.
 */
export function RouteMap({ origin, stops, color, dark, height = 180 }: RouteMapProps) {
  if (!API_KEY) {
    return (
      <div
        style={{
          height,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
          background: 'var(--surface-2)',
          borderRadius: 8,
        }}
      >
        Configura <code style={{ margin: '0 4px' }}>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para ver el mapa.
      </div>
    );
  }

  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden' }}>
      <Map
        mapId={MAP_ID}
        colorScheme={dark ? ColorScheme.DARK : ColorScheme.LIGHT}
        defaultCenter={origin}
        defaultZoom={13}
        gestureHandling="cooperative"
        disableDefaultUI
        style={{ width: '100%', height: '100%' }}
      >
        <OriginMarker origin={origin} />
        {stops.map((s, i) => (
          <StopMarker key={s.id} stop={s} index={i} color={color} />
        ))}
        <RoutePolyline origin={origin} stops={stops} color={color} />
        <FitBounds origin={origin} stops={stops} />
      </Map>
    </div>
  );
}

function OriginMarker({ origin }: { origin: LatLng & { label?: string } }) {
  return (
    <AdvancedMarker position={origin} title={`Origen — ${origin.label ?? ''}`}>
      <div
        style={{
          background: 'var(--ink)',
          color: 'var(--on-ink)',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 6px',
          borderRadius: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
          lineHeight: 1,
        }}
      >
        {origin.label ?? 'Local'}
      </div>
    </AdvancedMarker>
  );
}

function StopMarker({ stop, index, color }: { stop: RouteMapStop; index: number; color: string }) {
  return (
    <AdvancedMarker position={stop} title={`Parada ${index + 1}`}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: color,
          color: '#fff',
          border: '2px solid #fff',
          boxShadow: '0 1px 3px rgba(0,0,0,.4)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          lineHeight: 1,
        }}
      >
        {index + 1}
      </div>
    </AdvancedMarker>
  );
}

function RoutePolyline({ origin, stops, color }: { origin: LatLng; stops: RouteMapStop[]; color: string }) {
  if (stops.length === 0) return null;
  const path = [origin, ...stops.map((s) => ({ lat: s.lat, lng: s.lng }))];
  const dashSymbol = { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 };
  return (
    <Polyline
      path={path}
      strokeColor={color}
      strokeOpacity={0}
      strokeWeight={2}
      icons={[{ icon: dashSymbol, offset: '0', repeat: '12px' }]}
    />
  );
}

function FitBounds({ origin, stops }: { origin: LatLng; stops: RouteMapStop[] }) {
  const map = useMap();
  const key = stops.map((s) => s.id).sort().join(',');
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    for (const s of stops) bounds.extend({ lat: s.lat, lng: s.lng });
    if (stops.length === 0) {
      map.setCenter(origin);
      map.setZoom(14);
      return;
    }
    map.fitBounds(bounds, 24);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, origin.lat, origin.lng]);
  return null;
}
