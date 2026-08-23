'use client';

import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import { Panel } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Chip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, Skeleton } from '@/components/ui/Feedback';
import {
  useActiveCompany,
  useChannelAction,
  useChannels,
  useSimulateChannelOrder,
} from '@/lib/queries';
import type {
  ChannelKind,
  ChannelProvider,
  ChannelRequirement,
  ChannelStatus,
  ChannelsOverview,
  SalesChannel,
} from '@/lib/api';
import { WhatsAppConnect } from './WhatsAppConnect';
import { PagosConnect } from './PagosConnect';
import styles from './canales.module.css';

const fallbackOverview: ChannelsOverview = {
  summary: {
    activeChannels: 4,
    totalOrders: 0,
    totalSales: 0,
    directSales: 0,
    marketplaceSales: 0,
    commissionToday: 0,
    avoidedCommission: 0,
  },
  channels: [
    {
      id: 'preview-whatsapp',
      provider: 'whatsapp',
      name: 'WhatsApp',
      kind: 'direct',
      mode: 'live',
      status: 'live_connected',
      statusLabel: 'Conectado',
      deliveryMode: 'own_delivery',
      deliveryLabel: 'Entrega propia',
      commissionRateBps: 0,
      externalStoreId: null,
      credentialsStatus: 'configured',
      ordersToday: 0,
      salesToday: 0,
      commissionToday: 0,
      lastEventAt: null,
      lastEventLabel: 'Sin eventos',
      lastError: null,
      settings: {},
    },
    {
      id: 'preview-storefront',
      provider: 'storefront',
      name: 'Tienda directa',
      kind: 'direct',
      mode: 'live',
      status: 'live_connected',
      statusLabel: 'Conectado',
      deliveryMode: 'own_delivery',
      deliveryLabel: 'Entrega propia',
      commissionRateBps: 0,
      externalStoreId: null,
      credentialsStatus: 'configured',
      ordersToday: 0,
      salesToday: 0,
      commissionToday: 0,
      lastEventAt: null,
      lastEventLabel: 'Sin eventos',
      lastError: null,
      settings: {},
    },
    {
      id: 'preview-rappi',
      provider: 'rappi',
      name: 'Rappi',
      kind: 'marketplace',
      mode: 'simulated',
      status: 'simulated_ready',
      statusLabel: 'Simulador activo',
      deliveryMode: 'provider_or_own',
      deliveryLabel: 'Marketplace / propia',
      commissionRateBps: 2600,
      externalStoreId: null,
      credentialsStatus: 'missing',
      ordersToday: 0,
      salesToday: 0,
      commissionToday: 0,
      lastEventAt: null,
      lastEventLabel: 'Sin eventos',
      lastError: null,
      settings: { docs: 'https://dev-portal.rappi.com/' },
    },
    {
      id: 'preview-didi',
      provider: 'didi',
      name: 'DiDi Food',
      kind: 'marketplace',
      mode: 'simulated',
      status: 'simulated_ready',
      statusLabel: 'Simulador activo',
      deliveryMode: 'provider_or_own',
      deliveryLabel: 'Marketplace / propia',
      commissionRateBps: 2400,
      externalStoreId: null,
      credentialsStatus: 'missing',
      ordersToday: 0,
      salesToday: 0,
      commissionToday: 0,
      lastEventAt: null,
      lastEventLabel: 'Sin eventos',
      lastError: null,
      settings: { docs: 'https://developer.didi-food.com/' },
    },
  ],
  requirements: [
    { area: 'Documentación', item: 'Contrato real de endpoints, payloads y estados por país', state: 'Rappi público / DiDi privado pendiente', priority: 'Alta' },
    { area: 'Credenciales', item: 'client_id, client_secret, store IDs y webhook secret', state: 'Pendiente live', priority: 'Alta' },
    { area: 'Pedidos', item: 'Origen, ID externo, entrega y estado externo', state: 'Base lista', priority: 'Alta' },
    { area: 'Catálogo', item: 'Mapeo producto interno contra producto externo', state: 'Base lista', priority: 'Media' },
  ],
};

function statusTag(channel: SalesChannel) {
  const tone = statusTone(channel.status);
  return <Tag tone={tone}>{channel.statusLabel}</Tag>;
}

