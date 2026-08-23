/**
 * Capa de queries (React Query).
 *
 * Las pantallas consumen estos hooks; nunca hablan directamente con `lib/api/`.
 * Si necesitas un nuevo recurso: agrega su API en `lib/api/<resource>.ts`,
 * crea su archivo de queries aquí y reexpórtalo abajo.
 */

export * from './keys';
export * from './auth';
export * from './company';
export * from './platform';
export * from './payments';
export * from './orders';
export * from './chats';
export * from './products';
export * from './zones';
export * from './cooks';
export * from './tables';
export * from './waiters';
export * from './tabs';
export * from './settings';
export * from './botMessages';
export * from './dashboard';
export * from './channels';
export * from './reports';
export * from './customers';
export * from './promotions';
export * from './rewards';
export * from './surveys';

export {
  useWhatsAppProvider,
  useWhatsAppSession,
  useUpdateWhatsAppProvider,
  useConnectWhatsAppSession,
  useLogoutWhatsAppSession,
} from './whatsapp';

export { useOnboarding, useExtraerCarta, useImportarCarta } from './onboarding';
