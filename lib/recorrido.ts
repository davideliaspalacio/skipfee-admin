/**
 * Disparador global del recorrido por el panel.
 *
 * El recorrido vive en `AdminShell` —tiene que sobrevivir a los cambios de
 * pantalla, porque lleva al dueño de una a otra— pero se retoma desde
 * Configuración, que es una screen cualquiera colgando del router. Un pub/sub
 * de tres líneas evita tener que subir estado a un contexto entero solo para
 * que un botón le grite a un modal, igual que hace `toast.ts`.
 */

import { useEffect, useState } from 'react';

type Listener = (n: number) => void;

let pedidos = 0;
const listeners = new Set<Listener>();

/** Vuelve a abrir el recorrido desde el principio, aunque ya se haya visto. */
export function pedirRecorrido(): void {
  pedidos += 1;
  listeners.forEach(l => l(pedidos));
}

/**
 * Contador de peticiones. Sube cada vez que alguien pide el recorrido; el
 * componente reacciona al cambio, no al valor.
 */
export function usePedidoDeRecorrido(): number {
  const [n, setN] = useState(pedidos);
  useEffect(() => {
    const l: Listener = v => setN(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return n;
}

/** La marca de "ya lo vio", con la misma convención que la bienvenida. */
export function claveRecorrido(companyCode: string | null): string | null {
  return companyCode ? `bs_recorrido_${companyCode}` : null;
}
