'use client';

import styles from './escenas.module.css';

/**
 * Las ilustraciones del recorrido por el panel.
 *
 * Viven juntas porque son un mismo capítulo: todas dibujan una *pantalla del
 * panel*, no un objeto del mundo real como las de Primeros pasos. Comparten el
 * mismo trazo (2.5px de tinta, color plano, sombra sólida) para que el dueño
 * sienta que sigue en la misma conversación y no en otro producto.
 *
 * Cada una muestra la pantalla haciendo su trabajo —una tarjeta cruzando el
 * tablero, una ruta trazándose— porque lo que hay que explicar no es cómo se
 * ve la pantalla (eso lo tiene detrás del modal), sino para qué sirve.
 */

/** Marco de ventana reusable: es el "aquí adentro" de todas estas escenas. */
function Ventana({ children }: { children: React.ReactNode }) {
  return (
    <>
      <rect
        x="10"
        y="12"
        width="230"
        height="126"
        rx="12"
        fill="#FFFDF7"
        stroke="var(--tinta)"
        strokeWidth="2.5"
      />
      {/* barra de título: tres puntos y nada más, para que no compita */}
      <path d="M10 30h230" stroke="var(--tinta)" strokeWidth="2" />
      {[22, 31, 40].map(cx => (
        <circle key={cx} cx={cx} cy="21" r="2.6" fill="var(--tinta)" opacity="0.45" />
      ))}
      {children}
    </>
  );
}

// ==========================================================================
// Apertura: el candado que se abre
// ==========================================================================

/**
 * El panel entero destrabándose. El candado abierto es el mismo icono que el
 * dueño vio cerrado sobre cada sección del rail durante toda la configuración:
 * cerrar ese círculo visual es media explicación.
 */