function statusTone(status: ChannelStatus): 'green' | 'sun' | 'coral' | undefined {
  if (status === 'live_connected') return 'green';
  if (status === 'simulated_ready') return 'sun';
  if (status === 'degraded' || status === 'paused') return 'coral';
  return undefined;
}

function requirementTone(state: string): 'green' | 'sun' | 'coral' | undefined {
  if (state.includes('Base lista')) return 'green';
  if (state.includes('Pendiente')) return 'sun';
  if (state.includes('privado')) return 'sun';
  return undefined;
}

function kindLabel(kind: ChannelKind): string {
  if (kind === 'direct') return 'Directo';
  if (kind === 'marketplace') return 'Marketplace';
  return 'POS';
}

function channelIcon(provider: ChannelProvider) {
  if (provider === 'whatsapp') return <Icon.MessageCircle size={18} />;
  if (provider === 'storefront') return <Icon.ShoppingBag size={18} />;
  if (provider === 'manual') return <Icon.Receipt size={18} />;
  if (provider === 'ubereats') return <Icon.Bike size={18} />;
  return <Icon.Wifi size={18} />;
}

function commissionLabel(channel: SalesChannel): string {
  if (channel.commissionRateBps <= 0) return '0%';
  return `${(channel.commissionRateBps / 100).toFixed(1)}%`;
}

function isSimulatable(provider: ChannelProvider): provider is 'rappi' | 'didi' {
  return provider === 'rappi' || provider === 'didi';
}

