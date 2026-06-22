'use client';

// Recorrido guiado del demo (driver.js), multipágina y completo. Recorre toda la
// plataforma resaltando la feature más potente de cada pantalla. No se puede cerrar
// a la fuerza: la única salida es completar el recorrido (modal final que lleva a la
// website / agenda / repetir). Incluye barra de progreso, sonido al avanzar y
// modales grandes en desktop. Auto-arranca al entrar a la demo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useDemo } from '@/lib/demo';
import { planUnlocks } from '@/lib/plans';
import { TOUR_STEPS, type TourStep } from '@/lib/tour';
import { setTourActive } from '@/lib/tourActive';

const CAL_URL = process.env.NEXT_PUBLIC_CALENDAR_URL ?? '';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skipfee.co').replace(/\/+$/, '');
const WA = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');

function tiendaBase(): string {
  const env = (process.env.NEXT_PUBLIC_TIENDA_URL ?? '').replace(/\/+$/, '');
  if (env) return env;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') return 'http://localhost:3002';
  return 'https://tienda.skipfee.co';
}

const MUTE_KEY = 'skipfee-tour-muted';
const DONE_KEY = 'skipfee-tour-done';

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
}

// Blip suave al avanzar (Web Audio, sin assets). Requiere gesto del usuario para
// sonar (política de autoplay): el primer paso es automático y queda en silencio;
// a partir del primer "Siguiente" suena.
let audioCtx: AudioContext | null = null;
function playBlip(muted: boolean): void {
  if (muted || typeof window === 'undefined') return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx = audioCtx ?? new Ctor();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(620, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.start(t);
    o.stop(t + 0.22);
  } catch {
    /* ignore */
  }
}

