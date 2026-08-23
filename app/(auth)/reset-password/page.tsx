'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/api';

/**
 * Crear la contraseña nueva.
 *
 * A esta pantalla se llega desde el enlace del correo. Supabase devuelve los
 * tokens en el FRAGMENTO de la URL (`#access_token=…&type=recovery`), no en el
 * query string: el fragmento nunca viaja al servidor, que es justamente lo que
 * lo hace seguro. Como el panel es export estático, se lee en el cliente.
 *
 * El token del correo ES la autorización — no hace falta sesión previa.
 */
function ResetPasswordInner() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tokenLeido, setTokenLeido] = useState(false);
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    setToken(params.get('access_token'));
    setTokenLeido(true);
    // Limpiar el fragmento: que el token no quede en el historial ni se copie
    // sin querer al compartir la URL.
    if (params.get('access_token')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== repetir) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('El enlace no es válido. Pide uno nuevo.');
      return;
    }

    setEstado('enviando');
    try {
      await resetPassword(token, password);
      setEstado('listo');
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      setEstado('idle');
      setError(err instanceof Error ? err.message : 'El enlace venció o ya se usó. Pide uno nuevo.');
    }
  };

  // Enlace inválido o vencido: se dice claro y se ofrece la salida.
  if (tokenLeido && !token) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div>
            <div className="login-brand">
              Skip<span className="green">fee</span>
            </div>
            <div className="login-sub">Enlace no válido</div>
          </div>
          <p className="auth-note">
            Este enlace venció o ya se usó. Los enlaces de recuperación sirven una sola vez.
          </p>
          <Link href="/recuperar" className="btn btn-primary">
            Pedir uno nuevo
          </Link>
        </div>
      </div>
    );
  }

  if (estado === 'listo') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div>
            <div className="login-brand">
              Skip<span className="green">fee</span>
            </div>
            <div className="login-sub">Contraseña actualizada</div>
          </div>
          <p className="auth-note">Ya puedes entrar con tu contraseña nueva. Te llevamos al login…</p>
          <Link href="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <form onSubmit={submit} className="login-card">
        <div>
          <div className="login-brand">
            Skip<span className="green">fee</span>
          </div>
          <div className="login-sub">Crea tu contraseña nueva</div>
        </div>

        <div className="field">
          <label htmlFor="password" className="fl">Contraseña nueva</label>
          <input
            id="password"
            className="input"
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={estado === 'enviando'}
          />
        </div>

        <div className="field">
          <label htmlFor="repetir" className="fl">Repítela</label>
          <input
            id="repetir"
            className="input"
            type={ver ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            required
            disabled={estado === 'enviando'}
          />
        </div>

        <label className="auth-check">
          <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} />
          Ver lo que escribo
        </label>

        {error && <div className="login-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={estado === 'enviando' || password.length < 8 || repetir.length < 8}
        >
          {estado === 'enviando' ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  // El export estático de Next 16 exige límite de Suspense donde se leen
  // parámetros de navegación.
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
