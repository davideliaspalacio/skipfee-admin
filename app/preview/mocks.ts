/**
 * Datos mock para la GALERÍA DE PREVIEW (solo dev / render-check).
 *
 * Estos objetos siembran el QueryClient de cada `app/preview/<pantalla>/page.tsx`
 * con las query keys que la pantalla consume, para renderizar el diseño real
 * sin backend ni login. Cumplen EXACTAMENTE los tipos de `lib/api/*` y `lib/data`.
 *
 * No forman parte del producto: se pueden borrar junto con `app/preview/`.
 * Reusan los datos de ejemplo ya tipados de `lib/data` (CHATS, ORDERS, etc.).
 */

import type { Chat, ChatMessage, Customer, Order, Product, Zone } from '@/lib/data';
import { CHATS, CHAT_MESSAGES, CUSTOMERS, ORDERS, SALES_7D, HOURLY_HEATMAP, ZONES } from '@/lib/data';
import type { ChatsStats } from '@/lib/api/chats';
import type { DashboardData } from '@/lib/api/dashboard';
import type { ReportsData } from '@/lib/api/reports';
import type { Settings } from '@/lib/api/settings';
import type { Cook } from '@/lib/api/cooks';
import type { BotMessage } from '@/lib/api/botMessages';
import type { Promotion, ActivePromotion } from '@/lib/api/promotions';
import type { Reward } from '@/lib/api/rewards';
import type { Survey } from '@/lib/api/surveys';

/* ------------------------------------------------------------------ *
 * Reexports tipados desde lib/data (Chat[], Order[], Customer[], Zone[]).
 * ------------------------------------------------------------------ */
export const mockChats: Chat[] = CHATS;
export const mockCustomers: Customer[] = CUSTOMERS;
export const mockOrders: Order[] = ORDERS;
export const mockZones: Zone[] = ZONES;

/** Pedidos empacados → la pantalla Despachos pide `useOrders({ status: 'empacado' })`. */
export const mockPackedOrders: Order[] = ORDERS.filter((o) => o.status === 'empacado');

/**
 * Mensajes por chat. La pantalla WhatsApp auto-selecciona el primer chat (ch1),
 * así que sembramos ch1 además de ch2 (que ya trae lib/data) para que el hilo
 * renderice con contenido en vez de vacío.
 */
export const mockChatMessages: Record<string, ChatMessage[]> = {
  ch1: [
    { who: 'bot', text: '¡Hola María Camila! Soy el bot de Skipfee 🤖 ¿Qué te provoca hoy?', time: '12:40' },
    { who: 'in', text: '¿Tienen Pastrami Bros disponible?', time: '12:42' },
    { who: 'bot', text: 'Sí 🙌 El Pastrami Bros está disponible ($28.000). ¿Te armo el pedido?', time: '12:42' },
    { who: 'in', text: 'Dale, 2 porfa', time: '12:43' },
    { who: 'bot', text: 'Listo: 2× Pastrami Bros = $56.000. Te paso el link de pago en un momento.', time: '12:43' },
  ],
  ...CHAT_MESSAGES,
};

export const mockChatsStats: ChatsStats = {
  total: CHATS.length,
  pending: CHATS.filter((c) => c.status === 'pending').length,
  unread: CHATS.reduce((sum, c) => sum + c.unread, 0),
};

/* ------------------------------------------------------------------ *
 * Productos (Product[] de lib/data) — catálogo + configuración.
 * ------------------------------------------------------------------ */
export const mockProducts: Product[] = [
  { id: 'p01', name: 'Pastrami Bros', price: 28000, cat: 'Sándwiches', sold: 312, available: true, img: '', description: 'Pastrami curado 12h, mostaza de la casa y pepinillos.' },
  { id: 'p02', name: 'Cubano', price: 26000, cat: 'Sándwiches', sold: 268, available: true, img: '', description: 'Cerdo, jamón, queso suizo y pepinillos en pan prensado.' },
  { id: 'p03', name: 'Reuben Brisket', price: 31000, cat: 'Sándwiches', sold: 201, available: true, img: '', description: 'Brisket, chucrut, queso suizo y salsa rusa.' },
  { id: 'p04', name: 'Porchetta', price: 30000, cat: 'Sándwiches', sold: 184, available: false, img: '', description: 'Cerdo asado a las hierbas con rúgula.' },
  { id: 'p05', name: 'Smash Burger', price: 27000, cat: 'Sándwiches', sold: 176, available: true, img: '', description: null },
  { id: 'p06', name: 'Veggie Bros', price: 24000, cat: 'Sándwiches', sold: 98, available: true, img: '', description: 'Portobello, queso provolone y pesto.' },
  { id: 'p07', name: 'Coca-Cola Zero', price: 6000, cat: 'Bebidas', sold: 421, available: true, img: '', description: null },
  { id: 'p08', name: 'Limonada de coco', price: 9000, cat: 'Bebidas', sold: 233, available: true, img: '', description: null },
  { id: 'p09', name: 'Cerveza Club Colombia', price: 8000, cat: 'Bebidas', sold: 189, available: true, img: '', description: null },
  { id: 'p10', name: 'Brownie', price: 9000, cat: 'Postres', sold: 154, available: true, img: '', description: 'Brownie de chocolate con nuez.' },
  { id: 'p11', name: 'Cheesecake', price: 11000, cat: 'Postres', sold: 121, available: true, img: '', description: null },
  { id: 'p12', name: 'Combo Pastrami + Coca', price: 32000, cat: 'Combos', sold: 142, available: true, img: '', description: 'Pastrami Bros + Coca-Cola Zero.' },
];

