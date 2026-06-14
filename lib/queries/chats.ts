import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chatRelease,
  chatTakeover,
  fetchChatMessages,
  fetchChats,
  fetchChatsStats,
  sendChatMessage,
  uploadChatImage,
  type ChatsFilter,
  type ChatsStats,
} from '../api';
import type { Chat, ChatMessage } from '../data';
import { chatKeys } from './keys';
import { pushToast } from '../toast';

const CHATS_POLL_MS = 4000;
const MESSAGES_POLL_MS = 2000;
const CHATS_STATS_POLL_MS = 10_000;

export function useChats(filter: ChatsFilter = {}) {
  return useQuery<Chat[]>({
    queryKey: chatKeys.list(filter),
    queryFn: () => fetchChats(filter),
    refetchInterval: CHATS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useChatsStats({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<ChatsStats>({
    queryKey: chatKeys.stats(),
    queryFn: fetchChatsStats,
    refetchInterval: CHATS_STATS_POLL_MS,
    refetchIntervalInBackground: false,
    enabled,
  });
}

export function useChatMessages(chatId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.messages(chatId ?? ''),
    queryFn: () => fetchChatMessages(chatId as string),
    enabled: !!chatId,
    refetchInterval: MESSAGES_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useChatTakeover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatTakeover(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.lists() });
      qc.invalidateQueries({ queryKey: chatKeys.stats() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo tomar el chat: ${err.message}` });
    },
  });
}

export function useChatRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatRelease(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.lists() });
      qc.invalidateQueries({ queryKey: chatKeys.stats() });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo liberar el chat: ${err.message}` });
    },
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      body,
      imageUrl,
    }: {
      chatId: string;
      body?: string;
      imageUrl?: string;
    }) => sendChatMessage(chatId, { body, imageUrl }),
    onSuccess: (_data, { chatId }) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
    },
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo enviar el mensaje: ${err.message}` });
    },
  });
}

export function useUploadChatImage() {
  return useMutation({
    mutationFn: ({ chatId, file }: { chatId: string; file: File }) =>
      uploadChatImage(chatId, file),
    onError: err => {
      pushToast({ kind: 'error', message: `No se pudo subir la imagen: ${err.message}` });
    },
  });
}
