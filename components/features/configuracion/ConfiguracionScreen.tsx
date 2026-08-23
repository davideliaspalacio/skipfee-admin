'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { pedirRecorrido } from '@/lib/recorrido';
import { PageHeader } from '@/components/ui/Feedback';
import { Tabs } from '@/components/ui/Tabs';
import { LocalPanel } from './LocalPanel';
import { MarcaPanel } from './MarcaPanel';
import { ZonasPanel } from './ZonasPanel';
import { HorariosPanel } from './HorariosPanel';
import { CocinerosPanel } from './CocinerosPanel';
import { MeserosPanel } from './MeserosPanel';
import { CategoriasPanel } from './CategoriasPanel';
import { BotMessagesPanel } from './BotMessagesPanel';
import { ResenasPanel } from './ResenasPanel';
import { PromocionesPanel } from './PromocionesPanel';
import styles from './configuracion.module.css';

type TabKey = 'local' | 'zonas' | 'horarios' | 'cocineros' | 'meseros' | 'categorias' | 'bot' | 'resenas' | 'promos';

const TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'local', label: 'Local' },
  { id: 'zonas', label: 'Zonas y tarifas' },
  { id: 'horarios', label: 'Horarios' },
  { id: 'cocineros', label: 'Cocineros' },
  { id: 'meseros', label: 'Meseros' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'bot', label: 'Mensajes del bot' },
  { id: 'resenas', label: 'Reseñas' },
  { id: 'promos', label: 'Promociones' },
];

const TAB_IDS = new Set<string>(TABS.map(t => t.id));

/** Pantalla Configuración: tabs de marca + un panel por sección, cada uno cableado a sus hooks. */
export function ConfiguracionScreen() {
  // `?tab=zonas` permite enlazar directo a una sección. Lo usan los Primeros
  // pasos: mandar al dueño a "Local" cuando lo que le falta es la zona lo
  // obliga a buscar la pestaña correcta.
  const searchParams = useSearchParams();
  const pedida = searchParams.get('tab');
  const [tab, setTab] = useState<TabKey>(pedida && TAB_IDS.has(pedida) ? (pedida as TabKey) : 'local');

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Configuración"
        sub="Local, zonas, horarios, mensajes del bot y promociones."
        /* El recorrido por el panel se retoma desde aquí y no desde el rail ni
           la topbar: los dos son barras de trabajo, densas y de uso constante,
           y un botón de "ayúdame" ahí estorba en cada turno para servir dos
           veces en la vida del negocio. Configuración es donde ya se viene a
           buscar "cómo se hace esto", y es la única pantalla que existe igual
           en desktop y en mobile — el rail no. El propio recorrido termina
           diciendo que aquí queda. */
        actions={
          <button
            type="button"
            className="btn btn-ghost sm"
            onClick={pedirRecorrido}
            title="Volver a ver la presentación de las pantallas del panel"
          >
            <Icon.Compass size={14} />
            Ver el recorrido
          </button>
        }
      />

      <div className={styles.tabsRow} data-tour="config-tabs">
        <Tabs tabs={TABS} value={tab} onChange={id => setTab(id as TabKey)} />
      </div>

      {tab === 'local' && (
        <div className={styles.stack}>
          <LocalPanel />
          <MarcaPanel />
        </div>
      )}
      {tab === 'zonas' && <ZonasPanel />}
      {tab === 'horarios' && <HorariosPanel />}
      {tab === 'cocineros' && <CocinerosPanel />}
      {tab === 'meseros' && <MeserosPanel />}
      {tab === 'categorias' && <CategoriasPanel />}
      {tab === 'bot' && <BotMessagesPanel />}
      {tab === 'resenas' && <ResenasPanel />}
      {tab === 'promos' && <PromocionesPanel />}
    </div>
  );
}