/* ------------------------------------------------------------------ *
 * Settings — catálogo (categorías), configuración (todos los campos),
 * despachos (origen lat/lng/label).
 * ------------------------------------------------------------------ */
export const mockSettings: Settings = {
  openHour: '11:00',
  closeHour: '22:00',
  openDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  peakStart: '12:00',
  peakEnd: '14:00',
  peakSurcharge: 2000,
  baseDeliveryFee: 4500,
  reminderMinutes: 20,
  hours: {
    mon: { open: '11:00', close: '22:00' },
    tue: { open: '11:00', close: '22:00' },
    wed: { open: '11:00', close: '22:00' },
    thu: { open: '11:00', close: '22:00' },
    fri: { open: '11:00', close: '23:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { closed: true },
  },
  ordersPaused: false,
  deliveredWindowHours: 6,
  surveyEnabled: true,
  surveyDelayMinutes: 30,
  reviewGiftEnabled: true,
  reviewGiftName: 'Brownie',
  reviewGiftExpiryDays: 30,
  reviewLink: 'https://g.page/r/skipfee/review',
  surveyMinDays: 14,
  reviewGiftProductId: 'p10',
  localAddress: 'Cra. 43A #11-50, El Poblado, Medellín',
  businessDescription: 'sandwichería artesanal en El Poblado',
  logoUrl: null,
  brandColor: '#22C55E',
  localLat: 6.2087,
  localLng: -75.5658,
  localLabel: 'Skipfee',
  categories: ['Sándwiches', 'Bebidas', 'Postres', 'Combos'],
  updatedAt: '2026-06-14T12:00:00Z',
};

/* ------------------------------------------------------------------ *
 * Cocineros — Configuración → Cocineros.
 * ------------------------------------------------------------------ */
export const mockCooks: Cook[] = [
  {
    id: 'ck1',
    name: 'Carolina Restrepo',
    hours: {
      mon: { open: '10:00', close: '18:00' },
      tue: { open: '10:00', close: '18:00' },
      wed: { open: '10:00', close: '18:00' },
      thu: { open: '10:00', close: '18:00' },
      fri: { open: '10:00', close: '18:00' },
    },
    archived: false,
  },
  {
    id: 'ck2',
    name: 'Diego Patiño',
    hours: {
      thu: { open: '14:00', close: '23:00' },
      fri: { open: '14:00', close: '23:00' },
      sat: { open: '12:00', close: '23:00' },
      sun: { open: '12:00', close: '21:00' },
    },
    archived: false,
  },
  { id: 'ck3', name: 'Natalia Gómez', hours: null, archived: false },
];

/* ------------------------------------------------------------------ *
 * Mensajes del bot — Configuración → Mensajes del bot.
 * ------------------------------------------------------------------ */
export const mockBotMessages: BotMessage[] = [
  {
    key: 'welcome',
    category: 'conversacion',
    step: 'inicio',
    kind: 'text',
    label: 'Mensaje de bienvenida',
    description: 'Primer mensaje cuando el cliente escribe por primera vez.',
    variables: ['nombre'],
    content: { body: '¡Hola {{nombre}}! Soy el bot de Skipfee 🤖 ¿Qué te provoca hoy?' },
    defaultContent: { body: '¡Hola {{nombre}}! Soy el bot de Skipfee 🤖 ¿Qué te provoca hoy?' },
    isCustomized: false,
    enabled: true,
    updatedAt: null,
  },
  {
    key: 'menu_buttons',
    category: 'conversacion',
    step: 'menu',
    kind: 'buttons',
    label: 'Menú principal',
    description: 'Botones de acción rápida en el menú.',
    variables: [],
    content: {
      body: '¿Qué quieres hacer?',
      buttons: [
        { id: 'pedir', title: 'Hacer un pedido' },
        { id: 'estado', title: 'Estado de pedido' },
        { id: 'agente', title: 'Hablar con alguien' },
      ],
    },
    defaultContent: {
      body: '¿Qué quieres hacer?',
      buttons: [
        { id: 'pedir', title: 'Hacer un pedido' },
        { id: 'estado', title: 'Estado de pedido' },
        { id: 'agente', title: 'Hablar con alguien' },
      ],
    },
    isCustomized: true,
    enabled: true,
    updatedAt: '2026-06-10T09:30:00Z',
  },
  {
    key: 'reminder_pending',
    category: 'recordatorio',
    step: null,
    kind: 'text',
    label: 'Recordatorio de carrito pendiente',
    description: 'Se envía si el cliente no completó el pago.',
    variables: ['nombre', 'total'],
    content: { body: '{{nombre}}, dejaste tu pedido por ${{total}} sin pagar. ¿Lo retomamos? 😊' },
    defaultContent: { body: '{{nombre}}, dejaste tu pedido por ${{total}} sin pagar. ¿Lo retomamos? 😊' },
    isCustomized: false,
    enabled: true,
    updatedAt: null,
  },
  {
    key: 'order_on_route',
    category: 'notificacion',
    step: null,
    kind: 'text',
    label: 'Pedido en ruta',
    description: 'Notificación cuando el pedido sale a entregar.',
    variables: ['nombre'],
    content: { body: '¡{{nombre}}, tu pedido va en camino! 🛵 Llega en unos minutos.' },
    defaultContent: { body: '¡{{nombre}}, tu pedido va en camino! 🛵 Llega en unos minutos.' },
    isCustomized: false,
    enabled: true,
    updatedAt: null,
  },
];

/* ------------------------------------------------------------------ *
 * Promociones — Configuración → Promociones (usePromotions(true)).
 * ------------------------------------------------------------------ */
export const mockPromotions: Promotion[] = [
  {
    id: 'promo1',
    kind: 'weekday',
    name: 'Miércoles 2x1 en Pastrami',
    description: 'Pedí un Pastrami Bros y el segundo va por nuestra cuenta.',
    discount_type: 'two_for_one',
    discount_value: 0,
    min_subtotal: 0,
    config: { product_ids: ['p01'], weekdays: [3] },
    active: true,
    archived: false,
    starts_at: null,
    ends_at: null,
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'promo2',
    kind: 'product',
    name: '15% en Combos',
    description: 'Descuento en toda la categoría de combos.',
    discount_type: 'percent',
    discount_value: 15,
    min_subtotal: 30000,
    config: { product_ids: ['p12'] },
    active: true,
    archived: false,
    starts_at: '2026-06-01T00:00:00Z',
    ends_at: '2026-06-30T23:59:00Z',
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z',
  },
  {
    id: 'promo3',
    kind: 'weekday',
    name: 'Happy Hour bebidas',
    description: '$2.000 de descuento en bebidas de 3 a 5 pm.',
    discount_type: 'fixed',
    discount_value: 2000,
    min_subtotal: 0,
    config: { weekdays: [1, 2, 3, 4, 5], starts_hhmm: '15:00', ends_hhmm: '17:00' },
    active: false,
    archived: true,
    starts_at: null,
    ends_at: null,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-30T10:00:00Z',
  },
];

/** Promo activa hidratada con productos → banner del Dashboard. */
export const mockActivePromotions: ActivePromotion[] = [
  {
    ...mockPromotions[0],
    products: [
      { id: 'p01', name: 'Pastrami Bros', price: 28000, cat: 'Sándwiches', img: null, description: 'Pastrami curado 12h.', available: true },
    ],
  },
  {
    ...mockPromotions[1],
    products: [
      { id: 'p12', name: 'Combo Pastrami + Coca', price: 32000, cat: 'Combos', img: null, description: 'Pastrami Bros + Coca-Cola Zero.', available: true },
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Recompensas (reseñas pendientes) — WhatsApp usa useRewards('pendiente').
 * ------------------------------------------------------------------ */
export const mockRewards: Reward[] = [
  {
    id: 'rw1',
    phone: '+57 312 645 1209',
    kind: 'postre',
    status: 'pendiente',
    orderIdOrigen: '048',
    screenshotUrl: null,
    createdAt: '2026-06-13T18:00:00Z',
    grantedAt: null,
    grantedBy: null,
    expiresAt: null,
  },
  {
    id: 'rw2',
    phone: '+57 320 558 0033',
    kind: 'postre',
    status: 'pendiente',
    orderIdOrigen: '045',
    screenshotUrl: null,
    createdAt: '2026-06-13T19:30:00Z',
    grantedAt: null,
    grantedBy: null,
    expiresAt: null,
  },
];

/* ------------------------------------------------------------------ *
 * Encuestas/reseñas — Configuración → Reseñas (useSurveys(90)).
 * ------------------------------------------------------------------ */
export const mockSurveys: Survey[] = [
  { id: 's1', orderId: '048', phone: '+57 312 645 1209', name: 'María Camila Ruiz', rating: 5, comment: '¡Todo delicioso y llegó calientico! 🙌', respondedAt: '2026-06-13T20:00:00Z' },
  { id: 's2', orderId: '045', phone: '+57 320 558 0033', name: 'Laura Mejía', rating: 5, comment: 'El mejor pastrami de la ciudad.', respondedAt: '2026-06-13T19:10:00Z' },
  { id: 's3', orderId: '041', phone: '+57 304 117 8821', name: 'Andrés Felipe Ochoa', rating: 4, comment: 'Muy bueno, aunque se demoró un poquito.', respondedAt: '2026-06-12T21:30:00Z' },
  { id: 's4', orderId: '038', phone: '+57 318 902 6614', name: 'Santiago Hoyos', rating: 3, comment: 'Faltó la salsa que pedí.', respondedAt: '2026-06-11T20:45:00Z' },
  { id: 's5', orderId: '034', phone: '+57 312 332 8941', name: null, rating: 5, comment: null, respondedAt: '2026-06-10T19:00:00Z' },
];

/* ------------------------------------------------------------------ *
 * Dashboard (DashboardData) — useDashboard().
 * ------------------------------------------------------------------ */
export const mockDashboard: DashboardData = {
  salesAmount: 1860000,
  completedOrders: 58,
  activeOrders: 12,
  avgTicket: 36800,
  sales7d: SALES_7D.map((d) => ({ day: d.day, sales: d.sales, orders: d.orders })),
  productMix: [
    { name: 'Pastrami Bros', value: 18, color: '#E85D04' },
    { name: 'Cubano', value: 14, color: '#606C38' },
    { name: 'Combos', value: 11, color: '#5E6AD2' },
    { name: 'Bebidas', value: 9, color: '#A16207' },
    { name: 'Postres', value: 6, color: '#0EA5E9' },
  ],
  attentionOrders: [
    { id: '050', number: 50, cliente: 'Sofía Restrepo', status: 'cocina', minutos: 28, reason: '' },
    { id: '049', number: 49, cliente: 'Tomás Aristizábal', status: 'empacado', minutos: 41, reason: 'Lleva 41m empacado sin despachar' },
    { id: '047', number: 47, cliente: 'Felipe Quintero', status: 'pagado', minutos: 22, reason: '' },
  ],
};

/* ------------------------------------------------------------------ *
 * Reportes (ReportsData) — useReports('30d') (período default de la pantalla).
 * ------------------------------------------------------------------ */
export const mockReports: ReportsData = {
  period: '30d',
  financial: {
    bruto: 48700000,
    domicilios: 5100000,
    neto: 43600000,
    variation: 18.4,
  },
  weeklyComparison: [
    { label: 'Lun', thisMonth: 1180000, lastMonth: 980000 },
    { label: 'Mar', thisMonth: 1410000, lastMonth: 1220000 },
    { label: 'Mié', thisMonth: 1320000, lastMonth: 1310000 },
    { label: 'Jue', thisMonth: 1520000, lastMonth: 1280000 },
    { label: 'Vie', thisMonth: 1860000, lastMonth: 1620000 },
    { label: 'Sáb', thisMonth: 2240000, lastMonth: 1980000 },
    { label: 'Dom', thisMonth: 1950000, lastMonth: 1720000 },
  ],
  topProducts: [
    { id: 'p07', name: 'Coca-Cola Zero', sold: 421 },
    { id: 'p01', name: 'Pastrami Bros', sold: 312 },
    { id: 'p02', name: 'Cubano', sold: 268 },
    { id: 'p08', name: 'Limonada de coco', sold: 233 },
    { id: 'p03', name: 'Reuben Brisket', sold: 201 },
    { id: 'p09', name: 'Cerveza Club Colombia', sold: 189 },
  ],
  zoneAnalysis: [
    { zone: 'poblado', zoneName: 'El Poblado', orders: 168, revenue: 6240000, avgTicket: 37100, deliveryCost: 756000 },
    { zone: 'laureles', zoneName: 'Laureles', orders: 142, revenue: 5380000, avgTicket: 37900, deliveryCost: 710000 },
    { zone: 'envigado', zoneName: 'Envigado', orders: 96, revenue: 3720000, avgTicket: 38750, deliveryCost: 528000 },
    { zone: 'fatima', zoneName: 'Fátima', orders: 54, revenue: 2010000, avgTicket: 37200, deliveryCost: 324000 },
  ],
  heatmap: HOURLY_HEATMAP,
  conversion: { openChats: 540, closedOrders: 388, nonConverted: 152, rate: 72 },
};
