'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { NAV, MOB_NAV, SCREEN_PATHS, SCREEN_TITLES, type ScreenId } from '@/lib/nav';
import { useActiveScreen, useScreenNav, useDarkMode } from '@/lib/hooks';
import { visibleScreenIds } from '@/lib/roles';
import {
  useActiveRole,
  useActiveMembership,
  useLogout,
  useMe,
  useActiveCompany,
  setActiveCompany,
} from '@/lib/queries';
import { useOnboarding } from '@/lib/queries/onboarding';
import { RecorridoPanel } from '@/components/features/onboarding/RecorridoPanel';
import { AvisoPrueba } from './AvisoPrueba';
import { AvisoWhatsApp } from './AvisoWhatsApp';
import type { AuthUser } from '@/lib/api';

function initialsOf(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

/**
 * Shell del admin: rail (desktop) + topbar + nav inferior (mobile) + contenido.
 * Filtra navegación por rol, marca la screen activa por URL, atajos de teclado,
 * toggle de tema y logout. Reemplaza al App.tsx / DesktopLayout / MobileLayout del Vite app.
 */
export function AdminShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const router = useRouter();
  const active = useActiveScreen();
  const goScreen = useScreenNav();
  const [dark, setDark] = useDarkMode();
  const logout = useLogout();

  const role = useActiveRole();
  const membresia = useActiveMembership();
  const allowed = useMemo(() => new Set<ScreenId>(visibleScreenIds(role)), [role]);

  // "Primeros pasos" desaparece del rail cuando ya no queda nada por hacer —no
  // cuando llega el primer pedido: un negocio puede vender por WhatsApp sin
  // haber conectado su número, y ahí el recorrido todavía sirve. Se filtra solo
  // de la navegación, no de `allowed`: quien esté parado en la pantalla justo
  // cuando se completa no debe salir expulsado de ella.
  const { data: onboarding } = useOnboarding();
  const arrancado = onboarding ? onboarding.completados >= onboarding.total : false;

  // Mientras el negocio no pueda vender, el panel entero está bajo llave menos
  // Primeros pasos. Es deliberado: un tablero de pedidos vacío, un catálogo sin
  // productos y unos reportes en cero no le enseñan nada a quien acaba de
  // entrar — le enseñan que la plataforma no hace nada. Mejor un solo camino,
  // corto y claro, y que todo lo demás aparezca cuando ya tenga sentido.
  //
  // Solo aplica a quien puede resolverlo (dueño/admin). Cocina y empaque no
  // configuran nada: encerrarlos sería castigarlos por algo ajeno. El owner de
  // plataforma tampoco: entra a arreglar empresas de otros.
  const puedeConfigurar = role === 'super_admin' || role === 'admin';
  // El candado mira la HISTORIA, no el instante: a un negocio que ya estuvo
  // operativo y al que se le cayó WhatsApp no se le cierra el panel ni se le
  // repite el onboarding. Un canal caído no es un negocio sin montar — para eso
  // está la franja de arriba.
  const yaOperó = !!membresia?.operativoDesde;
  const bajoLlave = puedeConfigurar && onboarding ? !onboarding.puedeVender && !yaOperó : false;
  const pendientes = onboarding ? onboarding.total - onboarding.completados : 0;

  // El recorrido por el panel arranca justo cuando se cae el candado. Las
  // condiciones dicen "recién abierto", no "puede vender":
  //   · `puedeConfigurar`: solo a quien vivió el panel cerrado le sorprende que
  //     se abra. Cocina y empaque nunca vieron candados.
  //   · `!onboarding.activo`: sin un solo pedido todavía. Un negocio veterano
  //     que entra desde otro navegador —donde no está la marca de localStorage—
  //     no necesita que le presenten el tablero en el que trabaja hace meses.
  //   · fuera de Primeros pasos: ahí puede seguir abierto el modal de cierre
  //     del onboarding, y dos modales encimados no explican nada.
  const recorridoListo =
    puedeConfigurar &&
    !bajoLlave &&
    !!onboarding &&
    onboarding.puedeVender &&
    !onboarding.activo &&
    active !== 'primerosPasos';

  const navItems = useMemo(
    () =>
      NAV.filter((n) => allowed.has(n.id) && !(n.id === 'primerosPasos' && arrancado)).map((n) =>
        n.id === 'primerosPasos' && pendientes > 0 ? { ...n, badge: String(pendientes) } : n,
      ),
    [allowed, arrancado, pendientes],
  );
  // En mobile la barra inferior es la única navegación: si "Primeros pasos" no
  // entra ahí, el dueño que configura desde el celular no lo encuentra nunca.
  const mobItems = useMemo(() => {
    const base = MOB_NAV.filter((id) => allowed.has(id));
    return !arrancado && allowed.has('primerosPasos')
      ? (['primerosPasos', ...base] as ScreenId[])
      : base;
  }, [allowed, arrancado]);

  // Guard: si la screen activa no está permitida para el rol, vuelve a pedidos.
  useEffect(() => {
    if (!allowed.has(active)) router.replace(SCREEN_PATHS.pedidos);
  }, [active, allowed, router]);

  // Guard del recorrido: entrar por URL a una pantalla bajo llave devuelve a
  // Primeros pasos. Sin esto el candado del rail sería decorativo.
  useEffect(() => {
    if (bajoLlave && active !== 'primerosPasos') router.replace(SCREEN_PATHS.primerosPasos);
  }, [bajoLlave, active, router]);

  // Atajos de teclado (P/W/M/C/D/L/R/,) — saltan entre screens permitidas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const item = NAV.find((n) => n.shortcut.toLowerCase() === k);
      if (item && allowed.has(item.id) && !(bajoLlave && item.id !== 'primerosPasos')) {
        e.preventDefault();
        goScreen(item.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allowed, goScreen, bajoLlave]);

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => router.replace('/login') });
  };

  const title = SCREEN_TITLES[active];

  return (
    <div className="shell">
      {/* Rail vertical (desktop) */}
      <aside className="rail">
        <div className="rail-brand" aria-label="Skipfee">S</div>
        <nav className="rail-nav" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Ico = Icon[item.icon];
            const isActive = active === item.id;
            const locked = bajoLlave && item.id !== 'primerosPasos';
            return (
              <button
                key={item.id}
                type="button"
                className={`rail-item${isActive ? ' is-active' : ''}${locked ? ' is-locked' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={locked ? `${item.label} — se abre al terminar los primeros pasos` : item.label}
                onClick={() => goScreen(locked ? 'primerosPasos' : item.id)}
              >
                {Ico ? <Ico size={21} /> : null}
                {item.badge ? <span className="rail-badge">{item.badge}</span> : null}
                {locked ? (
                  <span className="rail-lock" aria-hidden="true">
                    <Icon.Lock size={11} />
                  </span>
                ) : null}
                <span className="tip">
                  {locked ? `${item.label} · al terminar` : item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">
          <button type="button" className="iconbtn" onClick={() => setDark(!dark)} aria-label={dark ? 'Tema claro' : 'Tema oscuro'}>
            <ThemeIcon dark={dark} />
          </button>
          <button type="button" className="iconbtn" onClick={handleLogout} aria-label="Cerrar sesión">
            <Icon.LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-title">
            <b>{title.title}</b>
            <span>{title.sub}</span>
          </div>
          <div className="topbar-actions">
            <CompanySwitcher />
            <button type="button" className="iconbtn hide-mob" onClick={() => setDark(!dark)} aria-label={dark ? 'Tema claro' : 'Tema oscuro'}>
              <ThemeIcon dark={dark} />
            </button>
            <span className="user-chip" title={`${user.email} · ${role}`}>
              {initialsOf(user.email)}
            </span>
            <button type="button" className="iconbtn hide-mob" onClick={handleLogout} aria-label="Cerrar sesión">
              <Icon.LogOut size={19} />
            </button>
          </div>
        </header>

        <AvisoWhatsApp />
        <AvisoPrueba />

        <main className="content">{children}</main>
      </div>

      {/* Vive en el shell, no dentro de una screen: el recorrido lleva al dueño
          de pantalla en pantalla, y montado en una screen moriría en la
          primera navegación. */}
      <RecorridoPanel puedeArrancar={recorridoListo} pantallas={allowed} />

      {/* Nav inferior (mobile) */}
      <nav className="mobnav" aria-label="Navegación">
        {mobItems.map((id) => {
          const item = NAV.find((n) => n.id === id)!;
          const Ico = Icon[item.icon];
          const isActive = active === id;
          const locked = bajoLlave && id !== 'primerosPasos';
          return (
            <button
              key={id}
              type="button"
              className={`mobnav-item${isActive ? ' is-active' : ''}${locked ? ' is-locked' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => goScreen(locked ? 'primerosPasos' : id)}
            >
              {Ico ? <Ico size={20} /> : null}
              {item.shortLabel ?? item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Selector de empresa activa en la topbar (multi-tenant).
 *
 * - Con varias empresas (owner de la plataforma): `<select>` cuyo value es el
 *   `companyCode` (identificador de ruta) y su label el `companyName`. Al cambiar
 *   llama `setActiveCompany(String(code))` — las query keys de negocio incluyen
 *   el code, así React Query recarga el caché de la nueva empresa sin mezclar.
 * - Con una sola empresa: etiqueta no editable con su nombre.
 * - Sin empresa (aún cargando): no renderiza nada.
 */
function CompanySwitcher() {
  const me = useMe();
  const active = useActiveCompany();
  const memberships = me.data?.memberships ?? [];

  if (memberships.length === 0) return null;

  // Con una sola empresa no hay nada que elegir: es una etiqueta, no un control.
  if (memberships.length === 1) {
    return (
      <span className="company-fixed hide-mob" aria-label="Empresa activa">
        {memberships[0].companyName}
      </span>
    );
  }

  return (
    <select
      className="company-pick hide-mob"
      value={active ?? ''}
      onChange={(e) => setActiveCompany(e.target.value)}
      aria-label="Empresa activa"
    >
      {memberships.map((m) => (
        <option key={m.companyCode} value={String(m.companyCode)}>
          {m.companyName}
        </option>
      ))}
    </select>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
