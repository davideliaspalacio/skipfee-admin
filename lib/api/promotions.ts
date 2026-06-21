import { tenantRequest } from './client';

/**
 * Cliente HTTP para promotions. Espejo del contrato del backend:
 * `kind` discrimina entre 'product' y 'weekday'; `config` es polimórfica.
 */

export type PromotionKind = 'product' | 'weekday';
export type DiscountType = 'percent' | 'fixed' | 'free_item' | 'two_for_one';

export interface PromotionConfig {
  product_ids?: string[];
  weekdays?: number[];     // 0=domingo, 6=sábado (JS getDay)
  starts_hhmm?: string;    // "HH:MM"
  ends_hhmm?: string;
}

export interface Promotion {
  id: string;
  kind: PromotionKind;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_subtotal: number;
  config: PromotionConfig;
  active: boolean;
  archived: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPromotions(includeArchived = false): Promise<Promotion[]> {
  const qs = includeArchived ? '?all=1' : '';
  const { promotions } = await tenantRequest<{ ok: true; promotions: Promotion[] }>(
    `/promotions${qs}`,
  );
  return promotions;
}

/**
 * Promo activa "ahora" (calendario + día/hora Bogotá) con productos
 * hidratados. La devuelve el endpoint público `/api/promotions/active`,
 * el mismo que consume el storefront. La usamos también en el banner
 * del Dashboard del panel admin.
 */
export interface ActivePromotion extends Promotion {
  products: Array<{
    id: string;
    name: string;
    price: number;
    cat: string;
    img: string | null;
    description: string | null;
    available: boolean;
  }>;
}

export async function fetchActivePromotions(): Promise<ActivePromotion[]> {
  const { promotions } = await tenantRequest<{ ok: true; promotions: ActivePromotion[] }>(
    '/promotions/active',
  );
  return promotions;
}

export interface CreatePromotionBody {
  kind: PromotionKind;
  name: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_subtotal?: number;
  config: PromotionConfig;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export async function createPromotion(body: CreatePromotionBody): Promise<Promotion> {
  const { promotion } = await tenantRequest<{ ok: true; promotion: Promotion }>('/promotions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return promotion;
}

/** PATCH parcial. `description: null` borra explícitamente. */
export interface PatchPromotionBody {
  kind?: PromotionKind;
  name?: string;
  description?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  min_subtotal?: number;
  config?: PromotionConfig;
  active?: boolean;
  archived?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export async function patchPromotion(id: string, body: PatchPromotionBody): Promise<Promotion> {
  const { promotion } = await tenantRequest<{ ok: true; promotion: Promotion }>(
    `/promotions/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return promotion;
}

/**
 * Archiva una promoción (soft-delete): backend marca archived=true + active=false
 * y devuelve la fila actualizada para refrescar la caché sin un GET extra.
 */
export async function deletePromotion(id: string): Promise<Promotion> {
  const { promotion } = await tenantRequest<{ ok: true; promotion: Promotion }>(
    `/promotions/${id}`,
    { method: 'DELETE' },
  );
  return promotion;
}
