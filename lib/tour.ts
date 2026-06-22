import type { ScreenId } from './nav';

// Guion del recorrido guiado del demo (driver.js), multipágina y completo: recorre
// TODAS las áreas de la plataforma resaltando la feature más potente de cada una.
// `element` se resalta; sin `element` el popover sale centrado (modal). `section`
// alimenta la barra de progreso. Copy vendedor (es-CO) mapeado a selectores
// globales estables (admin.css/brand.css), ya que los componentes usan CSS modules.

export interface TourStep {
  screen: ScreenId;
  /** Selector global estable a resaltar en desktop. Vacío = popover central. */
  element?: string;
  /** Selector alternativo en móvil (si difiere). */
  elementMobile?: string;
  /** Etiqueta de sección para la barra de progreso. */
  section: string;
  title: string;
  /** Acepta HTML simple (<b>). */
  description: string;
  /** Solo se muestra si el plan tiene pantallas bloqueadas. */
  onlyIfLocked?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  // ── Apertura ────────────────────────────────────────────────────────────
  {
    screen: 'dashboard',
    section: 'Bienvenida',
    title: '👋 Bienvenido al demo de Skipfee',
    description:
      'Te voy a mostrar, paso a paso, cómo Skipfee opera tu restaurante de punta a punta: pedidos, cocina, WhatsApp, rutas y reportes. Todo con <b>datos de ejemplo</b> — nada de lo que veas afecta información real.',
  },
  {
    screen: 'dashboard',
    element: '.demo-banner',
    section: 'Modo demo',
    title: '🧪 Estás en una demostración',
    description:
      'Esta barra te recuerda que es un demo y con qué plan lo estás viendo. Tranquilo: yo te guío por todo el recorrido.',
  },
  {
    screen: 'dashboard',
    element: '.rail',
    elementMobile: '.mobnav',
    section: 'Navegación',
    title: '🧭 Tu centro de mando',
    description:
      'Desde aquí entras a cada área del negocio: pedidos, WhatsApp, despachos, catálogo, clientes, reportes y configuración. Te llevo por todas, una por una.',
  },

  // ── Dashboard ───────────────────────────────────────────────────────────
  {
    screen: 'dashboard',
    element: '.dtable',
    section: 'Dashboard',
    title: '🚨 Lo que requiere tu atención, primero',
    description:
      'El panel te muestra los pedidos que llevan <b>demasiado tiempo sin moverse</b> (ej. "41m empacado sin despachar"), con chip de urgencia y un clic para <b>abrir el pedido en el tablero</b>. No es un dashboard pasivo: es tu cola de acción del día.',
  },
  {
    screen: 'dashboard',
    element: '.panel',
    section: 'Dashboard',
    title: '📈 El pulso de hoy: ventas 7 días y mix en vivo',
    description:
      'Mira la <b>tendencia de ventas de los últimos 7 días</b> y el <b>mix de productos del día</b> en un donut, todo actualizándose solo. Sabes al instante qué se vende y hacia dónde va el negocio.',
  },

  // ── Pedidos ─────────────────────────────────────────────────────────────
  {
    screen: 'pedidos',
    element: '.input-search',
    section: 'Pedidos',
    title: '🔥 Tu cocina en vivo, sin comisiones',
    description:
      'Este es tu <b>tablero de pedidos en tiempo real</b>: cada tarjeta es una venta que entró por WhatsApp. <b>Arrástrala</b> entre columnas (Nuevo → En cocina → En ruta → Entregado) y el cliente se entera al instante. Busca aquí cualquier pedido por número, cliente o teléfono.',
  },
  {
    screen: 'pedidos',
    element: '.chip',
    section: 'Pedidos',
    title: '⏱️ Filtra por zona y caza los demorados',
    description:
      'Filtra el tablero por <b>zona de entrega</b> con un clic y detecta de un vistazo los pedidos <b>demorados</b> gracias a la alerta de tiempo en cada tarjeta, que además muestra el <b>cocinero asignado</b>. Cero pedidos perdidos.',
  },

  // ── WhatsApp ────────────────────────────────────────────────────────────
  {
    screen: 'whatsapp',
    element: '.input-search',
    section: 'WhatsApp',
    title: '🤖 Tu bot vende solo, tú entras cuando quieras',
    description:
      'Acá tienes <b>toda tu bandeja de WhatsApp en vivo</b>: el bot atiende y arma pedidos solo, y los filtros <b>Bot / Humano / Pend.</b> te muestran cuáles van solos y cuáles necesitan tu mano. Abre un chat y dale <b>Tomar conversación</b> para responder tú mismo.',
  },
  {
    screen: 'whatsapp',
    element: '.content',
    section: 'Post-venta',
    title: '🍰 Aprueba reseñas y regala postre sin salir del chat',
    description:
      'Cuando un cliente deja su reseña, te aparece el aviso <b>Reseña por verificar</b> dentro de la conversación. Revisa el pantallazo y dale <b>Aprobar postre</b> en un clic: fidelizas y premias <b>sin comisiones ni apps externas</b>.',
  },

