'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/Feedback';
import { Tabs } from '@/components/ui/Tabs';
import { LocalPanel } from './LocalPanel';
import { ZonasPanel } from './ZonasPanel';
import { HorariosPanel } from './HorariosPanel';
import { CocinerosPanel } from './CocinerosPanel';
import { CategoriasPanel } from './CategoriasPanel';
import { BotMessagesPanel } from './BotMessagesPanel';
import { ResenasPanel } from './ResenasPanel';
import { PromocionesPanel } from './PromocionesPanel';
import styles from './configuracion.module.css';

type TabKey = 'local' | 'zonas' | 'horarios' | 'cocineros' | 'categorias' | 'bot' | 'resenas' | 'promos';

const TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'local', label: 'Local' },
  { id: 'zonas', label: 'Zonas y tarifas' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'cocineros', label: 'Cocineros' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'bot', label: 'Mensajes del bot' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'promos', label: 'Promociones' },
];

/** Pantalla Configuración: tabs de marca + un panel por sección, cada uno cableado a sus hooks. */
export function ConfiguracionScreen() {
  const [tab, setTab] = useState<TabKey>('local');

  return (
    <div className={styles.wrap}>
      <PageHeader title="Configuración" sub="Local, zonas, horarios, mensajes del bot y promociones." />

      <div className={styles.tabsRow}>
        <Tabs tabs={TABS} value={tab} onChange={id => setTab(id as TabKey)} />
      </div>

      {tab === 'local' && <LocalPanel />}
      {tab === 'zonas' && <ZonasPanel />}
      {tab === 'horarios' && <HorariosPanel />}
      {tab === 'cocineros' && <CocinerosPanel />}
      {tab === 'categorias' && <CategoriasPanel />}
      {tab === 'bot' && <BotMessagesPanel />}
      {tab === 'resenas' && <ResenasPanel />}
      {tab === 'promos' && <PromocionesPanel />}
    </div>
  );
}
