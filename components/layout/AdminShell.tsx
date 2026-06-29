'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { NAV, MOB_NAV, SCREEN_PATHS, SCREEN_TITLES, type ScreenId } from '@/lib/nav';
import { useActiveScreen, useScreenNav, useRailCollapsed } from '@/lib/hooks';
import { visibleScreenIds } from '@/lib/roles';
import { useActiveRole, useLogout, useMe, useActiveCompany, setActiveCompany } from '@/lib/queries';
import type { AuthUser } from '@/lib/api';

function initialsOf(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

/**
 * Shell del admin: rail (desktop) + topbar + nav inferior (mobile) + contenido.
 * Filtra navegación por rol, marca la screen activa por URL, atajos de teclado,
 * colapso del rail y logout. Reemplaza al App.tsx / DesktopLayout / MobileLayout del Vite app.
 */
export function AdminShell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const router = useRouter();
  const active = useActiveScreen();
  const goScreen = useScreenNav();
  const [railCollapsed, setRailCollapsed] = useRailCollapsed();
  const logout = useLogout();

  const role = useActiveRole();
  const allowed = useMemo(() => new Set<ScreenId>(visibleScreenIds(role)), [role]);

  const navItems = useMemo(() => NAV.filter((n) => allowed.has(n.id)), [allowed]);
  const mobItems = useMemo(() => MOB_NAV.filter((id) => allowed.has(id)), [allowed]);

  // Guard: si la screen activa no está permitida para el rol, vuelve a pedidos.
  useEffect(() => {
    if (!allowed.has(active)) router.replace(SCREEN_PATHS.pedidos);
  }, [active, allowed, router]);

  // Atajos de teclado (P/W/M/C/D/L/R/,) — saltan entre screens permitidas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      const item = NAV.find((n) => n.shortcut.toLowerCase() === k);
      if (item && allowed.has(item.id)) {
        e.preventDefault();
        goScreen(item.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allowed, goScreen]);

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => router.replace('/login') });
  };

  const title = SCREEN_TITLES[active];

  return (
    <div className={`shell${railCollapsed ? ' is-rail-collapsed' : ''}`}>
      {/* Rail vertical (desktop) */}
      <aside className="rail">
        <div className="rail-head">
          <div className="rail-brand" aria-label="Skipfee">S</div>
          <div className="rail-brand-text" aria-hidden={railCollapsed}>
            <b>Skipfee</b>
            <span>Operación</span>
          </div>
          <button
            type="button"
            className="rail-toggle"
            onClick={() => setRailCollapsed(!railCollapsed)}
            aria-label={railCollapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'}
            aria-expanded={!railCollapsed}
            title={railCollapsed ? 'Expandir' : 'Plegar'}
          >
            {railCollapsed ? <Icon.Chevron size={18} /> : <Icon.ChevronLeft size={18} />}
          </button>
        </div>
        <nav className="rail-nav" aria-label="Navegación principal">
          {navItems.map((item) => {
            const Ico = Icon[item.icon];
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`rail-item${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => goScreen(item.id)}
              >
                {Ico ? <Ico size={21} /> : null}
                <span className="rail-label">{item.label}</span>
                <span className="tip">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="rail-foot">
          <button type="button" className="iconbtn rail-foot-action" onClick={handleLogout} aria-label="Cerrar sesión">
            <Icon.LogOut size={20} />
            <span className="rail-foot-label">Cerrar sesión</span>
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
            <div className="user-chip">
              <span className="av">{initialsOf(user.email)}</span>
              <span className="meta">
                <b>{user.email.split('@')[0]}</b>
                <small>{role}</small>
              </span>
            </div>
            <button type="button" className="iconbtn hide-mob" onClick={handleLogout} aria-label="Cerrar sesión">
              <Icon.LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      {/* Nav inferior (mobile) */}
      <nav className="mobnav" aria-label="Navegación">
        {mobItems.map((id) => {
          const item = NAV.find((n) => n.id === id)!;
          const Ico = Icon[item.icon];
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              className={`mobnav-item${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => goScreen(id)}
            >
              {Ico ? <Ico size={20} /> : null}
              {item.label}
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

  if (memberships.length === 1) {
    return (
      <span className="user-chip company-chip hide-mob" aria-label="Empresa activa">
        <span className="meta">
          <small>Empresa</small>
          <b>{memberships[0].companyName}</b>
        </span>
      </span>
    );
  }

  return (
    <select
      className="select company-select hide-mob"
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
