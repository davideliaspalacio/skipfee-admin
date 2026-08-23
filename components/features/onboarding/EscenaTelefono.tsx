'use client';

import styles from './escenas.module.css';

/** Los momentos por los que pasa el teléfono del negocio. */
export type EstadoTelefono =
  | 'elegir'
  | 'esperando'
  | 'escanea'
  | 'vinculando'
  | 'conectado'
  | 'desconectado'
  | 'oficial';

const ETIQUETA: Record<EstadoTelefono, string> = {
  elegir: 'Teléfono esperando conexión',
  esperando: 'Teléfono esperando conexión',
  escanea: 'Teléfono mostrando el código para escanear',
  vinculando: 'Teléfono vinculándose',
  conectado: 'Teléfono conectado',
  desconectado: 'Teléfono desconectado',
  oficial: 'Teléfono esperando conexión',
};

/**
 * Un celular de caricatura que cambia de cara según el momento de la conexión.
 *
 * Es la misma ilustración en todos los estados a propósito: el dueño ve
 * avanzar UNA cosa —su teléfono— en vez de varias pantallas distintas. Cuando
 * queda conectado, el chat se llena y aparece el visto verde; ese es el único
 * momento del recorrido en el que algo suyo empieza a funcionar de verdad.
 *
 * Los dos estados intermedios existen porque el silencio se lee como avería:
 * `vinculando` (puntos + ondas) dice "está pasando algo" mientras WhatsApp
 * empareja, y `desconectado` cambia el visto por una alerta ámbar para que una
 * sesión caída no se siga viendo igual que una sana.
 */
export function EscenaTelefono({ estado }: { estado: EstadoTelefono }) {
  return (
    <svg
      className={styles.telefono}
      viewBox="0 0 240 150"
      role="img"
      aria-label={ETIQUETA[estado]}
      data-estado={estado}
    >
      <path d="M0 143h240" stroke="var(--tinta)" strokeWidth="2.5" strokeLinecap="round" />

      {/* el teléfono */}
      <g className={styles.aparato}>
        <rect
          x="74"
          y="18"
          width="92"
          height="125"
          rx="14"
          fill="#FFFDF7"
          stroke="var(--tinta)"
          strokeWidth="2.5"
        />
        <rect x="104" y="24" width="32" height="5" rx="2.5" fill="var(--tinta)" />

        {/* barra del chat */}
        <rect x="82" y="36" width="76" height="16" rx="6" fill="oklch(0.80 0.17 152)" stroke="var(--tinta)" strokeWidth="2" />
        <circle cx="91" cy="44" r="4" fill="#FFFDF7" stroke="var(--tinta)" strokeWidth="1.6" />

        {/* mensajes: aparecen al conectar */}
        <g className={styles.mensajes}>
          <rect x="82" y="58" width="46" height="13" rx="6" fill="oklch(0.93 0.05 152)" stroke="var(--tinta)" strokeWidth="1.8" />
          <rect x="112" y="76" width="46" height="13" rx="6" fill="oklch(0.80 0.17 152)" stroke="var(--tinta)" strokeWidth="1.8" />
          <rect x="82" y="94" width="38" height="13" rx="6" fill="oklch(0.93 0.05 152)" stroke="var(--tinta)" strokeWidth="1.8" />
        </g>

        {/* código en pantalla mientras espera el escaneo */}
        <g className={styles.codigo}>
          <rect x="94" y="62" width="52" height="52" rx="8" fill="#FFFDF7" stroke="var(--tinta)" strokeWidth="2.2" />
          {[
            [100, 68], [130, 68], [100, 98], [130, 98],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="10" height="10" rx="2.5" fill="var(--tinta)" />
          ))}
          {[
            [116, 82], [100, 84], [132, 84], [116, 98],
          ].map(([x, y]) => (
            <rect key={`p-${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.5" fill="var(--tinta)" opacity="0.75" />
          ))}
          <rect className={styles.escaner} x="94" y="62" width="52" height="4" rx="2" fill="oklch(0.70 0.14 28)" />
        </g>

        {/* tres puntos: el celular ya está emparejando, todavía no hay chat */}
        <g className={styles.cargando}>
          <circle cx="106" cy="86" r="5" fill="var(--tinta)" />
          <circle cx="120" cy="86" r="5" fill="var(--tinta)" />
          <circle cx="134" cy="86" r="5" fill="var(--tinta)" />
        </g>
      </g>

      {/* visto verde al conectar */}
      <g className={styles.visto}>
        <circle cx="176" cy="42" r="17" fill="oklch(0.80 0.17 152)" stroke="var(--tinta)" strokeWidth="2.5" />
        <path
          d="M168 42.5l5.5 5.5L185 36"
          stroke="var(--tinta)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* la sesión se cayó: mismo sitio del visto, otra noticia */}
      <g className={styles.alerta}>
        <circle cx="176" cy="42" r="17" fill="oklch(0.87 0.15 92)" stroke="var(--tinta)" strokeWidth="2.5" />
        <path
          d="M176 33v11"
          stroke="var(--tinta)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle cx="176" cy="50.5" r="2" fill="var(--tinta)" />
      </g>

      {/* ondas: el teléfono hablando con el mundo */}
      <g className={styles.ondas}>
        {[
          ['M46 60c-9 12-9 30 0 42', 0],
          ['M32 50c-14 19-14 45 0 64', 1],
          ['M194 60c9 12 9 30 0 42', 0],
          ['M208 50c14 19 14 45 0 64', 1],
        ].map(([d, i]) => (
          <path
            key={d as string}
            d={d as string}
            stroke="var(--tinta)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            style={{ animationDelay: `${(i as number) * 0.18}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
