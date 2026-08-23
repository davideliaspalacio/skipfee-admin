'use client';

import { useState } from 'react';
import styles from './guia.module.css';

/**
 * Cómo llegar a "Dispositivos vinculados", dibujado.
 *
 * Antes esto era una línea: "WhatsApp → Ajustes → Dispositivos vinculados →
 * Vincular dispositivo". Esa flecha encadenada supone que el lector ya sabe
 * dónde está cada cosa; quien no lo sabe se queda mirando su celular sin
 * encontrar el menú, y ahí es donde abandona.
 *
 * Dos decisiones:
 *
 * **Android y iPhone van separados, no juntos con barras.** El camino es
 * distinto de verdad —en Android es el ⋮ de arriba, en iPhone la rueda de
 * abajo— y una instrucción que dice "toca ⋮ o Configuración" obliga a cada
 * usuario a descartar la mitad de lo que lee.
 *
 * **Los iconos están dibujados, no fotografiados.** Una captura de WhatsApp
 * envejece con cada rediseño de Meta, pesa, y no es nuestra para redistribuir.
 * Un dibujo del gesto —dónde tocar, qué forma tiene— dura más y se lee mejor a
 * 40px.
 */

type Sistema = 'android' | 'iphone';

const PASOS: Record<Sistema, Array<{ titulo: string; detalle: string }>> = {
  android: [
    { titulo: 'Abre WhatsApp', detalle: 'En el celular donde tienes el número del negocio.' },
    { titulo: 'Toca los tres puntos', detalle: 'Arriba a la derecha, junto a la lupa.' },
    { titulo: 'Dispositivos vinculados', detalle: 'Luego "Vincular un dispositivo".' },
    { titulo: 'Apunta al código', detalle: 'Enfoca el QR de esta pantalla y listo.' },
  ],
  iphone: [
    { titulo: 'Abre WhatsApp', detalle: 'En el celular donde tienes el número del negocio.' },
    { titulo: 'Toca Configuración', detalle: 'La rueda dentada, abajo a la derecha.' },
    { titulo: 'Dispositivos vinculados', detalle: 'Luego "Vincular un dispositivo".' },
    { titulo: 'Apunta al código', detalle: 'Enfoca el QR de esta pantalla y listo.' },
  ],
};

export function GuiaVincular() {
  const [sistema, setSistema] = useState<Sistema>('android');

  return (
    <div className={styles.guia}>
      <div className={styles.tabs} role="tablist" aria-label="Tipo de celular">
        {(['android', 'iphone'] as const).map(s => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={sistema === s}
            className={styles.tab}
            data-activo={sistema === s}
            onClick={() => setSistema(s)}
          >
            {s === 'android' ? 'Android' : 'iPhone'}
          </button>
        ))}
      </div>

      <ol className={styles.pasos}>
        {PASOS[sistema].map((p, i) => (
          <li key={p.titulo}>
            <span className={styles.icono} aria-hidden="true">
              <Dibujo paso={i} sistema={sistema} />
            </span>
            <span className={styles.textoPaso}>
              <b>
                <i>{i + 1}</i>
                {p.titulo}
              </b>
              <small>{p.detalle}</small>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Los cuatro gestos, dibujados con el mismo trazo del mundo de caricatura. */
function Dibujo({ paso, sistema }: { paso: number; sistema: Sistema }) {
  const comun = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (paso === 0) {
    // El globo de WhatsApp
    return (
      <svg viewBox="0 0 32 32" width="26" height="26">
        <path d="M6 26l1.6-5A11 11 0 1 1 12 25.4z" {...comun} />
        <path d="M12.5 13c0 3.5 3 6.5 6.5 6.5" {...comun} />
      </svg>
    );
  }

  if (paso === 1) {
    return sistema === 'android' ? (
      // Los tres puntos, arriba a la derecha
      <svg viewBox="0 0 32 32" width="26" height="26">
        <rect x="6" y="4" width="20" height="24" rx="3.5" {...comun} />
        <circle cx="21" cy="9" r="1.3" fill="currentColor" />
        <circle cx="21" cy="13" r="1.3" fill="currentColor" />
        <circle cx="21" cy="17" r="1.3" fill="currentColor" />
      </svg>
    ) : (
      // La rueda de Configuración, abajo
      <svg viewBox="0 0 32 32" width="26" height="26">
        <rect x="6" y="4" width="20" height="24" rx="3.5" {...comun} />
        <circle cx="16" cy="21" r="3.4" {...comun} />
        <path d="M16 15.6v-1.2M16 27.6v-1.2M20.8 18.2l1-.6M11.2 24.4l-1 .6M20.8 24.4l1 .6M11.2 18.2l-1-.6" {...comun} />
      </svg>
    );
  }

  if (paso === 2) {
    // Un celular y un monitor enlazados
    return (
      <svg viewBox="0 0 32 32" width="26" height="26">
        <rect x="3" y="9" width="10" height="16" rx="2.5" {...comun} />
        <rect x="17" y="7" width="12" height="10" rx="2" {...comun} />
        <path d="M23 17v4M20 21h6" {...comun} />
        <path d="M13.5 15h3" {...comun} />
      </svg>
    );
  }

  // Enfocar el código
  return (
    <svg viewBox="0 0 32 32" width="26" height="26">
      <path d="M4 11V6.5A2.5 2.5 0 0 1 6.5 4H11M21 4h4.5A2.5 2.5 0 0 1 28 6.5V11M28 21v4.5a2.5 2.5 0 0 1-2.5 2.5H21M11 28H6.5A2.5 2.5 0 0 1 4 25.5V21" {...comun} />
      <rect x="11" y="11" width="10" height="10" rx="1.5" {...comun} />
    </svg>
  );
}
