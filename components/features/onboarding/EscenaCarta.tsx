'use client';

import styles from './escenas.module.css';

/**
 * Un menú de pizarra que se llena con lo que el dueño va escribiendo.
 *
 * Las tres primeras líneas muestran sus productos reales, no un relleno: ver
 * "Hamburguesa clásica · $24.000" aparecer en la pizarra es lo que convierte
 * "llenar un formulario" en "estoy armando mi carta". Cuando lleva más de
 * tres, la pizarra lo dice en vez de intentar mostrarlos todos.
 */
export function EscenaCarta({
  productos,
  celebrando = false,
}: {
  productos: Array<{ nombre: string; precio: number }>;
  celebrando?: boolean;
}) {
  const visibles = productos.slice(0, 3);
  const resto = productos.length - visibles.length;

  const cortar = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1)}…` : t);
  const precio = (n: number) => `$${n.toLocaleString('es-CO')}`;

  return (
    <svg
      className={styles.carta}
      viewBox="0 0 250 150"
      role="img"
      aria-label="Pizarra con tu carta"
      data-celebrando={celebrando}
    >
      <path d="M0 143h250" stroke="var(--tinta)" strokeWidth="2.5" strokeLinecap="round" />

      {/* patas */}
      <path
        d="M78 128l-14 15M172 128l14 15"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <g className={styles.pizarra}>
        {/* marco de madera */}
        <rect
          x="52"
          y="14"
          width="146"
          height="116"
          rx="10"
          fill="oklch(0.87 0.15 92)"
          stroke="var(--tinta)"
          strokeWidth="2.5"
        />
        {/* pizarra */}
        <rect
          x="62"
          y="24"
          width="126"
          height="96"
          rx="6"
          fill="oklch(0.30 0.10 152)"
          stroke="var(--tinta)"
          strokeWidth="2"
        />

        <text x="125" y="42" textAnchor="middle" className={styles.cartaTitulo} fill="#FFFDF7">
          NUESTRA CARTA
        </text>
        <path d="M76 48h98" stroke="#FFFDF7" strokeWidth="1.6" opacity="0.5" />

        {/* renglones vacíos: el "todavía falta" dibujado */}
        {[60, 78, 96].map((y, i) =>
          visibles[i] ? null : (
            <path
              key={`v-${y}`}
              d={`M76 ${y}h${i === 2 ? 62 : 98}`}
              stroke="#FFFDF7"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.22"
            />
          ),
        )}

        {/* los productos que ya escribió */}
        {visibles.map((p, i) => (
          <g key={`${p.nombre}-${i}`} className={styles.renglon} style={{ animationDelay: `${i * 0.08}s` }}>
            <text x="76" y={60 + i * 18} className={styles.cartaItem} fill="#FFFDF7">
              {cortar(p.nombre, 15)}
            </text>
            <text
              x="174"
              y={60 + i * 18}
              textAnchor="end"
              className={styles.cartaPrecio}
              fill="oklch(0.80 0.17 152)"
            >
              {precio(p.precio)}
            </text>
          </g>
        ))}

        {resto > 0 && (
          <text x="125" y="112" textAnchor="middle" className={styles.cartaResto} fill="#FFFDF7">
            +{resto} más
          </text>
        )}
      </g>

      {/* chispas al terminar */}
      <g className={styles.chispas} aria-hidden="true">
        {[
          [28, 40, 1],
          [222, 52, 2],
          [34, 100, 3],
          [218, 106, 4],
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
