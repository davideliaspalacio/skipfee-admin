'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { redeemPass } from '@/lib/api';
import { authKeys } from '@/lib/queries';

/**
 * Entrada con pase de un solo uso.
 *
 * Es la última pantalla del registro de la landing, aunque viva en el panel: el
 * dueño acaba de crear su cuenta y llega con un pase en la URL en vez de con
 * una contraseña que escribir. Se canjea y se le manda directo a Primeros
 * pasos, que es lo que de verdad tiene que hacer ahora.
 *
 * Si el pase falla —ya usado, vencido, alguien recargó la pestaña— no se
 * muestra un error críptico: se dice qué pasó y se ofrece el login normal. Un
 * atajo roto no puede convertirse en una puerta cerrada.
 */
export function Entrar() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const yaCanjeado = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const pase = params.get('t');

  useEffect(() => {
    if (!pase) {
      setError('Falta el pase de entrada.');
      return;
    }
    // Un pase muere al primer uso: en dev, el doble montaje de React lo
    // quemaría en el primer intento y el segundo mostraría un error falso.
    if (yaCanjeado.current) return;
    yaCanjeado.current = true;

    redeemPass(pase)
      .then(async () => {
        // La URL lleva el pase: se limpia del historial antes de seguir.
        window.history.replaceState(null, '', '/entrar');
        await qc.invalidateQueries({ queryKey: authKeys.me() });
        router.replace('/primeros-pasos');
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'No pudimos abrir tu sesión.');
      });
  }, [pase, qc, router]);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          Skip<span className="green">fee</span>
        </div>

        {error ? (
          <>
            <p className="login-sub">{error}</p>
            <Link className="btn btn-primary" href="/login">
              Entrar con mi correo
            </Link>
          </>
        ) : (
          <>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p className="login-sub">Abriendo tu panel…</p>
          </>
        )}
      </div>
    </div>
  );
}
