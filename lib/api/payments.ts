import { tenantRequest } from './client';

/**
 * Pasarela de pagos de la empresa.
 *
 *   `mock` → pasarela de prueba: el pedido se marca pagado sin cobrar. Es el
 *            default de toda empresa nueva, para poder recorrer el flujo
 *            completo antes de tener cuenta bancaria a nombre del comercio.
 *   `real` → Wompi con las llaves del negocio.
 *
 * El backend nunca devuelve los secretos: solo si están cargados. La llave
 * pública sí, porque viaja al navegador del comensal de todos modos.
 */

export type PaymentMode = 'mock' | 'real';

/** Wompi distingue sandbox de producción por el prefijo de la llave pública. */
export type PaymentEnv = 'pruebas' | 'produccion';

export interface PaymentsConfig {
  mode: PaymentMode;
  /** null mientras no haya llave cargada. */
  entorno: PaymentEnv | null;
  wompi: {
    configured: boolean;
    publicKey: string | null;
    hasIntegritySecret: boolean;
    hasEventsSecret: boolean;
  };
}

export interface UpdatePaymentsBody {
  mode?: PaymentMode;
  wompi?: {
    publicKey?: string;
    integritySecret?: string;
    eventsSecret?: string;
  };
}

export function fetchPayments(): Promise<PaymentsConfig> {
  return tenantRequest<PaymentsConfig>('/payments');
}

export function updatePayments(body: UpdatePaymentsBody): Promise<{ ok: true; mode?: PaymentMode }> {
  return tenantRequest('/payments', { method: 'PUT', body: JSON.stringify(body) });
}
