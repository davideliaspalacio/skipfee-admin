/**
 * Fábrica central de query keys.
 *
 * Cada recurso expone un objeto con métodos que devuelven keys jerárquicas.
 * Esto permite invalidaciones precisas:
 *
 *   qc.invalidateQueries({ queryKey: orderKeys.all })        // todo lo de orders
 *   qc.invalidateQueries({ queryKey: orderKeys.lists() })    // sólo listas
 *   qc.invalidateQueries({ queryKey: orderKeys.detail(id) }) // un pedido específico
 *
 * Reglas: nunca duplicar literales `['orders']` en archivos sueltos — siempre
 * a través de estas funciones.
 */

import type { OrdersFilter } from '../api/orders';
import type { ChatsFilter } from '../api/chats';
import type { CustomersFilter } from '../api/customers';
import type { ReportPeriod } from '../api/reports';
import { getActiveCompanySlug } from '../api';

/**
 * Prefijo de empresa para las keys de negocio. Incluir el slug activo aísla el
 * caché de React Query por empresa: al cambiar de empresa, las queries de
 * negocio cuelgan de otra rama y no se mezclan datos. Las keys de plataforma
 * (`authKeys`) NO llevan prefijo.
 *
 * Se lee con una función (no constante) porque las keys se construyen en cada
 * render: así reflejan siempre la empresa activa actual.
 */
function companyScope(): readonly [string, string] {
  return ['company', getActiveCompanySlug() ?? '__none__'] as const;
}

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

/**
 * Keys de plataforma (owner). NO llevan prefijo de empresa: son recursos
 * transversales a todas las empresas (`/api/platform/*`).
 */
export const platformKeys = {
  all: ['platform'] as const,
  companies: () => [...platformKeys.all, 'companies'] as const,
};

export const orderKeys = {
  get all() {
    return [...companyScope(), 'orders'] as const;
  },
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filter: OrdersFilter) => [...orderKeys.lists(), filter] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
};

export const chatKeys = {
  get all() {
    return [...companyScope(), 'chats'] as const;
  },
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filter: ChatsFilter) => [...chatKeys.lists(), filter] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
  stats: () => [...chatKeys.all, 'stats'] as const,
};

export const productKeys = {
  get all() {
    return [...companyScope(), 'products'] as const;
  },
  list: () => [...productKeys.all, 'list'] as const,
};

export const zoneKeys = {
  get all() {
    return [...companyScope(), 'zones'] as const;
  },
  list: (includeArchived = false) => [...zoneKeys.all, 'list', includeArchived] as const,
};

export const cookKeys = {
  get all() {
    return [...companyScope(), 'cooks'] as const;
  },
  list: (includeArchived = false) => [...cookKeys.all, 'list', includeArchived] as const,
};

export const settingsKeys = {
  get all() {
    return [...companyScope(), 'settings'] as const;
  },
  current: () => [...settingsKeys.all, 'current'] as const,
};

export const botMessageKeys = {
  get all() {
    return [...companyScope(), 'botMessages'] as const;
  },
  list: () => [...botMessageKeys.all, 'list'] as const,
};

export const dashboardKeys = {
  get all() {
    return [...companyScope(), 'dashboard'] as const;
  },
  today: () => [...dashboardKeys.all, 'today'] as const,
};

export const reportKeys = {
  get all() {
    return [...companyScope(), 'reports'] as const;
  },
  summary: (period: ReportPeriod) => [...reportKeys.all, 'summary', period] as const,
};

export const customerKeys = {
  get all() {
    return [...companyScope(), 'customers'] as const;
  },
  list: (filter: CustomersFilter) => [...customerKeys.all, 'list', filter] as const,
};

export const promotionKeys = {
  get all() {
    return [...companyScope(), 'promotions'] as const;
  },
  list: (includeArchived = false) => [...promotionKeys.all, 'list', includeArchived] as const,
  active: () => [...promotionKeys.all, 'active'] as const,
};

export const rewardKeys = {
  get all() {
    return [...companyScope(), 'rewards'] as const;
  },
  list: (status: string) => [...rewardKeys.all, 'list', status] as const,
};

export const surveyKeys = {
  get all() {
    return [...companyScope(), 'surveys'] as const;
  },
  list: (days: number) => [...surveyKeys.all, 'list', days] as const,
};
