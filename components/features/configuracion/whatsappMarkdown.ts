/**
 * Mini-parser del formato de WhatsApp (*negrita*, _cursiva_, ~tachado~).
 * Copiado/adaptado del Vite app (frontend/src/components/bot/whatsappMarkdown.ts),
 * que no tiene equivalente en admin-skipfee/lib. Solo se usa en el preview del bot.
 */

export interface MdRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}

type FormatKey = 'bold' | 'italic' | 'strike';

const MARKERS: Array<{ char: string; key: FormatKey }> = [
  { char: '*', key: 'bold' },
  { char: '_', key: 'italic' },
  { char: '~', key: 'strike' },
];

/** Parsea una línea en runs con formato. Anidado simple (un marcador por tramo). */
function parseLine(line: string): MdRun[] {
  const runs: MdRun[] = [];
  const active: Partial<Record<FormatKey, boolean>> = {};
  let buf = '';

  const flush = () => {
    if (buf) {
      runs.push({ text: buf, ...active });
      buf = '';
    }
  };

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const marker = MARKERS.find(m => m.char === ch);
    if (marker) {
      // Solo togglear si el marcador delimita texto (evita "5 * 3").
      const next = line[i + 1];
      const prev = line[i - 1];
      const opening = !active[marker.key] && next && next !== ' ';
      const closing = active[marker.key] && prev && prev !== ' ';
      if (opening || closing) {
        flush();
        active[marker.key] = !active[marker.key];
        continue;
      }
    }
    buf += ch;
  }
  flush();
  return runs.length ? runs : [{ text: line }];
}

/** Convierte texto multilínea en líneas de runs con formato. */
export function parseWhatsApp(text: string): MdRun[][] {
  return text.split('\n').map(parseLine);
}
