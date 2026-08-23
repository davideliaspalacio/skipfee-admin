'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { NAV, MOB_NAV, SCREEN_TITLES, type ScreenId } from '@/lib/nav';
import { useRailCollapsed } from '@/lib/hooks';
import { useDemo } from '@/lib/demo';
import { isScreenUnlocked, minPlanFor, PLAN_NAMES } from '@/lib/plans';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { FeatureLocked } from '@/components/ui/FeatureLocked';
import { useTourActive } from '@/lib/tourActive';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skipfee.co').replace(/\/+$/, '');

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Pantalla activa a partir de /preview/<id> (null si no es una de las 8 del NAV). */
function screenFromPath(pathname: string): ScreenId | null {
  const seg = pathname.split('/')[2] ?? '';
  return NAV.find((n) => n.id === seg)?.id ?? null;
}

/**
 * Shell del "modo demo" del panel: reusa el chrome real (rail + topbar + mobnav)
 * pero sin auth, navegando entre /preview/*. Personaliza con el nombre del negocio
 * y aplica gating por plan: las pantallas no incluidas se ven con candado y, al
 * abrirlas, muestran el upsell (FeatureLocked) en vez del contenido.
 */
export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { negocio, plan } = useDemo();
  const [railCollapsed, setRailCollapsed] = useRailCollapsed();

  const active = screenFromPath(pathname);
  const tourActive = useTourActive();
  // Durante el recorrido mostramos las pantallas REALES aunque el plan las bloquee,
  // para que el tour pueda enseñar toda la plataforma (el rail sigue con sus candados).
  const locked = active != null && !isScreenUnlocked(plan, active) && !tourActive;
  const brandInitial = negocio.trim().charAt(0).toUpperCase() || 'S';
  const t = active ? SCREEN_TITLES[active] : { title: negocio, sub: 'Panel de demostración' };

  return (
    <div className={`shell${railCollapsed ? ' is-rail-collapsed' : ''}`}>
      {/* Rail vertical (desktop) */}
      <aside className="rail">
        <div className="rail-head">
          <div className="rail-brand" aria-label={negocio}>{brandInitial}</div>
          <div className="rail-brand-text" aria-hidden={railCollapsed}>
            <b>{negocio}</b>
            <span>Demo</span>
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
        <nav className="rail-nav" aria-label="Navegación del panel">
          {NAV.map((item) => {
            const Ico = Icon[item.icon];
            const isActive = active === item.id;
            const isLocked = !isScreenUnlocked(plan, item.id);
            return (
              <Link
                key={item.id}
                href={`/preview/${item.id}`}
                className={`rail-item${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {Ico ? <Ico size={21} /> : null}
                <span className="rail-label">{item.label}</span>
                {isLocked ? <span className="rail-lock" aria-hidden="true"><LockIcon /></span> : null}
                <span className="tip">{item.label}{isLocked ? ` · Plan ${PLAN_NAMES[minPlanFor(item.id)]}` : ''}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rail-foot">
          <a className="iconbtn rail-foot-action" href={SITE_URL} aria-label="Volver a skipfee.co" title="Volver a skipfee.co">
            <Icon.Home size={19} />
            <span className="rail-foot-label">Volver al sitio</span>
          </a>
        </div>
      </aside>

      <div className="shell-main">
        <DemoBanner />
        <header className="topbar">
          <div className="topbar-title">
            <b>{t.title}</b>
            <span>{t.sub}</span>
          </div>
          <div className="topbar-actions">
            <span className="company-fixed hide-mob">{negocio}</span>
            <span className="user-chip" title={`Plan ${PLAN_NAMES[plan]}`}>
              {brandInitial}
            </span>
          </div>
        </header>

        <main className="content">
          {locked && active ? <FeatureLocked screen={active} /> : children}
        </main>
      </div>

      {/* Nav inferior (mobile) */}
      <nav className="mobnav" aria-label="Navegación">
        {MOB_NAV.map((id) => {
          const item = NAV.find((n) => n.id === id)!;
          const Ico = Icon[item.icon];
          const isActive = active === id;
          const isLocked = !isScreenUnlocked(plan, id);
          return (
            <Link
              key={id}
              href={`/preview/${id}`}
              className={`mobnav-item${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {Ico ? <Ico size={20} /> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
