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

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filter: OrdersFilter) => [...orderKeys.lists(), filter] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
};

export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (filter: ChatsFilter) => [...chatKeys.lists(), filter] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
  stats: () => [...chatKeys.all, 'stats'] as const,
};

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
};

export const zoneKeys = {
  all: ['zones'] as const,
  list: (includeArchived = false) => [...zoneKeys.all, 'list', includeArchived] as const,
};

export const cookKeys = {
  all: ['cooks'] as const,
  list: (includeArchived = false) => [...cookKeys.all, 'list', includeArchived] as const,
};

export const settingsKeys = {
  all: ['settings'] as const,
  current: () => [...settingsKeys.all, 'current'] as const,
};

export const botMessageKeys = {
  all: ['botMessages'] as const,
  list: () => [...botMessageKeys.all, 'list'] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  today: () => [...dashboardKeys.all, 'today'] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  summary: (period: ReportPeriod) => [...reportKeys.all, 'summary', period] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  list: (filter: CustomersFilter) => [...customerKeys.all, 'list', filter] as const,
};

export const promotionKeys = {
  all: ['promotions'] as const,
  list: (includeArchived = false) => [...promotionKeys.all, 'list', includeArchived] as const,
  active: () => [...promotionKeys.all, 'active'] as const,
};

export const rewardKeys = {
  all: ['rewards'] as const,
  list: (status: string) => [...rewardKeys.all, 'list', status] as const,
};

export const surveyKeys = {
  all: ['surveys'] as const,
  list: (days: number) => [...surveyKeys.all, 'list', days] as const,
};
