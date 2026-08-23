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

export { login, logout, redeemPass, me, requestPasswordReset, resetPassword } from './auth';
export type { AuthUser, Membership, MembershipRole, MeResult } from './auth';

export {
  listCompanies,
  createCompany,
  updateCompany,
  fetchPlatformSettings,
  patchPlatformSettings,
} from './platform';
export type {
  Company,
  CompanyStatus,
  CompanyPlan,
  CreateCompanyBody,
  CreateCompanyResult,
  PlatformSettings,
  UpdateCompanyBody,
} from './platform';

export { fetchPayments, updatePayments } from './payments';
export type { PaymentEnv, PaymentMode, PaymentsConfig, UpdatePaymentsBody } from './payments';

export { fetchOrders, fetchOrder, fetchOrdersStats, patchOrderStatus, patchOrderCook } from './orders';
export type { OrdersFilter, OrdersStats } from './orders';

export { fetchChannels, updateChannelAction, simulateChannelOrder } from './channels';
export type {
  ChannelAction,
  ChannelKind,
  ChannelMode,
  ChannelProvider,
  ChannelRequirement,
  ChannelStatus,
  ChannelsOverview,
  ChannelsSummary,
  SalesChannel,
} from './channels';

export {
  fetchChats,
  fetchChatByPhone,
  fetchChatsStats,
  fetchChatMessages,
  chatTakeover,
  chatRelease,
  markChatRead,
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

export { fetchTables, createTable, patchTable, deleteTable } from './tables';
export type { DiningTable, CreateTableBody, PatchTableBody } from './tables';

export { fetchWaiters, createWaiter, patchWaiter, deleteWaiter } from './waiters';
export type { Waiter, CreateWaiterBody, PatchWaiterBody } from './waiters';

export {
  fetchOpenTabs,
  fetchTab,
  openTableTab,
  addTabItems,
  sendTabKitchen,
  patchTab,
  fetchTabSplit,
  payTabCash,
} from './tabs';
export type { Tab, TabItem, TabItemInput, PatchTabBody, SplitView, SplitShare, PayCashBody } from './tabs';

export { fetchSettings, patchSettings, uploadLogo } from './settings';
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

export {
  fetchWhatsAppProvider,
  updateWhatsAppProvider,
  fetchWhatsAppSession,
  connectWhatsAppSession,
  logoutWhatsAppSession,
  qrToDataUrl,
} from './whatsapp';
export type {
  WhatsAppProviderKind,
  WhatsAppProviderConfig,
  WhatsAppSession,
  WhatsAppSessionResult,
  SessionStatus,
  UpdateProviderBody,
} from './whatsapp';

export { fetchOnboarding, extraerCarta, importarCarta } from './onboarding';
export type {
  EstadoOnboarding,
  PasoOnboarding,
  CartaExtraida,
  ProductoExtraido,
  ProductoAImportar,
} from './onboarding';
