import { request } from './client';

/**
 * Mensajes del bot editables (Configuración → Mensajes del bot).
 * Espeja el contrato de `GET/PATCH/DELETE /api/bot/messages` del backend.
 */

export type BotMessageCategory = 'conversacion' | 'recordatorio' | 'notificacion' | 'sistema';
export type BotMessageKind = 'text' | 'buttons' | 'list' | 'cta_url' | 'prompt' | 'keywords';

export interface BotButton {
  id: string;
  title: string;
}

/** Contenido editable; los campos significativos dependen del `kind`. */
export interface BotMessageContent {
  body?: string;
  buttons?: BotButton[];
  buttonText?: string;
  rowDescriptionTemplate?: string;
  displayText?: string;
  systemPrompt?: string;
  safeDefault?: string;
  words?: string[];
}

export interface BotMessage {
  key: string;
  category: BotMessageCategory;
  step: string | null;
  kind: BotMessageKind;
  label: string;
  description: string | null;
  variables: string[];
  content: BotMessageContent;        // resuelto (default ⊕ override)
  defaultContent: BotMessageContent; // default del código (para "restaurar")
  isCustomized: boolean;
  enabled: boolean;
  updatedAt: string | null;
}

export interface PatchBotMessageBody {
  content?: BotMessageContent;
  enabled?: boolean;
}

export async function fetchBotMessages(): Promise<BotMessage[]> {
  const { messages } = await request<{ ok: true; messages: BotMessage[] }>('/api/bot/messages');
  return messages;
}

/** Devuelve los warnings del backend (ej. variables no reconocidas). */
export async function patchBotMessage(
  key: string,
  body: PatchBotMessageBody,
): Promise<{ warnings?: string[] }> {
  return request<{ ok: true; warnings?: string[] }>(`/api/bot/messages/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Restaura el mensaje a su default (borra el override). */
export async function resetBotMessage(key: string): Promise<void> {
  await request(`/api/bot/messages/${encodeURIComponent(key)}`, { method: 'DELETE' });
}
