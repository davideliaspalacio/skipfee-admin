'use client';

import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/lib/icons';
import { usePatchBotMessage, useResetBotMessage } from '@/lib/queries';
import type { BotMessage, BotMessageContent } from '@/lib/api/botMessages';
import { WhatsAppPreview } from './WhatsAppPreview';
import styles from './configuracion.module.css';

const BODY_MAX = 1024;
const BTN_MAX = 20;

function clone(c: BotMessageContent): BotMessageContent {
  return JSON.parse(JSON.stringify(c));
}

function hasBodyField(kind: BotMessage['kind']): boolean {
  return kind === 'text' || kind === 'buttons' || kind === 'list' || kind === 'cta_url';
}

/** Editor de UN mensaje del bot (cuerpo + campos según kind + preview en vivo). */
export function MessageEditCard({ msg }: { msg: BotMessage }) {
  const [draft, setDraft] = useState<BotMessageContent>(() => clone(msg.content));
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const patch = usePatchBotMessage();
  const reset = useResetBotMessage();

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(msg.content), [draft, msg.content]);
  const update = (p: Partial<BotMessageContent>) => setDraft(d => ({ ...d, ...p }));

  function insertVar(v: string) {
    const token = `{{${v}}}`;
    const ta = bodyRef.current;
    const body = draft.body ?? '';
    if (!ta) { update({ body: body + token }); return; }
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? start;
    update({ body: body.slice(0, start) + token + body.slice(end) });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const isChat = msg.kind !== 'prompt' && msg.kind !== 'keywords';
  const body = draft.body ?? '';

  return (
    <div className={styles.botEdit}>
      <div className={styles.botEditHead}>
        <div className={styles.col} style={{ gap: 2, minWidth: 0 }}>
          <div className="flex" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b style={{ fontSize: 13.5 }}>{msg.label}</b>
            {msg.isCustomized && <span className="chip sm tone-green">personalizado</span>}
          </div>
          {msg.description && <span className={styles.subtle}>{msg.description}</span>}
        </div>
        {msg.category === 'recordatorio' && (
          <button
            className={`${styles.switch}${msg.enabled ? ` ${styles.on}` : ''}`}
            onClick={() => patch.mutate({ key: msg.key, body: { enabled: !msg.enabled } })}
            disabled={patch.isPending}
            aria-label={msg.enabled ? 'Desactivar recordatorio' : 'Activar recordatorio'}
            title={msg.enabled ? 'Recordatorio activo' : 'Recordatorio apagado'}
          />
        )}
      </div>

      <div className={`${styles.botEditGrid}${isChat ? '' : ` ${styles.noPreview}`}`}>
        <div className={styles.col} style={{ gap: 10 }}>
          {hasBodyField(msg.kind) && (
            <label className={styles.botField}>
              <span className={styles.botFieldLabel}>Mensaje <span className={styles.subtle}>· {body.length}/{BODY_MAX}</span></span>
              <textarea ref={bodyRef} className={styles.botTextarea} rows={4} maxLength={BODY_MAX} value={body} onChange={e => update({ body: e.target.value })} />
            </label>
          )}

          <ExtraFields msg={msg} draft={draft} update={update} />

          {isChat && msg.variables.length > 0 && (
            <div className={styles.botVars}>
              <span className={styles.subtle}>Insertar variable:</span>
              {msg.variables.map(v => (
                <button key={v} type="button" className="chip sm" style={{ cursor: 'pointer' }} onClick={() => insertVar(v)}>{`{{${v}}}`}</button>
              ))}
            </div>
          )}
        </div>

        {isChat && (
          <div className={styles.botEditPreview}>
            <span className={styles.subtle} style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontSize: 11 }}>Vista previa</span>
            <WhatsAppPreview kind={msg.kind} content={draft} />
          </div>
        )}
      </div>

      <div className={styles.botEditFoot}>
        {msg.isCustomized && (
          <button className="btn btn-ghost sm" onClick={() => reset.mutate(msg.key)} disabled={reset.isPending}>
            <Icon.Edit size={12} /> Restaurar original
          </button>
        )}
        <div className={styles.spacer} />
        {dirty && <span className={styles.subtle}>cambios sin guardar</span>}
        <button className="btn btn-primary sm" onClick={() => patch.mutate({ key: msg.key, body: { content: draft } })} disabled={!dirty || patch.isPending}>
          <Icon.Check size={12} /> {patch.isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

interface FieldsProps {
  msg: BotMessage;
  draft: BotMessageContent;
  update: (p: Partial<BotMessageContent>) => void;
}

function ExtraFields({ msg, draft, update }: FieldsProps) {
  switch (msg.kind) {
    case 'text':
      return null;
    case 'buttons':
      return (
        <div className={styles.botField}>
          <span className={styles.botFieldLabel}>Botones (solo el texto; el comportamiento es fijo)</span>
          {(draft.buttons ?? []).map((b, i) => (
            <div key={b.id} className="flex" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                value={b.title}
                maxLength={BTN_MAX}
                onChange={e => {
                  const buttons = [...(draft.buttons ?? [])];
                  buttons[i] = { ...b, title: e.target.value };
                  update({ buttons });
                }}
              />
              <span className={styles.subtle} style={{ whiteSpace: 'nowrap' }}>{b.title.length}/{BTN_MAX}</span>
            </div>
          ))}
        </div>
      );
    case 'list':
      return (
        <>
          <LabeledInput label="Texto del botón de la lista" value={draft.buttonText ?? ''} max={BTN_MAX} onChange={v => update({ buttonText: v })} />
          <LabeledInput label="Descripción de cada fila" value={draft.rowDescriptionTemplate ?? ''} onChange={v => update({ rowDescriptionTemplate: v })} hint="Las zonas se cargan solas; {{tarifa}} es el valor del domicilio." />
        </>
      );
    case 'cta_url':
      return <LabeledInput label="Texto del botón con link" value={draft.displayText ?? ''} max={BTN_MAX} onChange={v => update({ displayText: v })} />;
    case 'prompt':
      return (
        <>
          <PlainTextArea label="Instrucción de la IA (tono y reglas)" value={draft.systemPrompt ?? ''} rows={12} onChange={v => update({ systemPrompt: v })} />
          <PlainTextArea label="Respuesta si la IA falla" value={draft.safeDefault ?? ''} max={BODY_MAX} onChange={v => update({ safeDefault: v })} />
        </>
      );
    case 'keywords':
      return <KeywordsEditor words={draft.words ?? []} onChange={words => update({ words })} />;
  }
}

function PlainTextArea(props: { label: string; value: string; onChange: (v: string) => void; max?: number; rows?: number }) {
  return (
    <label className={styles.botField}>
      <span className={styles.botFieldLabel}>
        {props.label}
        {props.max != null && <span className={styles.subtle}> · {props.value.length}/{props.max}</span>}
      </span>
      <textarea className={styles.botTextarea} rows={props.rows ?? 4} maxLength={props.max} value={props.value} onChange={e => props.onChange(e.target.value)} />
    </label>
  );
}

function LabeledInput(props: { label: string; value: string; onChange: (v: string) => void; max?: number; hint?: string }) {
  return (
    <label className={styles.botField}>
      <span className={styles.botFieldLabel}>
        {props.label}
        {props.max != null && <span className={styles.subtle}> · {props.value.length}/{props.max}</span>}
      </span>
      <input className="input" value={props.value} maxLength={props.max} onChange={e => props.onChange(e.target.value)} />
      {props.hint && <span className={styles.hint}>{props.hint}</span>}
    </label>
  );
}

function KeywordsEditor({ words, onChange }: { words: string[]; onChange: (w: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const w = input.trim().toLowerCase();
    if (w && !words.includes(w)) onChange([...words, w]);
    setInput('');
  };
  return (
    <div className={styles.botField}>
      <span className={styles.botFieldLabel}>Palabras gatillo (cualquiera dispara la acción)</span>
      <div className={styles.kwWrap}>
        {words.map(w => (
          <span key={w} className={`chip sm ${styles.kwChip}`}>
            {w}
            <button type="button" onClick={() => onChange(words.filter(x => x !== w))} aria-label={`Quitar ${w}`}>
              <Icon.X size={11} />
            </button>
          </span>
        ))}
        {words.length === 0 && <span className={styles.subtle}>Sin palabras.</span>}
      </div>
      <div className="flex" style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          value={input}
          placeholder="agregar palabra y Enter…"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn btn-ghost sm" onClick={add}><Icon.Plus size={12} /> Agregar</button>
      </div>
    </div>
  );
}