export function EscenaPanelAbre() {
  return (
    <svg
      className={styles.panelAbre}
      viewBox="0 0 250 150"
      role="img"
      aria-label="El panel abriéndose"
    >
      <Ventana>
        {/* el rail: las secciones que estaban bajo llave, ahora encendidas */}
        {[42, 62, 82, 102].map((y, i) => (
          <rect
            key={y}
            className={styles.railItem}
            style={{ animationDelay: `${0.18 + i * 0.08}s` }}
            x="20"
            y={y}
            width="18"
            height="14"
            rx="4"
            fill={i === 0 ? 'oklch(0.80 0.17 152)' : '#FFF6E4'}
            stroke="var(--tinta)"
            strokeWidth="2"
          />
        ))}
        <path d="M48 30v108" stroke="var(--tinta)" strokeWidth="2" opacity="0.35" />

        {/* contenido: no importa qué diga, importa que ya hay algo */}
        {[
          [60, 44, 96],
          [60, 60, 130],
          [60, 76, 78],
        ].map(([x, y, w], i) => (
          <rect
            key={y}
            className={styles.railItem}
            style={{ animationDelay: `${0.34 + i * 0.07}s` }}
            x={x}
            y={y}
            width={w}
            height="9"
            rx="4.5"
            fill="#FFF6E4"
            stroke="var(--tinta)"
            strokeWidth="2"
          />
        ))}
      </Ventana>

      {/* el candado, abierto, montado sobre la esquina */}
      <g className={styles.candado}>
        <path
          className={styles.arco}
          d="M168 108v-9a13 13 0 0 1 26 0"
          fill="none"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="152"
          y="106"
          width="34"
          height="26"
          rx="6"
          fill="oklch(0.87 0.15 92)"
          stroke="var(--tinta)"
          strokeWidth="2.5"
        />
        <circle cx="169" cy="119" r="3.4" fill="var(--tinta)" />
      </g>

      <g className={styles.chispas} aria-hidden="true">
        {[
          [206, 100, 1],
          [222, 122, 2],
          [196, 130, 3],
        ].map(([cx, cy, i]) => (
          <path
            key={i}
            d={`M${cx} ${cy - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`}
            fill="oklch(0.80 0.17 152)"
            stroke="var(--tinta)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            style={{ animationDelay: `${0.5 + i * 0.08}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

// ==========================================================================
// Pedidos: el tablero
// ==========================================================================

const COLUMNAS: Array<{ x: number; label: string; color: string; tarjetas: number }> = [
  { x: 56, label: 'PAGADO', color: 'oklch(0.87 0.15 92)', tarjetas: 2 },
  { x: 118, label: 'COCINA', color: 'oklch(0.89 0.07 235)', tarjetas: 1 },
  { x: 180, label: 'LISTO', color: 'oklch(0.80 0.17 152)', tarjetas: 1 },
];

/**
 * El tablero con una tarjeta a media mudanza entre dos columnas.
 *
 * La tarjeta suelta y torcida es el dibujo entero: dice "esto se arrastra" sin
 * una sola palabra, que es exactamente lo que hay que aprender de esta pantalla.
 */
export function EscenaTablero() {
  return (
    <svg
      className={styles.tablero}
      viewBox="0 0 250 150"
      role="img"
      aria-label="Tablero de pedidos con una tarjeta pasando de una columna a otra"
    >
      <Ventana>
        {COLUMNAS.map(col => (
          <g key={col.label}>
            <rect
              x={col.x - 26}
              y="40"
              width="52"
              height="88"
              rx="7"
              fill="#FFF6E4"
              stroke="var(--tinta)"
              strokeWidth="2"
              opacity="0.85"
            />
            <rect
              x={col.x - 26}
              y="40"
              width="52"
              height="14"
              rx="7"
              fill={col.color}
              stroke="var(--tinta)"
              strokeWidth="2"
            />
            <text
              x={col.x}
              y="50.5"
              textAnchor="middle"
              className={styles.tableroEtiqueta}
              fill="var(--tinta)"
            >
              {col.label}
            </text>

            {Array.from({ length: col.tarjetas }, (_, i) => (
              <g
                key={i}
                className={styles.tarjeta}
                style={{ animationDelay: `${0.14 + i * 0.08}s` }}
              >
                <rect
                  x={col.x - 20}
                  y={60 + i * 26}
                  width="40"
                  height="20"
                  rx="5"
                  fill="#FFFDF7"
                  stroke="var(--tinta)"
                  strokeWidth="2"
                />
                <path
                  d={`M${col.x - 14} ${67 + i * 26}h16M${col.x - 14} ${73 + i * 26}h24`}
                  stroke="var(--tinta)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </g>
            ))}
          </g>
        ))}

        {/* la que va en camino: torcida, con sombra, y un cursor encima */}
        <g className={styles.tarjetaViaja}>
          <rect
            x="128"
            y="86"
            width="42"
            height="22"
            rx="5"
            fill="oklch(0.93 0.05 152)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          <path
            d="M134 94h18M134 100h26"
            stroke="var(--tinta)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M162 104l3 13 3.5-5 5.5 1z"
            fill="#FFFDF7"
            stroke="var(--tinta)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </Ventana>
    </svg>
  );
}

// ==========================================================================
// WhatsApp: la bandeja
// ==========================================================================

/**
 * La conversación con el relevo dibujado: el bot venía respondiendo (verde) y
 * la última burbuja ya la escribió una persona (amarilla, con su cursor).
 * Ese salto de color es lo único que hay que entender de la pantalla.
 */
export function EscenaBandeja() {
  return (
    <svg
      className={styles.bandeja}
      viewBox="0 0 250 150"
      role="img"
      aria-label="Bandeja de conversaciones con el bot y una respuesta escrita a mano"
    >
      <Ventana>
        {/* lista de chats */}
        {[40, 62, 84, 106].map((y, i) => (
          <g key={y} opacity={i === 1 ? 1 : 0.5}>
            <rect
              x="18"
              y={y}
              width="52"
              height="18"
              rx="6"
              fill={i === 1 ? 'oklch(0.93 0.05 152)' : '#FFF6E4'}
              stroke="var(--tinta)"
              strokeWidth="2"
            />
            <circle cx="27" cy={y + 9} r="4" fill="var(--tinta)" opacity="0.5" />
            <path
              d={`M35 ${y + 7}h28M35 ${y + 12}h18`}
              stroke="var(--tinta)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
          </g>
        ))}
        <path d="M78 30v108" stroke="var(--tinta)" strokeWidth="2" opacity="0.35" />

        {/* la conversación */}
        <g className={styles.burbujas}>
          {/* el cliente */}
          <path
            d="M90 42h64a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H98l-8 7v-7a5 5 0 0 1 0-22z"
            fill="#FFFDF7"
            stroke="var(--tinta)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* el bot */}
          <path
            d="M126 74h94a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-94a5 5 0 0 1-5-5V79a5 5 0 0 1 5-5z"
            fill="oklch(0.80 0.17 152)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          {/* la persona que tomó el control */}
          <path
            d="M140 106h80a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-80a5 5 0 0 1-5-5v-12a5 5 0 0 1 5-5z"
            fill="oklch(0.87 0.15 92)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
        </g>

        <path
          d="M98 51h44M98 57h26"
          stroke="var(--tinta)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M130 83h72M130 89h48"
          stroke="var(--tinta)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M144 115h58M144 121h34"
          stroke="var(--tinta)"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.55"
        />

        {/* el cursor: quien escribió lo último no fue el bot */}
        <path
          className={styles.cursorMano}
          d="M206 112l3 14 3.5-5.5 6 1z"
          fill="#FFFDF7"
          stroke="var(--tinta)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </Ventana>
    </svg>
  );
}

// ==========================================================================
// Despachos: la ruta
// ==========================================================================

const PARADAS: Array<{ cx: number; cy: number; n: string }> = [
  { cx: 100, cy: 76, n: '1' },
  { cx: 166, cy: 116, n: '2' },
  { cx: 210, cy: 76, n: '3' },
];

/**
 * Tres domicilios y una sola línea que los une en orden. La moto sale del
 * local; los números dicen que alguien ya decidió por dónde empezar — que es
 * justo el trabajo que hace esta pantalla.
 */
export function EscenaRuta() {
  return (
    <svg
      className={styles.ruta}
      viewBox="0 0 250 150"
      role="img"
      aria-label="Una ruta que une tres entregas en orden"
    >
      {/* calles */}
      <g opacity="0.22">
        {[36, 76, 116].map(y => (
          <path key={`h-${y}`} d={`M0 ${y}h250`} stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" />
        ))}
        {[58, 124, 190].map(x => (
          <path key={`v-${x}`} d={`M${x} 0v150`} stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" />
        ))}
      </g>

      {/* la ruta, trazándose */}
      <path
        className={styles.trazo}
        d="M44 116C70 116 66 76 100 76s40 40 66 40 44-40 44-40"
        fill="none"
        stroke="var(--tinta)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="8 6"
      />

      {/* las paradas, numeradas */}
      {PARADAS.map((parada, i) => (
        <g key={parada.n} className={styles.parada} style={{ animationDelay: `${0.35 + i * 0.12}s` }}>
          <circle
            cx={parada.cx}
            cy={parada.cy}
            r="12"
            fill="oklch(0.80 0.17 152)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          <text
            x={parada.cx}
            y={parada.cy + 4}
            textAnchor="middle"
            className={styles.rutaNumero}
            fill="var(--tinta)"
          >
            {parada.n}
          </text>
        </g>
      ))}

      {/* la moto saliendo del local */}
      <g className={styles.moto}>
        <circle cx="30" cy="122" r="8" fill="#FFFDF7" stroke="var(--tinta)" strokeWidth="2.5" />
        <circle cx="56" cy="122" r="8" fill="#FFFDF7" stroke="var(--tinta)" strokeWidth="2.5" />
        <path
          d="M30 122h12l6-12h10"
          fill="none"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M40 110h14v8H44z"
          fill="oklch(0.70 0.14 28)"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M52 122h8" stroke="var(--tinta)" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ==========================================================================
// Configuración: los controles
// ==========================================================================

const INTERRUPTORES: Array<{ y: number; encendido: boolean }> = [
  { y: 44, encendido: true },
  { y: 72, encendido: false },
];

/**
 * Un tablero de mandos: dos interruptores, un deslizador y un reloj. No
 * representa ninguna pestaña en particular a propósito — Configuración es
 * "las perillas del negocio", y eso es lo que hay que dejar en la cabeza.
 */
export function EscenaAjustes() {
  return (
    <svg
      className={styles.ajustes}
      viewBox="0 0 250 150"
      role="img"
      aria-label="Los controles del negocio: interruptores, un deslizador y un horario"
    >
      <Ventana>
        {/* interruptores */}
        {INTERRUPTORES.map((sw, i) => (
          <g key={sw.y} className={styles.interruptor} style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
            <path
              d={`M24 ${sw.y + 5}h44`}
              stroke="var(--tinta)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <rect
              x="96"
              y={sw.y}
              width="34"
              height="18"
              rx="9"
              fill={sw.encendido ? 'oklch(0.80 0.17 152)' : '#FFF6E4'}
              stroke="var(--tinta)"
              strokeWidth="2.5"
            />
            <circle
              cx={sw.encendido ? 121 : 105}
              cy={sw.y + 9}
              r="5.5"
              fill="#FFFDF7"
              stroke="var(--tinta)"
              strokeWidth="2.5"
            />
          </g>
        ))}

        {/* deslizador */}
        <g className={styles.interruptor} style={{ animationDelay: '0.44s' }}>
          <path d="M24 105h44" stroke="var(--tinta)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          <rect
            x="96"
            y="100"
            width="34"
            height="10"
            rx="5"
            fill="#FFF6E4"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          <rect
            x="96"
            y="100"
            width="22"
            height="10"
            rx="5"
            fill="oklch(0.87 0.15 92)"
            stroke="var(--tinta)"
            strokeWidth="2.5"
          />
          <circle cx="118" cy="105" r="7" fill="#FFFDF7" stroke="var(--tinta)" strokeWidth="2.5" />
        </g>

        {/* el reloj de los horarios */}
        <circle cx="188" cy="82" r="30" fill="oklch(0.89 0.07 235)" stroke="var(--tinta)" strokeWidth="2.5" />
        <path
          className={styles.manecilla}
          d="M188 82V64M188 82l13 8"
          stroke="var(--tinta)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="188" cy="82" r="3" fill="var(--tinta)" />
        {[
          [188, 56],
          [214, 82],
          [188, 108],
          [162, 82],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="var(--tinta)" opacity="0.6" />
        ))}
      </Ventana>
    </svg>
  );
}
