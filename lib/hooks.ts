'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, SCREEN_PATHS, type ScreenId } from './nav';

export const THEME_KEY = 'skipfee-admin-theme';

const DEFAULT_SCREEN: ScreenId = 'pedidos';
const VALID_SCREENS = new Set<ScreenId>(NAV.map(n => n.id));

/**
 * Resuelve la screen admin activa a partir del pathname (`/pedidos/…`,
 * `/whatsapp`, etc.). Si la URL no matchea un módulo conocido devuelve el default.
 */
export function useActiveScreen(): ScreenId {
  const pathname = usePathname() ?? '';
  const candidate = pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return VALID_SCREENS.has(candidate as ScreenId) ? (candidate as ScreenId) : DEFAULT_SCREEN;
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

export function useDarkMode(): [boolean, (v: boolean) => void] {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try {
      window.localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  return [dark, setDark];
}

/**
 * Lee el tema actual del atributo `data-theme` y re-renderiza al cambiar.
 * Para componentes hoja que necesitan reaccionar a dark/light (ej: emoji picker).
 */
export function useIsDark(): boolean {
  const read = () =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const [dark, setDark] = useState<boolean>(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}
