'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, SCREEN_PATHS, type ScreenId } from './nav';

export const RAIL_COLLAPSED_KEY = 'skipfee-admin-rail-collapsed';

const DEFAULT_SCREEN: ScreenId = 'pedidos';
const SCREEN_BY_SEGMENT = new Map<string, ScreenId>(
  NAV.map(n => [n.path.replace(/^\/+/, ''), n.id]),
);

/**
 * Resuelve la screen admin activa a partir del pathname (`/pedidos/…`,
 * `/whatsapp`, etc.). Si la URL no matchea un módulo conocido devuelve el default.
 */
export function useActiveScreen(): ScreenId {
  const pathname = usePathname() ?? '';
  const candidate = pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return SCREEN_BY_SEGMENT.get(candidate) ?? DEFAULT_SCREEN;
}

/** Navega por id de screen sin que los layouts conozcan paths. */
export function useScreenNav(): (s: ScreenId) => void {
  const router = useRouter();
  return useCallback((s: ScreenId) => router.push(SCREEN_PATHS[s]), [router]);
}

export function useIsDesktop(minWidth = 1024): boolean {
  const get = () => typeof window !== 'undefined' && window.innerWidth >= minWidth;
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, [minWidth]);
  return isDesktop;
}

export function useRailCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(RAIL_COLLAPSED_KEY) === 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const set = useCallback((v: boolean) => {
    setCollapsed(v);
    try {
      window.localStorage.setItem(RAIL_COLLAPSED_KEY, v ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, []);

  return [collapsed, set];
}

export function useIsDark(): boolean {
  return false;
}