export function TourController() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDemo, plan } = useDemo();

  const steps = useMemo<TourStep[]>(() => {
    const hasLocked = planUnlocks(plan).length < 8;
    return TOUR_STEPS.filter((s) => !s.onlyIfLocked || hasLocked);
  }, [plan]);

  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [muted, setMuted] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  // Cargar preferencia de sonido.
  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Señal al shell: durante el tour se ven las pantallas reales (sin candado).
  // Además forzamos scroll instantáneo: el scroll-behavior:smooth del <html>
  // descuadra el posicionamiento de los popovers de driver al cambiar de foco.
  useEffect(() => {
    setTourActive(active);
    const html = typeof document !== 'undefined' ? document.documentElement : null;
    if (active && html) {
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      return () => {
        html.style.scrollBehavior = prev;
        setTourActive(false);
      };
    }
    return () => setTourActive(false);
  }, [active]);

  // Instancia driver mientras el tour está activo.
  useEffect(() => {
    if (!active) return;
    const d = driver({
      allowClose: false,
      overlayColor: 'rgba(8, 14, 28, 0.86)',
      stagePadding: 8,
      stageRadius: 12,
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
    playBlip(muted);
    setIdx((i) => {
      if (i >= steps.length - 1) {
        driverRef.current?.destroy();
        setActive(false);
        setShowFinal(true);
        try {
          sessionStorage.setItem(DONE_KEY, '1');
        } catch {
          /* ignore */
        }
        return i;
      }
      return i + 1;
    });
  }, [steps.length, muted]);

  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);

  const startTour = useCallback(() => {
    setShowFinal(false);
    setIdx(0);
    setActive(true);
  }, []);

  // Auto-arranque en la demo. ?tour=1 fuerza reinicio; si no, arranca salvo que ya
  // se haya completado en esta sesión.
  useEffect(() => {
    if (!isDemo || typeof window === 'undefined') return;
    const force = new URLSearchParams(window.location.search).get('tour') === '1';
    if (force) {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete('tour');
        window.history.replaceState({}, '', u.toString());
      } catch {
        /* ignore */
      }
      try {
        sessionStorage.removeItem(DONE_KEY);
      } catch {
        /* ignore */
      }
      startTour();
      return;
    }
    let done = false;
    try {
      done = sessionStorage.getItem(DONE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (!done) startTour();
  }, [isDemo, startTour]);

  // Mostrar el paso: navegar a su pantalla si hace falta y luego resaltar.
  useEffect(() => {
    if (!active) return;
    const step = steps[idx];
    if (!step) return;
    const target = `/preview/${step.screen}`;
    if (pathname !== target) {
      router.push(target);
      return;
    }
    const d = driverRef.current;
    if (!d) return;

    const sel = isMobile() && step.elementMobile ? step.elementMobile : step.element;
    const isLast = idx >= steps.length - 1;
    const popover = {
      title: step.title,
      description: step.description,
      ...(step.side ? { side: step.side } : {}),
      ...(step.align ? { align: step.align } : {}),
      showButtons: (idx > 0 ? ['previous', 'next'] : ['next']) as Array<'previous' | 'next'>,
      nextBtnText: isLast ? 'Terminar →' : 'Siguiente →',
      prevBtnText: '← Atrás',
      onNextClick: () => goNext(),
      onPrevClick: () => goPrev(),
    };

    // Tras cambiar de pantalla, el elemento destino puede tardar en montar.
    // Reintentamos hasta encontrarlo antes de caer a modal centrado.
    let timer = 0;
    let tries = 0;
    const run = () => {
      const el = sel ? (document.querySelector(sel) as HTMLElement | null) : null;
      if (sel && !el && tries < 12) {
        tries += 1;
        timer = window.setTimeout(run, 110);
        return;
      }
      if (sel && el) {
        // Centra el elemento destino en pantalla ANTES de resaltar. Así el foco
        // es claro aunque el usuario haya hecho scroll (lo "sube" automáticamente)
        // y driver calcula la posición del popover sobre una geometría ya estable
        // — evita popovers descuadrados como el de "Crea y edita platos" (paso 13).
        el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
        // Espera un frame a que el scroll asiente y recién ahí resalta.
        timer = window.setTimeout(() => d.highlight({ element: sel, popover }), 70);
      } else {
        // Paso centrado (sin selector): llevamos la vista arriba para enfocar.
        window.scrollTo({ top: 0, behavior: 'auto' });
        d.highlight({ popover });
      }
    };
    timer = window.setTimeout(run, 90);
    return () => window.clearTimeout(timer);
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

  const step = steps[idx];
  const pct = steps.length ? Math.round(((idx + 1) / steps.length) * 100) : 0;

  return (
    <>
      {/* Barra de progreso (sobre el overlay del tour) */}
      {active && step && (
        <div className="tour-progress" role="status" aria-live="polite">
          <div className="tour-progress-track"><span style={{ width: `${pct}%` }} /></div>
          <div className="tour-progress-meta">
            <span className="tour-progress-section">{step.section}</span>
            <span className="tour-progress-count">Paso {idx + 1} de {steps.length}</span>
            <button
              type="button"
              className="tour-progress-mute"
              onClick={toggleMute}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              title={muted ? 'Activar sonido' : 'Silenciar'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante para (re)lanzar el recorrido (visible tras completarlo) */}
      {!active && !showFinal && (
        <button type="button" className="demo-tour-fab" onClick={startTour} aria-label="Ver el recorrido guiado" title="Ver el recorrido guiado">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.3" />
            <line x1="12" y1="17" x2="12" y2="17.01" />
          </svg>
          <span>Recorrido</span>
        </button>
      )}

      {/* Modal final — sin escape: siempre lleva a una acción */}
      {showFinal && (
        <div className="demo-final" role="dialog" aria-modal="true">
          <div className="demo-final-card">
            <span className="demo-final-emoji" aria-hidden="true">🎉</span>
            <h2>Eso es Skipfee operando tu restaurante</h2>
            <p>Acabas de ver el panel. Ahora mira <b>cómo pide tu cliente</b> — y todo con <b>0% de comisión</b>. ¿Listo para tenerlo en tu negocio?</p>
            <div className="demo-final-actions">
              <a className="btn btn-primary" href={`${tiendaBase()}/demo`} target="_blank" rel="noopener noreferrer">🛒 Ver cómo pide tu cliente →</a>
              <a className="btn btn-ghost" href={SITE_URL}>🌐 Conocer Skipfee</a>
              <button type="button" className="btn btn-ghost" onClick={onAgendar}>📅 Agendar una llamada</button>
              <button type="button" className="btn btn-ghost" onClick={startTour}>↻ Repetir recorrido</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
