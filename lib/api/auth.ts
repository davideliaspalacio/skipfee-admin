import { ApiError, request, setStoredToken } from './client';

export interface AuthUser {
  id: string;
  email: string;
  role?: string | null;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser }> {
  const res = await request<{
    ok: true;
    user: AuthUser;
    session?: { accessToken: string; refreshToken: string; expiresAt?: number };
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.session?.accessToken) {
    setStoredToken(res.session.accessToken);
  }
  return { user: res.user };
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function me(): Promise<AuthUser | null> {
  try {
    const { user } = await request<{ ok: true; user: AuthUser }>('/api/auth/me');
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setStoredToken(null);
      return null;
    }
    throw err;
  }
}
