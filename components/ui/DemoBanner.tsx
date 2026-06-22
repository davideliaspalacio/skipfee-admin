'use client';

import { useDemo } from '@/lib/demo';
import { PLAN_NAMES } from '@/lib/plans';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skipfee.co').replace(/\/+$/, '');

/** Barra superior que aclara que es una demostración (negocio + plan + CTA a planes). */
export function DemoBanner() {
  const { isDemo, negocio, plan } = useDemo();
  if (!isDemo) return null;
  return (
    <div className="demo-banner" role="note">
      <span className="demo-banner-badge">Modo demo</span>
      <span className="demo-banner-text">
        Panel de <b>{negocio}</b> con datos de ejemplo · Plan <b>{PLAN_NAMES[plan]}</b>
      </span>
      <a className="demo-banner-cta" href={`${SITE_URL}/precios`} target="_blank" rel="noopener noreferrer">
        Ver planes
      </a>
    </div>
  );
}
