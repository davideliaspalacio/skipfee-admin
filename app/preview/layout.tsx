'use client';

import { DemoProvider } from '@/lib/demo';
import { DemoShell } from '@/components/layout/DemoShell';

/**
 * Layout del "modo demo" (/preview/*). Provee el contexto de demo (negocio/plan
 * leídos de la URL) y el shell con navegación real + gating por plan. Las páginas
 * hijas solo aportan su contenido (siembran sus mocks en un QueryClient propio).
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DemoShell>{children}</DemoShell>
    </DemoProvider>
  );
}
