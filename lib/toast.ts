/**
 * Sistema de toasts global.
 *
 * Pequeño pub/sub: cualquier código (incluyendo mutaciones de React Query) puede
 * llamar `pushToast(...)` sin tener una referencia a un componente. El
 * `<ToastHost />` montado en la app suscribe y renderiza el toast activo.
 */

import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMsg {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
}

type Listener = (toast: ToastMsg | null) => void;

let seq = 0;
let current: ToastMsg | null = null;
let timer: number | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l(current));
}

export function pushToast(input: {
  kind?: ToastKind;
  message: string;
  duration?: number;
}): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  const toast: ToastMsg = {
    id: ++seq,
    kind: input.kind ?? 'success',
    message: input.message,
    duration: input.duration ?? 3200,
  };
  current = toast;
  emit();
  timer = window.setTimeout(() => {
    if (current?.id === toast.id) {
      current = null;
      timer = null;
      emit();
    }
  }, toast.duration);
}

export function dismissToast(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
  current = null;
  emit();
}

export function useToast(): ToastMsg | null {
  const [toast, setToast] = useState<ToastMsg | null>(current);
  useEffect(() => {
    const l: Listener = t => setToast(t);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return toast;
}
