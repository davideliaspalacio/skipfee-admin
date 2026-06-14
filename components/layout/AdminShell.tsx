'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { NAV, MOB_NAV, SCREEN_PATHS, SCREEN_TITLES, type ScreenId } from '@/lib/nav';
import { useActiveScreen, useScreenNav, useDarkMode } from '@/lib/hooks';
import { normalizeRole, visibleScreenIds } from '@/lib/roles';
import { useLogout } from '@/lib/queries';
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

  const role = normalizeRole(user.role);
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
    <div className="shell">
      {/* Rail vertical (desktop) */}
      <aside className="rail">
        <div className="rail-brand" aria-label="Skipfee">S</div>
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
                <span className="tip">{item.label}</span>
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
            <button type="button" className="iconbtn hide-mob" onClick={() => setDark(!dark)} aria-label={dark ? 'Tema claro' : 'Tema oscuro'}>
              <ThemeIcon dark={dark} />
            </button>
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
