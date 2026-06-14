'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@/lib/queries';
import { AdminShell } from '@/components/layout/AdminShell';

/**
 * Gate de autenticación de todo el admin. Bootstrap vía useMe() (GET /api/auth/me
 * con el Bearer token guardado). Cargando → loader; sin sesión → /login; con
 * sesión → AdminShell + la screen.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = useMe();
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

  return <AdminShell user={me.data}>{children}</AdminShell>;
}
