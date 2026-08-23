'use client';

import styles from './escenas.module.css';

/**
 * El mapa de cobertura, dibujado como lo entendería alguien que nunca oyó la
 * palabra "polígono": tu local en el centro, un círculo alrededor, casitas
 * adentro que sí reciben y una afuera que no.
 *
 * Cuando el dueño mueve el radio, el círculo crece con él. Ese vínculo directo
 * entre la barra y el dibujo es lo que hace que "2,5 km" signifique algo.
 */
export function EscenaZona({ radio }: { radio?: number }) {
  // El radio del dibujo sigue al real, pero comprimido: entre 500 m y 8 km, el
  // círculo va de 34 a 66 px. Si fuera proporcional, a 8 km no cabría.
  const r = radio ? 34 + Math.min(1, (radio - 500) / 7500) * 32 : 52;

  return (
    <svg className={styles.zona} viewBox="0 0 250 150" role="img" aria-label="Tu local y el área a la que repartes">
      {/* calles de fondo */}
      <g opacity="0.28">
        {[30, 70, 110].map(y => (
          <path key={`h-${y}`} d={`M0 ${y}h250`} stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" />
        ))}
        {[60, 125, 190].map(x => (
          <path key={`v-${x}`} d={`M${x} 0v150`} stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" />
        ))}
      </g>

      {/* el área */}
      <circle className={styles.area} cx="118" cy="76" r={r} fill="oklch(0.80 0.17 152 / 0.28)" />
      <circle
        className={styles.area}
        cx="118"
        cy="76"
        r={r}
        fill="none"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeDasharray="7 5"
      />

      {/* casitas que sí reciben */}
      {[
        [92, 52],
        [146, 60],
        [100, 100],
        [142, 98],
      ].map(([cx, cy]) => (
        <g key={`in-${cx}-${cy}`}>
          <path
            d={`M${cx - 8} ${cy}l8-7 8 7v9a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1z`}
            fill="oklch(0.93 0.05 152)"
            stroke="var(--tinta)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {/* la de afuera */}
      <g opacity="0.55">
        <path
          d="M212 44l8-7 8 7v9a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1z"
          fill="#FFFDF7"
          stroke="var(--tinta)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 3"
        />
      </g>

      {/* el local */}
      <circle cx="118" cy="76" r="15" fill="oklch(0.73 0.17 152)" stroke="var(--tinta)" strokeWidth="2.5" />
      <path
        d="M111 77.5L118 71l7 6.5V84a1 1 0 0 1-1 1h-3.5v-4.5h-5V85H112a1 1 0 0 1-1-1z"
        fill="var(--tinta)"
      />
    </svg>
  );
}
