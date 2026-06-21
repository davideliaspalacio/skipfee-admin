'use client';

// Recorrido guiado del demo (driver.js), multipágina: navega solo entre
// /preview/<pantalla> y resalta cada parte. No se puede cerrar a la fuerza
// (allowClose:false); la única salida es llegar al final, donde se ofrece
// repetir o agendar una llamada. Un botón flotante "?" relanza el recorrido.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useDemo } from '@/lib/demo';
import { planUnlocks } from '@/lib/plans';
import { TOUR_STEPS, type TourStep } from '@/lib/tour';

const CAL_URL = process.env.NEXT_PUBLIC_CALENDAR_URL ?? '';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skipfee.co').replace(/\/+$/, '');
const WA = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

export function TourController() {
  const router = useRouter();
  const pathname = usePathname();
  const { plan } = useDemo();

  // Pasos efectivos: el de gating solo si el plan tiene pantallas bloqueadas.
  const steps = useMemo<TourStep[]>(() => {
    const hasLocked = planUnlocks(plan).length < 8;
    return TOUR_STEPS.filter((s) => !s.onlyIfLocked || hasLocked);
  }, [plan]);

  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  // Instancia driver mientras el tour está activo.
  useEffect(() => {
    if (!active) return;
    const d = driver({
      allowClose: false,
      overlayColor: 'rgba(12, 20, 36, 0.62)',
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: 'skipfee-tour',
      animate: true,
    });
    driverRef.current = d;
    return () => {
      d.destroy();
      driverRef.current = null;
    };
  }, [active]);

  const goNext = useCallback(() => {
    setIdx((i) => {
      if (i >= steps.length - 1) {
        driverRef.current?.destroy();
        setActive(false);
        setShowFinal(true);
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  const startTour = useCallback(() => {
    setShowFinal(false);
    setIdx(0);
    setActive(true);
  }, []);

  // Arranque automático si la URL trae ?tour=1.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('tour') !== '1') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('tour');
      window.history.replaceState({}, '', url.toString());
    } catch {
      /* ignore */
    }
    startTour();
  }, [startTour]);

  // Mostrar el paso: navegar a su pantalla si hace falta y luego resaltar.
  useEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;

    const target = `/preview/${step.screen}`;
    if (pathname !== target) {
      router.push(target);
      return; // re-corre cuando cambie pathname
    }
    const d = driverRef.current;
    if (!d) return;

    const sel = isMobile() && step.elementMobile ? step.elementMobile : step.element;
    const el = sel ? document.querySelector(sel) : null;
    const isLast = idx >= steps.length - 1;
    const popover = {
      title: step.title,
      description: step.description,
      showButtons: (idx > 0 ? ['previous', 'next'] : ['next']) as Array<'previous' | 'next'>,
      nextBtnText: isLast ? 'Terminar →' : 'Siguiente →',
      prevBtnText: '← Atrás',
      onNextClick: () => goNext(),
      onPrevClick: () => goPrev(),
    };

    // defer para dar tiempo a que la pantalla destino monte su contenido
    const t = window.setTimeout(
      () => {
        if (el) d.highlight({ element: el as Element, popover });
        else d.highlight({ popover });
      },
      el ? 60 : 120,
    );
    return () => window.clearTimeout(t);
  }, [active, idx, pathname, steps, router, goNext, goPrev]);

  const onAgendar = () => {
    if (CAL_URL) return void window.open(CAL_URL, '_blank', 'noopener');
    if (WA)
      return void window.open(
        `https://wa.me/${WA}?text=${encodeURIComponent('Hola, vi el demo de Skipfee y quiero más info 🙌')}`,
        '_blank',
        'noopener',
      );
    window.open(`${SITE_URL}/pre-registro`, '_blank', 'noopener');
  };

  return (
    <>
      <button
        type="button"
        className="demo-tour-fab"
        onClick={startTour}
        aria-label="Ver el recorrido guiado"
        title="Ver el recorrido guiado"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.3" />
          <line x1="12" y1="17" x2="12" y2="17.01" />
        </svg>
        <span>Recorrido</span>
      </button>

      {showFinal && (
        <div className="demo-final" role="dialog" aria-modal="true">
          <div className="demo-final-card">
            <span className="demo-final-emoji" aria-hidden="true">🎉</span>
            <h2>Eso es Skipfee en acción</h2>
            <p>Pedidos, cocina, WhatsApp y reportes en un solo lugar, sin comisiones. ¿Lo activamos para tu restaurante?</p>
            <div className="demo-final-actions">
              <button type="button" className="btn btn-primary" onClick={onAgendar}>📅 Agendar una llamada</button>
              <button type="button" className="btn btn-ghost" onClick={startTour}>↻ Repetir recorrido</button>
            </div>
            <button type="button" className="demo-final-skip" onClick={() => setShowFinal(false)}>
              Explorar el panel por mi cuenta
            </button>
          </div>
        </div>
      )}
    </>
  );
}
