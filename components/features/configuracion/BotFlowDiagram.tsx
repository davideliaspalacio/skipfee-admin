'use client';

import { Icon } from '@/lib/icons';
import { FLOW_NODES, FLOW_EDGES, GRID, nodePos, canvasSize, type FlowNode } from '@/lib/botFlow';
import type { BotMessage } from '@/lib/api/botMessages';
import styles from './configuracion.module.css';

function messagesOfNode(node: FlowNode, messages: BotMessage[]): BotMessage[] {
  return messages.filter(m => m.category === 'conversacion' && m.step !== null && node.steps.includes(m.step));
}

function edgePath(fromId: string, toId: string, back?: boolean): string {
  const from = FLOW_NODES.find(n => n.id === fromId)!;
  const to = FLOW_NODES.find(n => n.id === toId)!;
  const f = nodePos(from);
  const t = nodePos(to);
  if (back) {
    const x1 = f.x + GRID.nodeW / 2;
    const y1 = f.y + GRID.nodeH;
    const x2 = t.x + GRID.nodeW / 2;
    const y2 = t.y + GRID.nodeH;
    const dip = 42;
    return `M ${x1} ${y1} C ${x1} ${y1 + dip}, ${x2} ${y2 + dip}, ${x2} ${y2}`;
  }
  const x1 = f.x + GRID.nodeW;
  const y1 = f.y + GRID.nodeH / 2;
  const x2 = t.x;
  const y2 = t.y + GRID.nodeH / 2;
  const dx = Math.max(36, (x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function labelPos(fromId: string, toId: string, back?: boolean): { x: number; y: number } {
  const from = FLOW_NODES.find(n => n.id === fromId)!;
  const to = FLOW_NODES.find(n => n.id === toId)!;
  const f = nodePos(from);
  const t = nodePos(to);
  if (back) return { x: (f.x + t.x) / 2 + GRID.nodeW / 2, y: Math.max(f.y, t.y) + GRID.nodeH + 28 };
  const x1 = f.x + GRID.nodeW;
  const x2 = t.x;
  const y1 = f.y + GRID.nodeH / 2;
  const y2 = t.y + GRID.nodeH / 2;
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 12 };
}

/** Diagrama del flujo del bot: nodos posicionados sobre una capa SVG con aristas. */
export function BotFlowDiagram({ messages, onSelect }: { messages: BotMessage[]; onSelect: (nodeId: string) => void }) {
  const { width, height } = canvasSize();

  return (
    <div className={styles.flowScroll}>
      <div className={styles.flow} style={{ width, height }}>
        <svg className={styles.flowEdges} width={width} height={height} aria-hidden="true">
          <defs>
            <marker id="cfg-bot-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill="currentColor" />
            </marker>
          </defs>
          {FLOW_EDGES.map((e, i) => (
            <path key={i} d={edgePath(e.from, e.to, e.back)} className={`${styles.edge}${e.back ? ` ${styles.back}` : ''}`} markerEnd="url(#cfg-bot-arrow)" />
          ))}
        </svg>

        {FLOW_EDGES.filter(e => e.label).map((e, i) => {
          const p = labelPos(e.from, e.to, e.back);
          return <span key={i} className={styles.edgeLabel} style={{ left: p.x, top: p.y }}>{e.label}</span>;
        })}

        {FLOW_NODES.map(n => {
          const pos = nodePos(n);
          const msgs = messagesOfNode(n, messages);
          const customized = msgs.some(m => m.isCustomized);
          return (
            <button key={n.id} type="button" className={styles.node} style={{ left: pos.x, top: pos.y, width: GRID.nodeW, height: GRID.nodeH }} onClick={() => onSelect(n.id)}>
              <span className={styles.nodeTitle}>{n.title}</span>
              <span className={styles.nodeMeta}>
                <Icon.MessageCircle size={11} />
                {msgs.length} {msgs.length === 1 ? 'mensaje' : 'mensajes'}
                {customized && <span className={styles.nodeDot} title="Tiene mensajes personalizados" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
