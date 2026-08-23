'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveMembership, useMe } from '@/lib/queries';
import { AdminShell } from '@/components/layout/AdminShell';
import { CuentaSuspendida } from '@/components/layout/CuentaSuspendida';

/**
 * Gate de autenticación de todo el admin. Bootstrap vía useMe() (GET /api/auth/me
 * con el Bearer token guardado). Cargando → loader; sin sesión → /login; empresa
 * suspendida → explicación; con sesión → AdminShell + la screen.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const membership = useActiveMembership();
  const router = useRouter();

  useEffect(() => {
    if (!me.isLoading && !me.data) router.replace('/login');
  }, [me.isLoading, me.data, router]);

  if (me.isLoading) {
    return (
      <div className="fs-loader">
        <div className="spinner" />
        Cargando…
      </div>
    );
  }

  if (!me.data) {
    return (
      <div className="fs-loader">
        <div className="spinner" />
        Redirigiendo…
      </div>
    );
  }

  // Dos cortes distintos, misma pantalla:
  //   - `suspended`: la palanca manual del owner. Apaga todo, panel y venta.
  //   - prueba vencida: se cierra el panel, pero el bot sigue atendiendo y la
  //     tienda sigue cobrando. La pantalla lo dice explícitamente — el dueño
  //     tiene que saber que sus clientes no se quedaron sin poder pedir.
  // El owner de la plataforma pasa siempre: necesita poder arreglar la empresa.
  const pruebaVencida =
    membership?.plan === 'trial' &&
    membership.diasRestantes !== null &&
    membership.diasRestantes !== undefined &&
    membership.diasRestantes <= 0;

  if (
    membership &&
    membership.role !== 'platform' &&
    (membership.status === 'suspended' || pruebaVencida)
  ) {
    return (
      <CuentaSuspendida
        membership={membership}
        motivo={pruebaVencida ? 'prueba' : 'suspension'}
      />
    );
  }

  return <AdminShell user={me.data.user}>{children}</AdminShell>;
}
