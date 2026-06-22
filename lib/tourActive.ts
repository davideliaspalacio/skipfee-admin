'use client';

// Señal global "el tour está activo". El TourController la enciende/apaga y el
// DemoShell la lee para mostrar las pantallas REALES durante el recorrido (sin el
// candado de gating), de modo que el tour pueda recorrer toda la plataforma.

import { useEffect, useState } from 'react';

let active = false;
const listeners = new Set<(v: boolean) => void>();

export function setTourActive(v: boolean): void {
  if (active === v) return;
  active = v;
  listeners.forEach((l) => l(v));
}

export function useTourActive(): boolean {
  const [v, setV] = useState(active);
  useEffect(() => {
    const l = (x: boolean) => setV(x);
    listeners.add(l);
    setV(active);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return v;
}
