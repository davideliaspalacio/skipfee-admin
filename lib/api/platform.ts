/**
 * Capa de transporte — plataforma (owner).
 *
 * Rutas `/api/platform/*`: NO son de una empresa concreta, así que usan
 * `request` (sin prefijo `/api/<slug>`), no `tenantRequest`. Solo el owner de la
 * plataforma (rol `platform`, fila en `platform_admins`) puede consumirlas; el
 * backend responde 403 al resto.
 */

import { request } from './client';

export type CompanyStatus = 'active' | 'suspended';

export interface Company {
  id: string;
  /** Código numérico de la empresa — identificador de ruta (`/api/<code>/…`). */
  code: number;
  slug: string;
  name: string;
  status: CompanyStatus;
  next_order_number: number;
  created_at: string;
}

/** Lista todas las empresas de la plataforma (solo owner). */
export async function listCompanies(): Promise<Company[]> {
  const { companies } = await request<{ ok: true; companies: Company[] }>(
    '/api/platform/companies',
  );
  return companies;
}

export interface CreateCompanyBody {
  slug: string;
  name: string;
  /** Email del primer super_admin de la empresa (el backend lo crea/invita). */
  superAdminEmail: string;
}

export interface CreateCompanyResult {
  company: Company;
  superAdmin: { userId: string };
}

/**
 * Crea una empresa + su primer super_admin. Errores típicos: 409 (slug ya
 * existe), 400 (validación). Se propagan como `ApiError` desde `request`.
 */
export async function createCompany(body: CreateCompanyBody): Promise<CreateCompanyResult> {
  const res = await request<{ ok: true; company: Company; superAdmin: { userId: string } }>(
    '/api/platform/companies',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
  return { company: res.company, superAdmin: res.superAdmin };
}