  // ── Despachos ───────────────────────────────────────────────────────────
  {
    screen: 'despachos',
    element: '.stats',
    section: 'Despachos',
    title: '🗺️ Rutas optimizadas que te ahorran gasolina',
    description:
      'Skipfee agrupa tus pedidos empacados por zona y <b>reordena las paradas para recorrer menos kilómetros</b>. Aquí ves de un vistazo la distancia optimizada y el <b>ahorro estimado en gasolina</b>, en pesos.',
  },
  {
    screen: 'despachos',
    element: '.btn-primary',
    section: 'Despachos',
    title: '🛵 Despacha la ruta en un clic',
    description:
      'Con <b>Despachar ruta</b> mandas todos los pedidos de la zona a entregar de una sola vez y <b>avisamos a cada cliente por WhatsApp</b> que su pedido va en camino. Sin domiciliarios que registrar.',
  },

  // ── Catálogo ────────────────────────────────────────────────────────────
  {
    screen: 'catalogo',
    element: '.tablist',
    section: 'Catálogo',
    title: '🍔 Tu menú, ordenado por categoría',
    description:
      'Filtra el catálogo por <b>Sándwiches, Bebidas, Postres y Combos</b> con un clic. Cada pestaña te muestra esos platos en una vitrina visual con foto, precio y cuántos vendiste en la semana.',
  },
  {
    screen: 'catalogo',
    element: '.btn-primary',
    section: 'Catálogo',
    title: '➕ Crea y edita platos en segundos',
    description:
      'Agrega un producto con <b>foto, descripción y precio</b> desde aquí, y prende o agota cualquier plato al instante. Lo que cambias se refleja de una en el menú de WhatsApp de tus clientes.',
  },

  // ── Clientes ────────────────────────────────────────────────────────────
  {
    screen: 'clientes',
    element: '.stats',
    section: 'Clientes',
    title: '📊 Tu CRM lee la plata, no solo nombres',
    description:
      'De un vistazo: <b>cuántos clientes</b> tienes, qué <b>% son Recurrentes y VIP</b> y tu <b>ticket promedio</b>. Skipfee segmenta solo (Nuevo, Recurrente, VIP) para que sepas a quién consentir.',
  },
  {
    screen: 'clientes',
    element: '.dtable',
    section: 'Clientes',
    title: '👑 Directorio vivo: quién gasta y cuándo volvió',
    description:
      'Cada cliente con su <b>ticket promedio</b>, <b>última compra</b> ("Hoy", "Hace 3d") y su <b>etiqueta VIP/Recurrente</b>. Filtra por segmento o busca por nombre/teléfono y reactiva a los que no piden hace rato.',
  },

  // ── Reportes ────────────────────────────────────────────────────────────
  {
    screen: 'reportes',
    element: '.content',
    section: 'Reportes',
    title: '💰 Tu plata, sin comisiones de por medio',
    description:
      'Mira el <b>neto real</b> del período junto al bruto y el costo de domicilios, con la <b>variación vs. el período anterior</b>. Como Skipfee no cobra comisión, lo que ves entrar es lo que de verdad te queda.',
  },
  {
    screen: 'reportes',
    element: '.dtable',
    section: 'Reportes',
    title: '📍 Qué zona te deja más plata',
    description:
      'Compara <b>pedidos, ingresos, ticket promedio y costo de domicilio</b> barrio por barrio. Descubre dónde apretar el acelerador y dónde el domicilio se te está comiendo el margen.',
  },

  // ── Configuración ───────────────────────────────────────────────────────
  {
    screen: 'configuracion',
    element: '.tablist',
    section: 'Configuración',
    title: '⚙️ El cerebro de tu bot, en 8 pestañas',
    description:
      'Acá controlas <b>todo</b> sin tocar código: zonas con tarifa que el bot cobra solo, horarios, cocineros, <b>mensajes del bot editables</b>, promociones automáticas y reseñas. Cambias algo y el bot lo aplica al instante en WhatsApp.',
  },
  {
    screen: 'configuracion',
    element: '.content',
    section: 'Post-venta',
    title: '⭐ Pide reseña y regala postre, automático',
    description:
      'En <b>Reseñas</b> el bot pregunta del 1 al 5 tras entregar: con 4–5 invita a reseñar en Google y <b>regala un postre</b>; con 1–3 pasa el chat a un humano. Fidelizas y subes tu reputación sin mover un dedo.',
  },

  // ── Gating (solo si el plan bloquea algo) ───────────────────────────────
  {
    screen: 'configuracion',
    element: '.rail-item.is-locked',
    elementMobile: '.demo-banner',
    section: 'Planes',
    title: '🔓 Crece cuando quieras',
    description:
      'Las funciones que tu plan no incluye aparecen con un candado 🔒. Puedes activarlas subiendo de plan en cualquier momento — sin volver a empezar.',
    onlyIfLocked: true,
  },
];
