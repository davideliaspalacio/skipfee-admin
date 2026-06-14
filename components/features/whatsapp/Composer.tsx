'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import { Theme as EmojiTheme } from 'emoji-picker-react';
import { Icon } from '@/lib/icons';
import { useIsDark } from '@/lib/hooks';
import { useSendChatMessage, useUploadChatImage, useChatRelease } from '@/lib/queries';
import styles from './whatsapp.module.css';

// emoji-picker-react accede a `window` al montar; cárgalo solo en cliente.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export function Composer({
  chatId,
  botPaused,
  onOptimistic,
}: {
  chatId: string;
  botPaused: boolean;
  /** Empuja una burbuja optimista al hilo; se reconcilia con el poll de 2s. */
  onOptimistic: (msg: { text: string; mediaUrl?: string }) => void;
}) {
  const dark = useIsDark();
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPopRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useSendChatMessage();
  const uploadImage = useUploadChatImage();
  const release = useChatRelease();
  const sending = sendMessage.isPending || uploadImage.isPending;

  // Reset al cambiar de chat.
  useEffect(() => {
    setDraft('');
    setPendingImage(null);
    setShowEmoji(false);
  }, [chatId]);

  // Preview local de la imagen pendiente; se revoca para no fugar memoria.
  useEffect(() => {
    if (!pendingImage) {
      setPendingPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPendingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  // Cerrar el popover de emojis al clic afuera o ESC.
  useEffect(() => {
    if (!showEmoji) return;
    function onDown(e: MouseEvent) {
      if (!emojiPopRef.current) return;
      if (!emojiPopRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowEmoji(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showEmoji]);

  // Autosize del textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const onSend = async () => {
    if (sending) return;
    const caption = draft.trim();
    if (!caption && !pendingImage) return;

    if (pendingImage) {
      try {
        const url = await uploadImage.mutateAsync({ chatId, file: pendingImage });
        onOptimistic({ text: caption, mediaUrl: url });
        await sendMessage.mutateAsync({
          chatId,
          body: caption || undefined,
          imageUrl: url,
        });
        setDraft('');
        setPendingImage(null);
      } catch {
        // los toasts los muestran las mutations
      }
      return;
    }

    onOptimistic({ text: caption });
    sendMessage.mutate(
      { chatId, body: caption },
      { onSuccess: () => setDraft('') },
    );
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPendingImage(f);
    e.target.value = '';
  };

  const onPickEmoji = (data: EmojiClickData) => setDraft((d) => d + data.emoji);

  return (
    <div className={styles.composer}>
      {botPaused && (
        <div className={`${styles.banner} ${styles.bannerBot}`}>
          <Icon.Bot size={15} />
          <span className={styles.bannerText}>
            <b>Bot pausado.</b> Tus mensajes salen como auxiliar humana.
          </span>
          <span className={styles.bannerActions}>
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => release.mutate(chatId)}
              disabled={release.isPending}
            >
              {release.isPending ? 'Reanudando…' : 'Reanudar bot'}
            </button>
          </span>
        </div>
      )}

      {pendingImage && pendingPreview && (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.previewImg} src={pendingPreview} alt="Adjunto" />
          <div className={styles.previewMeta}>
            <span className={styles.previewName}>{pendingImage.name}</span>
            <span className={styles.previewSize}>
              {Math.round(pendingImage.size / 1024)} KB
            </span>
          </div>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setPendingImage(null)}
            disabled={sending}
            title="Quitar imagen"
          >
            <Icon.X size={14} />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className={styles.emojiPop} ref={emojiPopRef}>
          <EmojiPicker
            onEmojiClick={onPickEmoji}
            theme={dark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            width={320}
            height={380}
            lazyLoadEmojis
            searchPlaceHolder="Buscar emoji…"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />

      <div className={styles.composerRow}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Adjuntar imagen"
        >
          <Icon.Paperclip size={15} />
        </button>

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          rows={1}
          placeholder={pendingImage ? 'Caption opcional…' : 'Escribe un mensaje…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sending}
        />

        <button
          type="button"
          className={`${styles.iconBtn} ${showEmoji ? styles.on : ''}`}
          onClick={() => setShowEmoji((s) => !s)}
          title="Emojis"
        >
          <Icon.Smile size={15} />
        </button>

        <button
          type="button"
          className={styles.sendBtn}
          onClick={onSend}
          disabled={sending || (!draft.trim() && !pendingImage)}
          title="Enviar"
        >
          {sending ? <span className={styles.spin} /> : <Icon.Send size={15} />}
        </button>
      </div>
    </div>
  );
}
