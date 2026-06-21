/**
 * Capa de transporte (API).
 *
 * Una función por endpoint. Sin React, sin estado. Las pantallas no importan
 * desde aquí — usan los hooks de `lib/queries/` que envuelven estos fetchers
 * con React Query.
 */

export { ApiError, getStoredToken, setStoredToken, request, tenantRequest } from './client';

export {
  getActiveCompanySlug,
  setActiveCompanySlug,
  subscribeActiveCompany,
} from './activeCompany';

export { login, logout, me } from './auth';
export type { AuthUser, Membership, MembershipRole, MeResult } from './auth';

export { listCompanies, createCompany } from './platform';
export type {
  Company,
  CompanyStatus,
  CreateCompanyBody,
  CreateCompanyResult,
} from './platform';

export { fetchOrders, fetchOrder, fetchOrdersStats, patchOrderStatus, patchOrderCook } from './orders';
export type { OrdersFilter, OrdersStats } from './orders';

export {
  fetchChats,
  fetchChatsStats,
  fetchChatMessages,
  chatTakeover,
  chatRelease,
  sendChatMessage,
  uploadChatImage,
} from './chats';
export type { ChatsFilter, ChatsStats } from './chats';

export {
  fetchProducts,
  patchProduct,
  createProduct,
  deleteProduct,
  uploadProductImage,
} from './products';
export type { CreateProductBody, PatchProductBody } from './products';

export { fetchZones, patchZone, createZone, deleteZone } from './zones';
export type { CreateZoneBody, PatchZoneBody } from './zones';

export { fetchCooks, createCook, patchCook, deleteCook } from './cooks';
export type { Cook, CreateCookBody, PatchCookBody } from './cooks';

export { fetchSettings, patchSettings } from './settings';
export type { Settings } from './settings';

export { fetchRewards, approveReward, rejectReward } from './rewards';
export type { Reward, RewardStatus } from './rewards';

export { fetchSurveys } from './surveys';
export type { Survey } from './surveys';

export { fetchBotMessages, patchBotMessage, resetBotMessage } from './botMessages';
export type {
  BotMessage,
  BotMessageContent,
  BotMessageKind,
  BotMessageCategory,
  BotButton,
  PatchBotMessageBody,
} from './botMessages';

export { fetchDashboard } from './dashboard';
export type { DashboardData } from './dashboard';

export { fetchReports } from './reports';
export type { ReportPeriod, ReportsData } from './reports';

export { fetchCustomers } from './customers';
export type { CustomersFilter } from './customers';

export {
  fetchPromotions,
  fetchActivePromotions,
  createPromotion,
  patchPromotion,
  deletePromotion,
} from './promotions';
export type {
  Promotion,
  ActivePromotion,
  PromotionKind,
  PromotionConfig,
  DiscountType,
  CreatePromotionBody,
  PatchPromotionBody,
} from './promotions';
