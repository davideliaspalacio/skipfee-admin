/**
 * Grafo del flujo del bot para el diagrama de Configuración → Mensajes del bot.
 *
 * Es LAYOUT (no datos): describe qué nodos hay, dónde se dibujan y cómo se
 * conectan. Cada nodo agrupa uno o más `steps` del state machine del backend;
 * los mensajes del catálogo se reparten por su campo `step`.
 *
 * La lógica del flujo vive en el backend (handlers); acá solo lo visualizamos.
 */

export interface FlowNode {
  id: string;
  title: string;
  col: number;
  row: number;
  steps: string[]; // steps del backend que agrupa este nodo
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  back?: boolean; // arista de retorno (se dibuja por debajo)
}

export const FLOW_NODES: FlowNode[] = [
  { id: 'inicio', title: 'Saludo + menú', col: 0, row: 1, steps: ['inicio'] },
  { id: 'confirmar_recurrente', title: 'Confirmar (recurrente)', col: 1, row: 0, steps: ['confirmar_recurrente'] },
  { id: 'registro_nombre', title: 'Registro: nombre', col: 1, row: 2, steps: ['registro_nombre'] },
  { id: 'registro_email', title: 'Registro: correo', col: 2, row: 2, steps: ['registro_email'] },
  { id: 'registro_confirmar', title: 'Confirmar datos', col: 3, row: 2, steps: ['registro_confirmar'] },
  { id: 'direccion_texto', title: 'Dirección', col: 4, row: 1, steps: ['direccion_texto'] },
  { id: 'direccion_zona', title: 'Zona', col: 5, row: 1, steps: ['direccion_zona'] },
  { id: 'direccion_confirmar', title: 'Confirmar dirección', col: 6, row: 1, steps: ['direccion_confirmar'] },
  { id: 'link_enviado', title: 'Enviar link 🛒', col: 7, row: 1, steps: ['link_enviado'] },
];

export const FLOW_EDGES: FlowEdge[] = [
  { from: 'inicio', to: 'confirmar_recurrente', label: 'recurrente' },
  { from: 'inicio', to: 'registro_nombre', label: 'nuevo' },
  { from: 'confirmar_recurrente', to: 'link_enviado', label: '✅ misma dir' },
  { from: 'confirmar_recurrente', to: 'direccion_texto', label: '✏️ cambiar' },
  { from: 'registro_nombre', to: 'registro_email' },
  { from: 'registro_email', to: 'registro_confirmar' },
  { from: 'registro_confirmar', to: 'direccion_texto', label: '✅ datos ok' },
  { from: 'registro_confirmar', to: 'registro_nombre', label: '❌ no', back: true },
  { from: 'direccion_texto', to: 'direccion_zona' },
  { from: 'direccion_zona', to: 'direccion_confirmar' },
  { from: 'direccion_confirmar', to: 'link_enviado', label: '✅' },
  { from: 'direccion_confirmar', to: 'direccion_texto', label: '✏️ editar', back: true },
];

/** Geometría del canvas. */
export const GRID = {
  colW: 214,
  rowH: 128,
  nodeW: 176,
  nodeH: 80,
  padX: 24,
  padY: 24,
};

export function nodePos(node: FlowNode): { x: number; y: number } {
  return { x: GRID.padX + node.col * GRID.colW, y: GRID.padY + node.row * GRID.rowH };
}

export function canvasSize(): { width: number; height: number } {
  const maxCol = Math.max(...FLOW_NODES.map(n => n.col));
  const maxRow = Math.max(...FLOW_NODES.map(n => n.row));
  return {
    width: GRID.padX * 2 + maxCol * GRID.colW + GRID.nodeW,
    height: GRID.padY * 2 + maxRow * GRID.rowH + GRID.nodeH + 40, // +40 para aristas back
  };
}

/** Secciones para los mensajes que NO son nodos del flujo lineal. */
export interface BotSection {
  id: string;
  title: string;
  sub: string;
  /** Filtro sobre los mensajes del catálogo. */
  match: (category: string, step: string | null) => boolean;
}

export const BOT_SECTIONS: BotSection[] = [
  {
    id: 'globales',
    title: 'Mensajes globales',
    sub: 'Escalar a humano, cancelar y errores — pueden dispararse en cualquier paso.',
    match: (cat, step) => cat === 'conversacion' && step === null,
  },
  {
    id: 'recordatorios',
    title: 'Recordatorios de inactividad',
    sub: 'Se envían si el cliente deja de responder. Podés apagar cada uno.',
    match: cat => cat === 'recordatorio',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones del pedido',
    sub: 'Avisos automáticos después del pago: en cocina, en camino, entregado.',
    match: cat => cat === 'notificacion',
  },
  {
    id: 'sistema',
    title: 'Tono de la IA y palabras clave',
    sub: 'La persona del asistente con IA y las palabras que disparan acciones.',
    match: cat => cat === 'sistema',
  },
];
