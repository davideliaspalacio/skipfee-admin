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
export type CompanyPlan = 'trial' | 'activo' | 'cortesia';

export interface Company {
  id: string;
  /** Código numérico de la empresa — identificador de ruta (`/api/<code>/…`). */
  code: number;
  slug: string;
  name: string;
  status: CompanyStatus;
  /** trial = en prueba · activo = pagando · cortesia = sin vencimiento. */
  plan: CompanyPlan;
  /** Cuándo quedó operativa. null = el reloj de la prueba aún no arrancó. */
  trial_started_at: string | null;
  trial_ends_at: string | null;
  /** Lo calcula el backend con SU reloj, no el navegador. */
  diasRestantes: number | null;
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
  /** Contraseña temporal para que el super_admin pueda entrar en el P0/demo. */
  superAdminPassword?: string;
}

export interface CreateCompanyResult {
  company: Company;
  superAdmin: {
    userId: string;
    email: string | null;
    temporaryPasswordSet: boolean;
    userAlreadyExisted: boolean;
  };
}

/**
 * Crea una empresa + su primer super_admin. Errores típicos: 409 (slug ya
 * existe), 400 (validación). Se propagan como `ApiError` desde `request`.
 */
export async function createCompany(body: CreateCompanyBody): Promise<CreateCompanyResult> {
  const res = await request<{ ok: true; company: Company; superAdmin: CreateCompanyResult['superAdmin'] }>(
    '/api/platform/companies',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
  return { company: res.company, superAdmin: res.superAdmin };
}

// =========================================================================
// Ficha de empresa y configuración de plataforma
// =========================================================================

export interface UpdateCompanyBody {
  status?: CompanyStatus;
  plan?: CompanyPlan;
  name?: string;
  /** Suma (o resta, con negativo) días al vencimiento de la prueba. */
  extenderDias?: number;
  /** Vuelve a arrancar la prueba hoy con los días configurados en plataforma. */
  reiniciarTrial?: boolean;
}

/** `codeOrSlug` acepta el código numérico (1007) o el slug. */
export async function updateCompany(
  codeOrSlug: string | number,
  body: UpdateCompanyBody,
): Promise<Company> {
  const { company } = await request<{ ok: true; company: Company }>(
    `/api/platform/companies/${encodeURIComponent(String(codeOrSlug))}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return company;
}

export interface PlatformSettings {
  /** Días de prueba de las empresas que arranquen de aquí en adelante. */
  trialDays: number;
  /** 'bloquear' suspende al vencer · 'avisar' solo reporta (modo de prueba). */
  alVencer: 'bloquear' | 'avisar';
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { settings } = await request<{ ok: true; settings: PlatformSettings }>(
    '/api/platform/settings',
  );
  return settings;
}

export async function patchPlatformSettings(
  body: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  const { settings } = await request<{ ok: true; settings: PlatformSettings }>(
    '/api/platform/settings',
    { method: 'PATCH', body: JSON.stringify(body) },
  );
  return settings;
}
