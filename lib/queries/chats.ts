import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  chatRelease,
  chatTakeover,
  fetchChatMessages,
  fetchChats,
  fetchChatsStats,
  markChatRead,
  sendChatMessage,
  uploadChatImage,
  type ChatsFilter,
  type ChatsStats,
} from '../api';
import type { Chat, ChatMessage } from '../data';
import { chatKeys } from './keys';
import { useActiveCompany } from './company';
import { pushToast } from '../toast';

const CHATS_POLL_MS = 4000;
const MESSAGES_POLL_MS = 2000;
const CHATS_STATS_POLL_MS = 10_000;

export function useChats(filter: ChatsFilter = {}) {
  const company = useActiveCompany();
  return useQuery<Chat[]>({
    queryKey: chatKeys.list(filter),
    queryFn: () => fetchChats(filter),
    enabled: !!company,
    refetchInterval: CHATS_POLL_MS,
    refetchIntervalInBackground: false,
  });
}

export function useChatsStats({ enabled = true }: { enabled?: boolean } = {}) {
  const company = useActiveCompany();
  return useQuery<ChatsStats>({
    queryKey: chatKeys.stats(),
    queryFn: fetchChatsStats,
    refetchInterval: CHATS_STATS_POLL_MS,
    refetchIntervalInBackground: false,
    enabled: enabled && !!company,
  });
}

export function useChatMessages(chatId: string | null) {
  const company = useActiveCompany();
  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.messages(chatId ?? ''),
    queryFn: () => fetchChatMessages(chatId as string),
    enabled: !!chatId && !!company,
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

export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => markChatRead(chatId),
    onMutate: async (chatId) => {
      await qc.cancelQueries({ queryKey: chatKeys.lists() });
      await qc.cancelQueries({ queryKey: chatKeys.stats() });

      const previousLists = qc.getQueriesData<Chat[]>({ queryKey: chatKeys.lists() });
      const previousStats = qc.getQueryData<ChatsStats>(chatKeys.stats());
      let hadUnread = false;

      qc.setQueriesData<Chat[]>({ queryKey: chatKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((chat) => {
          if (chat.id !== chatId) return chat;
          if (chat.unread > 0) hadUnread = true;
          return { ...chat, unread: 0 };
        });
      });

      if (hadUnread && previousStats) {
        qc.setQueryData<ChatsStats>(chatKeys.stats(), {
          ...previousStats,
          unread: Math.max(0, previousStats.unread - 1),
        });
      }

      return { previousLists, previousStats };
    },
    onError: (err, _chatId, context) => {
      for (const [key, value] of context?.previousLists ?? []) {
        qc.setQueryData(key, value);
      }
      if (context?.previousStats) {
        qc.setQueryData(chatKeys.stats(), context.previousStats);
      }
      pushToast({ kind: 'error', message: `No se pudo marcar el chat como leído: ${err.message}` });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chatKeys.lists() });
      qc.invalidateQueries({ queryKey: chatKeys.stats() });
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
