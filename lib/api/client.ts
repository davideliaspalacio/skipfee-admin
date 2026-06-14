/**
 * Cliente HTTP base.
 *
 * Capa de transporte: una sola responsabilidad — hablar con el backend Next.js.
 * No conoce React, ni React Query, ni el dominio. Devuelve objetos tipados o lanza
 * `ApiError` con el status y el body.
 *
 * URL base: `VITE_API_BASE_URL` (sin barra final). Si no está definida, usa
 * rutas relativas (útil cuando frontend y backend cuelgan del mismo dominio).
 * Compartida con el cliente del storefront (`lib/checkout.ts`) — una sola
 * variable para todo el frontend.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

const TOKEN_STORAGE_KEY = 'bs_access_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Cross-origin sin HTTPS: las cookies SameSite no son confiables. Mandamos
  // el access_token como Authorization si lo tenemos guardado.
  // credentials:include cubre el caso same-origin (proxy / prod).
  const token = getStoredToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && body.ok === false)) {
    const msg = body?.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

/**
 * Variante de `request` para subir archivos. NO setea Content-Type: el browser
 * lo arma con el boundary del multipart. Misma lógica de auth y errores.
 */
export async function requestMultipart<T>(path: string, form: FormData): Promise<T> {
  const token = getStoredToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeader },
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || (body && body.ok === false)) {
    const msg = body?.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}
