'use client';

import styles from './escenas.module.css';

/**
 * La fachada del negocio, con su nombre en el toldo.
 *
 * Está dibujada a mano (no es un icono de librería estirado) porque es la
 * pieza que carga el sentido del modal: el dueño ve *su* local, con *su*
 * nombre arriba, antes de escribir un solo dato. El letrero se llena con lo
 * que ya sabemos de él, así que la ilustración no es decoración: es el primer
 * lugar donde su negocio aparece dentro de Skipfee.
 */
export function EscenaTienda({ nombre, celebrando = false }: { nombre: string; celebrando?: boolean }) {
  // El toldo tiene ancho fijo: un nombre largo se recorta antes de deformarlo.
  const letrero = nombre.length > 18 ? `${nombre.slice(0, 17)}…` : nombre;

  return (
    <svg
      className={styles.tienda}
      viewBox="0 0 260 150"
      role="img"
      aria-label={`Fachada de ${nombre}`}
      data-celebrando={celebrando}
    >
      {/* suelo */}
      <path d="M0 143h260" stroke="var(--tinta)" strokeWidth="2.5" strokeLinecap="round" />

      {/* cuerpo del local */}
      <path
        d="M46 62h168v81H46z"
        fill="#FFFDF7"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* letrero */}
      <rect x="60" y="70" width="140" height="24" rx="7" fill="var(--tinta)" />
      <text
        x="130"
        y="86.5"
        textAnchor="middle"
        className={styles.letrero}
        fill="#FFFDF7"
      >
        {letrero}
      </text>

      {/* toldo a rayas */}
      <g className={styles.toldo}>
        <path
          d="M40 62c0-14 12-22 26-22h128c14 0 26 8 26 22z"
          fill="oklch(0.80 0.17 152)"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {[70, 100, 130, 160, 190].map(x => (
          <path
            key={x}
            d={`M${x} 40.5c-4 5-6 13-6 21.5`}
            stroke="var(--tinta)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </g>

      {/* puerta */}
      <path
        d="M104 104h34v39h-34z"
        fill="oklch(0.93 0.05 152)"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="132" cy="124" r="2.6" fill="var(--tinta)" />

      {/* ventana con el cartelito de abierto */}
      <path
        d="M154 104h44v26h-44z"
        fill="oklch(0.89 0.07 235)"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M176 104v26" stroke="var(--tinta)" strokeWidth="2" />

      {/* maceta: el detalle que hace que se sienta un lugar y no un diagrama */}
      <path
        d="M62 128h20l-3 15H65z"
        fill="oklch(0.70 0.14 28)"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M72 128c0-9-6-12-6-12M72 128c0-11 7-14 7-14"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* chispas de celebración */}
      <g className={styles.chispas} aria-hidden="true">
        {[
          [30, 34, 1],
          [228, 46, 2],
          [214, 20, 3],
          [44, 96, 4],
          [226, 108, 5],
        ].map(([cx, cy, i]) => (
          <path
            key={i}
            d={`M${cx} ${cy - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`}
            fill="oklch(0.87 0.15 92)"
            stroke="var(--tinta)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