export function CanalesScreen() {
  const activeCompany = useActiveCompany();
  const channelsQuery = useChannels();
  const action = useChannelAction();
  const simulate = useSimulateChannelOrder();
  const overview = channelsQuery.data ?? fallbackOverview;
  const hasLiveData = !!channelsQuery.data;
  const canMutate = !!activeCompany && hasLiveData;
  const loading = channelsQuery.isLoading && !!activeCompany;

  const columns: Column<SalesChannel>[] = [
    {
      key: 'channel',
      label: 'Canal',
      render: (c) => (
        <div className={styles.channelCell}>
          <span className={styles.channelIcon}>{channelIcon(c.provider)}</span>
          <span>
            <b>{c.name}</b>
            <small>{c.provider} · {kindLabel(c.kind)}</small>
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (c) => statusTag(c),
    },
    {
      key: 'orders',
      label: 'Pedidos hoy',
      num: true,
      render: (c) => <span>{loading ? <Skeleton width={28} /> : c.ordersToday}</span>,
    },
    {
      key: 'sales',
      label: 'Ventas',
      num: true,
      render: (c) => <span>{loading ? <Skeleton width={82} /> : COP(c.salesToday)}</span>,
    },
    {
      key: 'commission',
      label: 'Comisión',
      num: true,
      render: (c) => (
        <span>
          {commissionLabel(c)}
          {c.commissionToday > 0 ? <small className={styles.subValue}>{COP(c.commissionToday)}</small> : null}
        </span>
      ),
    },
    {
      key: 'delivery',
      label: 'Entrega',
      render: (c) => <span>{c.deliveryLabel}</span>,
    },
    {
      key: 'last',
      label: 'Último evento',
      render: (c) => (
        <span className={c.lastError ? styles.errorText : styles.muted}>
          {c.lastError ?? c.lastEventLabel}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (c) => {
        const simulatedProvider = isSimulatable(c.provider) ? c.provider : null;
        return (
          <div className={styles.rowActions}>
            {simulatedProvider && c.status !== 'simulated_ready' ? (
              <button
                type="button"
                className="btn btn-ghost sm"
                disabled={!canMutate || action.isPending}
                onClick={() => action.mutate({ provider: simulatedProvider, action: 'enable_simulator' })}
              >
                Activar
              </button>
            ) : null}
            {simulatedProvider ? (
              <button
                type="button"
                className="btn btn-primary sm"
                disabled={!canMutate || c.status !== 'simulated_ready' || simulate.isPending}
                onClick={() => simulate.mutate(simulatedProvider)}
              >
                <Icon.Sparkles size={13} />
                Simular
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const prepColumns: Column<ChannelRequirement>[] = [
    { key: 'area', label: 'Área', render: (r) => <b>{r.area}</b> },
    { key: 'item', label: 'Requisito', render: (r) => <span>{r.item}</span> },
    { key: 'state', label: 'Estado', render: (r) => <Tag tone={requirementTone(r.state)}>{r.state}</Tag> },
    { key: 'priority', label: 'Prioridad', render: (r) => <span className={styles.muted}>{r.priority}</span> },
  ];

  const docs = overview.channels
    .filter((c) => c.kind === 'marketplace' && typeof c.settings.docs === 'string')
    .map((c) => ({ name: c.name, href: c.settings.docs as string }));

  return (
    <div className={styles.wrap}>
      <PageHeader
        title="Canales"
        sub="Fuentes de pedido e integraciones por empresa"
        actions={
          <button
            type="button"
            className="btn btn-ghost sm"
            onClick={() => channelsQuery.refetch()}
            disabled={!activeCompany || channelsQuery.isFetching}
          >
            <Icon.Wifi size={14} />
            Actualizar
          </button>
        }
      />

      {channelsQuery.isError ? (
        <div className={styles.banner}>
          <Icon.AlertCircle size={16} />
          <span>No se pudo cargar Canales. Revisa que la migración 0043 esté aplicada.</span>
        </div>
      ) : null}

      {!activeCompany ? (
        <div className={styles.banner}>
          <Icon.Info size={16} />
          <span>Vista previa visual. Inicia sesión y selecciona empresa para simular pedidos.</span>
        </div>
      ) : null}

      {/* WhatsApp va primero: sin él conectado no entra ningún pedido, así que
          es la puerta de entrada del resto de la pantalla. */}
      {activeCompany ? <WhatsAppConnect /> : null}

      {activeCompany ? <PagosConnect /> : null}

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span>Canales activos</span>
          <b>{loading ? <Skeleton width={38} height={22} /> : overview.summary.activeChannels}</b>
          <small>Directos y simuladores</small>
        </div>
        <div className={styles.metric}>
          <span>Pedidos hoy</span>
          <b>{loading ? <Skeleton width={42} height={22} /> : overview.summary.totalOrders}</b>
          <small>Entradas consolidadas</small>
        </div>
        <div className={styles.metric}>
          <span>Venta directa</span>
          <b>{loading ? <Skeleton width={98} height={22} /> : COP(overview.summary.directSales)}</b>
          <small>
            {overview.summary.totalSales > 0
              ? `${Math.round((overview.summary.directSales / overview.summary.totalSales) * 100)}% del mix`
              : 'Sin ventas hoy'}
          </small>
        </div>
        <div className={styles.metric}>
          <span>Comisión evitada</span>
          <b>{loading ? <Skeleton width={98} height={22} /> : COP(overview.summary.avoidedCommission)}</b>
          <small>Estimado contra marketplace</small>
        </div>
      </div>

      <Panel
        title="Fuentes de pedidos"
        meta={<span className={styles.muted}>{overview.channels.length} canales configurables</span>}
        noPad
      >
        <DataTable columns={columns} rows={overview.channels} rowKey={(c) => c.id} />
      </Panel>

      <div className={styles.grid}>
        <Panel title="Requisitos de conexión" noPad>
          <DataTable
            columns={prepColumns}
            rows={overview.requirements}
            rowKey={(r) => `${r.area}-${r.item}`}
          />
        </Panel>

        <Panel title="Mix y documentación">
          <div className={styles.mix}>
            <div>
              <span className={styles.swatch} style={{ background: 'var(--green)' }} />
              Directo
              <b>{COP(overview.summary.directSales)}</b>
            </div>
            <div>
              <span className={styles.swatch} style={{ background: 'var(--sun)' }} />
              Marketplaces
              <b>{COP(overview.summary.marketplaceSales)}</b>
            </div>
            <div>
              <span className={styles.swatch} style={{ background: 'var(--ink)' }} />
              Comisión registrada
              <b>{COP(overview.summary.commissionToday)}</b>
            </div>
          </div>
          <div className={styles.docs}>
            {docs.map((doc) => (
              <a key={doc.name} href={doc.href} target="_blank" rel="noopener noreferrer">
                {doc.name}
                <Icon.ArrowRight size={13} />
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
