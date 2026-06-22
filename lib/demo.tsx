'use client';

// Contexto del "modo demo" del panel. Lee ?demo=1&negocio=...&plan=... que llega
// desde el onboarding de la website y lo persiste en sessionStorage para que el
// contexto sobreviva la navegación interna entre /preview/* (que no lleva query).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { normalizePlan, type PlanId } from './plans';

export interface DemoState {
  isDemo: boolean;
  negocio: string;
  plan: PlanId;
}

const DEFAULT: DemoState = { isDemo: false, negocio: 'Tu Negocio', plan: 'negocio' };
const STORAGE_KEY = 'skipfee-demo';

const DemoCtx = createContext<DemoState>(DEFAULT);

function readDemoState(): DemoState {
  if (typeof window === 'undefined') return DEFAULT;
  const params = new URLSearchParams(window.location.search);
  const hasParams = params.has('demo') || params.has('negocio') || params.has('plan');
  if (hasParams) {
    const state: DemoState = {
      isDemo: params.get('demo') !== '0',
      negocio: params.get('negocio')?.trim() || DEFAULT.negocio,
      plan: normalizePlan(params.get('plan')),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    return state;
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT, ...(JSON.parse(stored) as Partial<DemoState>) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  // Arranca en DEFAULT (igual en server y en el primer render de cliente → sin
  // mismatch de hidratación con output:export) y lee URL/sessionStorage tras montar.
  // El layout de /preview no se re-monta al navegar entre pantallas → el estado persiste.
  const [state, setState] = useState<DemoState>(DEFAULT);
  useEffect(() => {
    setState(readDemoState());
  }, []);
  return <DemoCtx.Provider value={state}>{children}</DemoCtx.Provider>;
}

export function useDemo(): DemoState {
  return useContext(DemoCtx);
}
