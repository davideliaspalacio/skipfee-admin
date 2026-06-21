import { tenantRequest, tenantMultipart } from './client';
import type { Chat, ChatMessage } from '../data';

export interface ChatsFilter {
  status?: 'bot' | 'human' | 'pending';
}

export interface ChatsStats {
  total: number;
  pending: number;
  /** Chats con al menos un mensaje sin leer. Usado por el badge del sidebar. */
  unread: number;
}

export async function fetchChatsStats(): Promise<ChatsStats> {
  const { total, pending, unread } = await tenantRequest<{
    ok: true;
    total: number;
    pending: number;
    unread: number;
  }>('/chats/stats');
  return { total, pending, unread };
}

export async function fetchChats(params: ChatsFilter = {}): Promise<Chat[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  const qs = search.toString();
  const { chats } = await tenantRequest<{ ok: true; chats: Chat[] }>(
    `/chats${qs ? '?' + qs : ''}`,
  );
  return chats;
}

export async function fetchChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { messages } = await tenantRequest<{ ok: true; messages: ChatMessage[] }>(
    `/chats/${encodeURIComponent(chatId)}/messages`,
  );
  return messages;
}

export async function chatTakeover(chatId: string): Promise<void> {
  await tenantRequest(`/chats/${encodeURIComponent(chatId)}/takeover`, { method: 'POST' });
}

export async function chatRelease(chatId: string): Promise<void> {
  await tenantRequest(`/chats/${encodeURIComponent(chatId)}/release`, { method: 'POST' });
}

export async function sendChatMessage(
  chatId: string,
  payload: { body?: string; imageUrl?: string },
): Promise<void> {
  await tenantRequest(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadChatImage(chatId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { url } = await tenantMultipart<{ ok: true; url: string }>(
    `/chats/${encodeURIComponent(chatId)}/upload-image`,
    form,
  );
  return url;
}
