import type { ChatStatus } from '@/lib/data';

/** Solo dígitos, para comparar teléfonos en formatos distintos ("+57 312…" vs "57312…"). */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/** Acorta el nombre a 2 palabras para que no rompa el layout de la lista/header. */
export function shortName(name: string): string {
  return name.split(' ').slice(0, 2).join(' ');
}

export interface StatusMeta {
  label: string;
  className: 'stBot' | 'stHuman' | 'stPending';
}

export function statusMeta(status: ChatStatus): StatusMeta | null {
  switch (status) {
    case 'bot':
      return { label: 'Bot atendiendo', className: 'stBot' };
    case 'human':
      return { label: 'Humano', className: 'stHuman' };
    case 'pending':
      return { label: 'Sin respuesta', className: 'stPending' };
    default:
      return null;
  }
}

const ZONE_LABELS: Record<string, string> = {
  poblado: 'El Poblado',
  laureles: 'Laureles',
  envigado: 'Envigado',
  fatima: 'Fátima',
};

export function zoneLabel(zone: string): string {
  return ZONE_LABELS[zone] ?? zone ?? '—';
}

/**
 * Ventana de 24h de WhatsApp: tras el último mensaje del cliente solo se puede
 * escribir libremente 24h. Calculamos el tiempo restante a partir de la hora
 * "HH:MM" del último mensaje entrante (interpretada como hoy; si quedó en el
 * futuro asumimos ayer). Devuelve fracción restante 0..1 y minutos restantes.
 */
export function windowState(lastTime: string): {
  fraction: number;
  minutesLeft: number;
  closed: boolean;
} {
  const m = /^(\d{1,2}):(\d{2})/.exec(lastTime.trim());
  if (!m) return { fraction: 1, minutesLeft: 24 * 60, closed: false };
  const now = new Date();
  const ref = new Date(now);
  ref.setHours(Number(m[1]), Number(m[2]), 0, 0);
  // Si la hora cae en el futuro de hoy, el mensaje fue ayer.
  if (ref.getTime() > now.getTime()) ref.setDate(ref.getDate() - 1);
  const elapsedMin = Math.max(0, (now.getTime() - ref.getTime()) / 60000);
  const totalMin = 24 * 60;
  const minutesLeft = Math.max(0, totalMin - elapsedMin);
  const fraction = Math.max(0, Math.min(1, minutesLeft / totalMin));
  return { fraction, minutesLeft: Math.round(minutesLeft), closed: minutesLeft <= 0 };
}

/** Color de la barra según cuánto queda de la ventana: drena de verde a coral. */
export function windowColor(fraction: number): string {
  if (fraction <= 0) return 'var(--coral)';
  if (fraction < 0.15) return 'var(--coral)';
  if (fraction < 0.35) return 'var(--sun)';
  return 'var(--green)';
}

export function formatWindowLeft(minutesLeft: number): string {
  if (minutesLeft <= 0) return 'Ventana cerrada';
  const h = Math.floor(minutesLeft / 60);
  const mm = minutesLeft % 60;
  if (h <= 0) return `${mm}m de ventana`;
  return `${h}h ${mm}m de ventana`;
}
