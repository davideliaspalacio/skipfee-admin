import { tenantRequest } from './client';

/**
 * Conexión de WhatsApp de la empresa.
 *
 * Dos proveedores posibles y excluyentes:
 *   - `kapso`     → Cloud API oficial de Meta. Número verificado, botones y
 *                   listas nativos, sin riesgo de baneo. Requiere papeleo.
 *   - `evolution` → servidor propio, se vincula escaneando un QR como WhatsApp
 *                   Web. Sin papeleo, pero es un canal no oficial.
 *
 * El backend nunca devuelve secretos: solo si están cargados.
 */

export type WhatsAppProviderKind = 'kapso' | 'evolution';
export type SessionStatus = 'connected' | 'connecting' | 'disconnected' | 'unknown';

export interface WhatsAppProviderConfig {
  provider: WhatsAppProviderKind;
  kapso: {
    configured: boolean;
    phoneNumberId: string | null;
    hasWebhookSecret: boolean;
  };
  evolution: {
    configured: boolean;
    /** true = corre en el servidor compartido de Skipfee; el negocio no aporta datos. */
    managed: boolean;
    baseUrl: string | null;
    instance: string | null;
    hasWebhookToken: boolean;
    sessionState: string | null;
    sessionUpdatedAt: string | null;
  };
}

export interface WhatsAppSession {
  status: SessionStatus;
  /** QR para escanear. Puede venir como data URL o como base64 pelado. */
  qr?: string | null;
  phone?: string | null;
}

export interface WhatsAppSessionResult {
  provider: WhatsAppProviderKind;
  session: WhatsAppSession;
  /** Último mensaje ENTRANTE. Null = el canal aún no ha recibido nada. */
  lastInboundAt?: string | null;
  /** Solo en el connect: si el webhook quedó registrado en Evolution. */
  webhook?: { url: string; registered: boolean; error: string | null };
}

export interface UpdateProviderBody {
  provider?: WhatsAppProviderKind;
  kapso?: { phoneNumberId?: string; apiKey?: string; webhookSecret?: string };
  evolution?: {
    baseUrl?: string;
    apiKey?: string;
    instance?: string;
    webhookToken?: string;
  };
}

export function fetchWhatsAppProvider(): Promise<WhatsAppProviderConfig> {
  return tenantRequest<WhatsAppProviderConfig>('/whatsapp/provider');
}

export function updateWhatsAppProvider(
  body: UpdateProviderBody,
): Promise<{ provider?: WhatsAppProviderKind }> {
  return tenantRequest('/whatsapp/provider', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function fetchWhatsAppSession(): Promise<WhatsAppSessionResult> {
  return tenantRequest<WhatsAppSessionResult>('/whatsapp/session');
}

export function connectWhatsAppSession(): Promise<WhatsAppSessionResult> {
  return tenantRequest<WhatsAppSessionResult>('/whatsapp/session', { method: 'POST' });
}

export function logoutWhatsAppSession(): Promise<{ ok: boolean }> {
  return tenantRequest('/whatsapp/session', { method: 'DELETE' });
}

/**
 * Evolution devuelve el QR unas veces como data URL completo y otras como
 * base64 pelado. Normalizamos para poder meterlo directo en un <img src>.
 */
export function qrToDataUrl(qr: string | null | undefined): string | null {
  if (!qr) return null;
  return qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
}
