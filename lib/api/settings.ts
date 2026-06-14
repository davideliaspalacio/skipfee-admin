import { request } from './client';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  closed?: boolean;
  open?: string;  // "HH:MM"
  close?: string; // "HH:MM"
}

/** Horario por día. Si un día falta o tiene closed=true, no se atiende. */
export type WeekHours = Partial<Record<DayKey, DayHours>>;

export interface Settings {
  openHour: string;
  closeHour: string;
  openDays: string[];
  peakStart: string | null;
  peakEnd: string | null;
  peakSurcharge: number;
  baseDeliveryFee: number;
  reminderMinutes: number;
  /** Horario por día (fuente de verdad de abierto/cerrado). Puede ser null si aún no se migró. */
  hours: WeekHours | null;
  /** Pausa manual de pedidos (anula el horario). */
  ordersPaused: boolean;
  /**
   * Cuántas horas atrás se siguen mostrando los pedidos entregados en el
   * kanban. Solo afecta la columna "Entregado": las otras no tienen tope.
   */
  deliveredWindowHours: number;
  // --- Post-venta (Tarea 3) ---
  /** Enviar encuesta de satisfacción tras entregar. */
  surveyEnabled: boolean;
  /** Minutos tras la entrega antes de enviar la encuesta (vía cron survey-dispatch). */
  surveyDelayMinutes: number;
  /** Regalar un postre cuando el cliente deja la reseña (verificado por humano). */
  reviewGiftEnabled: boolean;
  /** Nombre del regalo (ej. "Brownie"). */
  reviewGiftName: string;
  /** Vigencia del cupón en días desde que se otorga. */
  reviewGiftExpiryDays: number;
  /** Link de reseña de Google Maps que se envía a los clientes satisfechos. */
  reviewLink: string;
  /** No re-encuestar al mismo cliente antes de N días (0 = en cada pedido). */
  surveyMinDays: number;
  /** Producto (categoría "Regalo", $0) que se entrega gratis. null = sin vincular. */
  reviewGiftProductId: string | null;
  // --- Dirección del local (origen de los domicilios) ---
  /** Dirección legible del local. Solo visual — el cálculo usa lat/lng. */
  localAddress: string | null;
  /** Latitud del origen de las rutas. Default histórico: 6.2447 (Medellín). */
  localLat: number;
  /** Longitud del origen de las rutas. Default histórico: -75.5736. */
  localLng: number;
  /** Etiqueta corta del origen para el mapa de Despachos (default 'B&S'). */
  localLabel: string;
  /** Categorías de productos (tabs del catálogo + dropdown del modal). */
  categories: string[];
  updatedAt: string;
}

export async function fetchSettings(): Promise<Settings> {
  const { settings } = await request<{ ok: true; settings: Settings }>('/api/settings');
  return settings;
}

export async function patchSettings(body: Partial<Settings>): Promise<void> {
  await request('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
