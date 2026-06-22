'use client';

import { DemoProvider } from '@/lib/demo';
import { DemoShell } from '@/components/layout/DemoShell';
import { DemoGuard } from '@/components/demo/DemoGuard';
import { TourController } from '@/components/demo/TourController';

/**
 * Layout del "modo demo" (/preview/*). Provee el contexto de demo, blinda el
 * acceso al backend (DemoGuard), monta el shell con navegación + gating, y
 * orquesta el recorrido guiado (TourController). Las páginas hijas solo aportan
 * su contenido (siembran sus mocks en un QueryClient propio).
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <DemoGuard />
      <DemoShell>{children}</DemoShell>
      <TourController />
    </DemoProvider>
  );
}
