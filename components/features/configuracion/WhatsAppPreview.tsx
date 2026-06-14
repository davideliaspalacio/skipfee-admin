'use client';

import { Fragment, type ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import { renderTemplate } from '@/lib/botPreview';
import type { BotMessageContent, BotMessageKind } from '@/lib/api/botMessages';
import { parseWhatsApp, type MdRun } from './whatsappMarkdown';
import styles from './configuracion.module.css';

function runToNode(run: MdRun, key: number): ReactNode {
  let node: ReactNode = run.text;
  if (run.strike) node = <s>{node}</s>;
  if (run.italic) node = <i>{node}</i>;
  if (run.bold) node = <b>{node}</b>;
  return <Fragment key={key}>{node}</Fragment>;
}

function WhatsAppText({ text }: { text: string }) {
  const lines = parseWhatsApp(text);
  return (
    <>
      {lines.map((runs, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {runs.map((r, j) => runToNode(r, j))}
        </Fragment>
      ))}
    </>
  );
}

/**
 * Burbuja que imita cómo ve el cliente el mensaje en WhatsApp: interpreta el
 * formato, sustituye variables con valores de ejemplo y dibuja botones, lista o
 * botón con link. prompt/keywords no son chat (devuelve null).
 */
export function WhatsAppPreview({ kind, content }: { kind: BotMessageKind; content: BotMessageContent }) {
  if (kind === 'prompt' || kind === 'keywords') return null;

  const body = renderTemplate(content.body ?? '');

  return (
    <div className={styles.wa}>
      <div className={styles.waBubble}>
        <div className={styles.waText}><WhatsAppText text={body} /></div>

        {kind === 'list' && (
          <div className={styles.waAction}>
            <Icon.Layers size={13} /> {content.buttonText || 'Ver opciones'}
          </div>
        )}
        {kind === 'cta_url' && (
          <div className={styles.waAction}>
            <Icon.ArrowRight size={13} /> {content.displayText || 'Abrir'}
          </div>
        )}

        <span className={styles.waTime}>12:24</span>
      </div>

      {kind === 'buttons' && (
        <div className={styles.waButtons}>
          {(content.buttons ?? []).map(b => (
            <div key={b.id} className={styles.waReplyBtn}>{renderTemplate(b.title)}</div>
          ))}
        </div>
      )}

      {kind === 'list' && (
        <div className={styles.waListHint}>Las zonas se cargan automáticamente desde tu configuración.</div>
      )}
    </div>
  );
}
