import type { DayKey, DayHours, WeekHours } from './api/settings';

/**
 * Espejo cliente de la lógica de horario del backend (`backend/src/lib/hours.ts`),
 * para mostrar el estado "abierto/cerrado ahora" y la próxima apertura en el
 * panel admin. El enforcement real vive en el backend.
 */

export const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_ES: Record<DayKey, string> = {
  mon: 'lunes', tue: 'martes', wed: 'miércoles', thu: 'jueves',
  fri: 'viernes', sat: 'sábado', sun: 'domingo',
};

export function isWithinDayHours(t: string, d: DayHours | undefined): boolean {
  if (!d || d.closed || !d.open || !d.close) return false;
  const { open, close } = d;
  if (open === close) return false;
  if (close > open) return t >= open && t < close;
  return t >= open || t < close; // cruza medianoche
}

function bogotaParts(now: Date): { dayKey: DayKey; time: string } {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short' })
    .format(now)
    .toLowerCase();
  const dayKey = (DAY_ORDER as string[]).includes(wd) ? (wd as DayKey) : 'mon';
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now);
  return { dayKey, time };
}

export function isOpenNow(hours: WeekHours, now: Date = new Date()): boolean {
  const { dayKey, time } = bogotaParts(now);
  return isWithinDayHours(time, hours[dayKey]);
}

function to12h(hhmm: string): string {
  const [hStr, m] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'p. m.' : 'a. m.';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function nextOpeningLabel(hours: WeekHours, now: Date = new Date()): string | null {
  const { dayKey, time } = bogotaParts(now);
  const todayIdx = DAY_ORDER.indexOf(dayKey);
  for (let offset = 0; offset < 7; offset++) {
    const key = DAY_ORDER[(todayIdx + offset) % 7];
    const d = hours[key];
    if (!d || d.closed || !d.open) continue;
    if (offset === 0 && !(time < d.open)) continue;
    const hora = to12h(d.open);
    if (offset === 0) return `hoy a las ${hora}`;
    if (offset === 1) return `mañana a las ${hora}`;
    return `el ${DAY_ES[key]} a las ${hora}`;
  }
  return null;
}
