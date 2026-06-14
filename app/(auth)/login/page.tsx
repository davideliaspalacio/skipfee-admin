'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, useMe } from '@/lib/queries';

/**
 * Login del panel. Bloquea el acceso hasta autenticar. Una sola pantalla
 * (los admins se crean desde Supabase). Tras login → /pedidos. Si ya hay
 * sesión al montar, redirige sin tocar nada.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const meQuery = useMe();
  const loginMutation = useLogin();

  useEffect(() => {
    if (meQuery.data) router.replace('/pedidos');
  }, [meQuery.data, router]);

  const error = loginMutation.error
    ? loginMutation.error instanceof Error
      ? loginMutation.error.message
      : 'No se pudo iniciar sesión'
    : null;
  const loading = loginMutation.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password }, { onSuccess: () => router.replace('/pedidos') });
  };

  return (
    <div className="login-screen">
      <form onSubmit={submit} className="login-card">
        <div>
          <div className="login-brand">
            Skip<span className="green">fee</span>
          </div>
          <div className="login-sub">Panel administrativo</div>
        </div>

        <div className="field">
          <label htmlFor="email" className="fl">Correo</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="fl">Contraseña</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading || !email || !password}>
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        <div className="login-hint">¿Olvidaste tu contraseña? Pídele al admin que la reestablezca.</div>
      </form>
    </div>
  );
}
