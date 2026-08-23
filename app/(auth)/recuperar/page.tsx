'use client';

import Link from 'next/link';
import { useState } from 'react';
import { requestPasswordReset } from '@/lib/api';

/**
 * Pedir el correo de recuperación.
 *
 * Antes esta pantalla no existía: el login decía "Pídele al admin que la
 * reestablezca". Con registro autoservicio no hay a quién pedírselo.
 *
 * El mensaje de éxito es deliberadamente ambiguo ("si ese correo tiene cuenta")
 * porque el backend tampoco confirma si existe: revelarlo permitiría averiguar
 * qué correos están registrados probando uno por uno.
 */
export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEstado('enviando');
    try {
      await requestPasswordReset(email.trim());
      setEstado('listo');
    } catch (err) {
      setEstado('idle');
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo');
    }
  };

  if (estado === 'listo') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div>
            <div className="login-brand">
              Skip<span className="green">fee</span>
            </div>
            <div className="login-sub">Revisa tu correo</div>
          </div>
          <p className="auth-note">
            Si <b>{email}</b> tiene una cuenta, le llegó un enlace para crear una contraseña
            nueva. Revisa también el spam.
          </p>
          <Link href="/login" className="btn btn-ghost">
            Volver a iniciar sesión
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
          <div className="login-sub">Recuperar contraseña</div>
        </div>

        <p className="auth-note">
          Escribe tu correo y te mandamos un enlace para crear una contraseña nueva.
        </p>

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
            disabled={estado === 'enviando'}
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={estado === 'enviando' || !email}>
          {estado === 'enviando' ? 'Enviando…' : 'Mandarme el enlace'}
        </button>

        <div className="login-hint">
          <Link href="/login">Volver a iniciar sesión</Link>
        </div>
      </form>
    </div>
  );
}
