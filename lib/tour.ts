import type { ScreenId } from './nav';

// Pasos del recorrido guiado del demo (driver.js). Cada paso puede ocurrir en una
// pantalla distinta (`/preview/<screen>`); el TourController navega solo entre ellas.
// `element` se resalta; sin `element` el popover sale centrado (modal).

export interface TourStep {
  screen: ScreenId;
  /** Selector a resaltar en desktop. Vacío = popover central. */
  element?: string;
  /** Selector alternativo en móvil (si difiere del desktop). */
  elementMobile?: string;
  title: string;
  /** Acepta HTML simple (negritas, etc.). */
  description: string;
  /** Solo se muestra si el plan tiene pantallas bloqueadas. */
  onlyIfLocked?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    screen: 'dashboard',
    title: '👋 Bienvenido al demo de Skipfee',
    description:
      'Te muestro cómo se opera tu restaurante de punta a punta. Todo lo que ves son <b>datos de ejemplo</b>: nada de lo que toques afecta información real.',
  },
  {
    screen: 'dashboard',
    element: '.demo-banner',
    title: 'Estás en modo demo',
    description: 'Esta barra te recuerda que es una demostración y con qué plan la estás viendo.',
  },
  {
    screen: 'dashboard',
    element: '.rail',
    elementMobile: '.mobnav',
    title: 'Tu navegación',
    description:
      'Desde aquí entras a cada área del negocio: pedidos, cocina, despachos, WhatsApp, reportes y más.',
  },
  {
    screen: 'dashboard',
    element: '.content',
    title: 'El pulso del día',
    description:
      'Ventas, pedidos activos, completados y ticket promedio — siempre en vivo, sin tener que pedirlo.',
  },
  {
    screen: 'pedidos',
    element: '.content',
    title: 'Pedidos en vivo',
    description:
      'Cada pedido entra desde WhatsApp y avanza por estados (nuevo → cocina → ruta → entregado). Aquí los arrastras entre columnas.',
  },
  {
    screen: 'whatsapp',
    element: '.content',
    title: 'WhatsApp con bot',
    description:
      'El bot atiende solo 24/7 y tú tomas el control cuando quieras. Acá ves los chats y respondes con un clic.',
  },
  {
    screen: 'dashboard',
    element: '.rail-item.is-locked',
    elementMobile: '.demo-banner',
    title: 'Funciones por plan',
    description:
      'Lo que tu plan no incluye aparece con un candado 🔒. Súbete de plan para activarlo cuando lo necesites.',
    onlyIfLocked: true,
  },
];
