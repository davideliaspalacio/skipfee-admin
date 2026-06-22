'use client';

import { useDemo } from '@/lib/demo';
import { PLAN_NAMES, minPlanFor } from '@/lib/plans';
import { SCREEN_TITLES, type ScreenId } from '@/lib/nav';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skipfee.co').replace(/\/+$/, '');

/** Copy de venta por pantalla bloqueada. */
const LOCKED_COPY: Partial<Record<ScreenId, string>> = {
  despachos: 'Agrupa pedidos por cercanía y arma la ruta más corta para tu domiciliario, con cobertura por zonas.',
  clientes: 'Tu CRM: quién es quién, qué pide y cada cuánto vuelve. Información 100% tuya para fidelizar.',
  reportes: 'Ventas por zona y hora, productos top, heatmap y conversión de chats a pedidos. Exportable.',
  configuracion: 'Zonas con Google Maps, horarios por cocinero, mensajes del bot, promociones y post-venta.',
};

function LockIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Pantalla de "función bloqueada" para el modo demo: candado + upsell al plan que la incluye. */
export function FeatureLocked({ screen }: { screen: ScreenId }) {
  const { plan } = useDemo();
  const need = minPlanFor(screen);
  const title = SCREEN_TITLES[screen]?.title ?? 'Esta función';
  const copy = LOCKED_COPY[screen] ?? SCREEN_TITLES[screen]?.sub ?? '';
  return (
    <div className="demo-locked">
      <div className="demo-locked-card">
        <span className="demo-locked-ic"><LockIcon /></span>
        <span className="demo-locked-badge">Plan {PLAN_NAMES[need]}</span>
        <h2>{title} llega con {PLAN_NAMES[need]}</h2>
        {copy && <p>{copy}</p>}
        <a className="btn btn-primary" href={`${SITE_URL}/precios`} target="_blank" rel="noopener noreferrer">
          Ver planes
        </a>
        <p className="demo-locked-fine">Estás probando el plan <b>{PLAN_NAMES[plan]}</b>. Súbete de plan para activar esta función.</p>
      </div>
    </div>
  );
}
