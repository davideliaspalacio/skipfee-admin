'use client';

// Blindaje de seguridad del modo demo + aviso a Discord.
//
// El demo (/preview) es PÚBLICO y sin login. Sin esto, cualquier acción real
// (mover pedido, enviar WhatsApp, CRUD, settings) golpearía el backend real.
// Interceptamos window.fetch: bloqueamos TODA llamada al backend; las escrituras
// "fingen" éxito (la demo se siente real vía el update optimista) y avisan con un
// toast; las lecturas no sembradas se rechazan (React Query conserva los mocks).
// Solo se permite /api/demo-visit (aviso a Discord) y los servicios de mapas.

import { useEffect } from 'react';
import { useDemo } from '@/lib/demo';
import { pushToast } from '@/lib/toast';

const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
const ALLOW = [
  '/api/demo-visit',
  'nominatim.openstreetmap.org',
  'maps.googleapis.com',
  'maps.gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}
function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof input !== 'string' && !(input instanceof URL)) return (input.method ?? 'GET').toUpperCase();
  return 'GET';
}

export function DemoGuard() {
  const { isDemo, negocio, plan } = useDemo();

  // 1) Cortar TODO acceso al backend real desde la demo.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const original = window.fetch.bind(window);
    let lastToast = 0;

    const patched: typeof window.fetch = (input, init) => {
      const url = urlOf(input);
      const isBackend = (API && url.startsWith(API)) || url.includes('backend.skipfee.co');
      const isAllowed = ALLOW.some((a) => url.includes(a));

      if (isBackend && !isAllowed) {
        const isWrite = !['GET', 'HEAD'].includes(methodOf(input, init));
        if (isWrite) {
          const now = Date.now();
          if (now - lastToast > 1500) {
            lastToast = now;
            pushToast({ kind: 'info', message: 'Es una demostración: los cambios no se guardan.' });
          }
          return Promise.resolve(
            new Response(JSON.stringify({ ok: true, demo: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        // Lectura no sembrada: rechazar → React Query mantiene los datos mock.
        return Promise.reject(new Error('[demo] backend deshabilitado en la demostración'));
      }
      return original(input, init);
    };

    window.fetch = patched;
    return () => {
      window.fetch = original;
    };
  }, []);

  // 2) Avisar a Discord la primera vez (la IP la capta el backend).
  useEffect(() => {
    if (!isDemo || !API) return;
    try {
      if (sessionStorage.getItem('skipfee-demo-pinged')) return;
      sessionStorage.setItem('skipfee-demo-pinged', '1');
    } catch {
      /* ignore */
    }
    fetch(`${API}/api/demo-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negocio,
        plan,
        path: typeof location !== 'undefined' ? location.pathname : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch(() => {});
  }, [isDemo, negocio, plan]);

  return null;
}
