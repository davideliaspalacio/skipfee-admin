'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/lib/icons';
import { COP, STATUSES } from '@/lib/data';
import { useDashboard, useActivePromotions } from '@/lib/queries';
import { Panel } from '@/components/ui/Panel';
import { LineChart, Donut } from '@/components/ui/Charts';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import { UrgencyChip } from '@/components/ui/Chip';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PromoBanner } from './PromoBanner';
import { StatGrid, StatCard } from './StatGrid';
import styles from './dashboard.module.css';

interface AttentionOrder {
  id: string;
  number: number;
  cliente: string;
  status: string;
  minutos: number;
  reason: string;
}

function statusLabel(status: string): string {
  return STATUSES.find((s) => s.id === status)?.label ?? status;
}

/**
 * Centro de operación: lo vivo arriba (promo + lo que requiere acción),
 * KPIs accionables, tendencia 7d, mix del día y la cola de atención con
 * deep-links a /pedidos. No es un dashboard pasivo de KPIs.
 */
export function DashboardScreen() {
  const router = useRouter();
  const { data: dash, isFetching, isError } = useDashboard();
  const { data: promotions } = useActivePromotions();

  const activePromotions = promotions ?? [];
  const loading = dash == null;

  const attention: AttentionOrder[] = dash?.attentionOrders ?? [];
  const hasMix = !loading && dash.productMix.length > 0;

  // Error de carga sin datos previos: no quedarse en skeletons para siempre.
  if (isError && dash == null) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <div>
            <div className={styles.headTitle}>Centro de operación</div>
            <div className={styles.muted} style={{ fontSize: 13, marginTop: 2 }}>
              El pulso de hoy · zona horaria Bogotá
            </div>
          </div>
        </div>
        <Panel title="Sin conexión con el backend">
          <EmptyState
            title="No se pudo cargar el panel"
            sub="Revisa tu conexión con el backend e inténtalo de nuevo en unos segundos."
          />
        </Panel>
      </div>
    );
  }

  const attnColumns: Column<AttentionOrder>[] = [
    {
      key: 'number',
      label: 'Pedido',
      render: (o) => <span className={styles.attnNum}>#{o.number}</span>,
    },
    {
      key: 'reason',
      label: 'Motivo',
      render: (o) => (
        <span className={styles.attnReason}>
          {o.reason || (
            <>
              Lleva <b>{o.minutos}m</b> en <b>{statusLabel(o.status)}</b>
            </>
          )}
          <span className={styles.who}> · {o.cliente}</span>
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (o) => (
        <span className="chip sm" style={chipStyle(o.status)}>
          <span className="cdot" />
          {statusLabel(o.status)}
        </span>
      ),
    },
    {
      key: 'min',
      label: 'Espera',
      align: 'right',
      render: (o) => <UrgencyChip minutes={o.minutos} />,
    },
    {
      key: 'go',
      label: '',
      align: 'right',
      render: () => (
        <span className={styles.attnDeep}>
          Abrir <Icon.ArrowRight size={12} />
        </span>
      ),
    },
  ];

  return (
    <div className={styles.wrap}>
      {activePromotions.length > 0 && <PromoBanner promotions={activePromotions} />}

      <div className={styles.head}>
        <div>
          <div className={styles.headTitle}>Centro de operación</div>
          <div className={styles.muted} style={{ fontSize: 13, marginTop: 2 }}>
            El pulso de hoy · zona horaria Bogotá
          </div>
        </div>
        <span className={styles.live}>
          <span className={`${styles.liveDot}${isFetching ? ` ${styles.on}` : ''}`} />
          En vivo · se actualiza solo
        </span>
      </div>

      <StatGrid>
        <StatCard
          icon={<Icon.DollarSign size={15} />}
          label="Ventas del día"
          loading={loading}
          value={loading ? null : COP(dash.salesAmount)}
          sub="Pedidos entregados hoy"
        />
        <StatCard
          icon={<Icon.CheckCircle size={15} />}
          label="Completados"
          loading={loading}
          skelWidth={48}
          value={loading ? null : String(dash.completedOrders)}
          sub="Estado: entregado"
        />
        <StatCard
          icon={<Icon.Clock size={15} />}
          label="Activos"
          loading={loading}
          skelWidth={48}
          hot={!loading && dash.activeOrders > 0}
          value={loading ? null : String(dash.activeOrders)}
          sub={
            loading ? null : dash.activeOrders > 0 ? (
              <button
                type="button"
                className={styles.attnDeep}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => router.push('/pedidos')}
              >
                Ver en el tablero <Icon.ArrowRight size={12} />
              </button>
            ) : (
              'Aún sin entregar'
            )
          }
        />
        <StatCard
          icon={<Icon.Receipt size={15} />}
          label="Ticket promedio"
          loading={loading}
          value={loading ? null : COP(dash.avgTicket)}
          sub="Por pedido entregado"
        />
      </StatGrid>

      <div className={styles.row} data-tour="dash-graficas">
        <Panel
          title="Ventas últimos 7 días"
          meta={
            <span className={styles.legend}>
              <span className={styles.legendDot} style={{ background: 'var(--green)' }} />
              Ventas · COP
            </span>
          }
        >
          <div className={styles.chartArea}>
            {loading ? (
              <Skeleton width="100%" height={200} radius={8} style={{ display: 'block' }} />
            ) : (
              <LineChart data={dash.sales7d} width={700} height={200} />
            )}
          </div>
        </Panel>

        <Panel
          title="Mix de productos · hoy"
          actions={
            <button type="button" className="btn btn-ghost sm" onClick={() => router.push('/catalogo')}>
              Ver todos <Icon.Chevron size={12} />
            </button>
          }
        >
          {loading ? (
            <div className={styles.donutWrap}>
              <Skeleton width={130} height={130} radius={65} />
              <div className={styles.donutLegend}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className={styles.donutRow}>
                    <Skeleton width={10} height={10} radius={3} />
                    <Skeleton width={110 - i * 16} height={11} />
                  </div>
                ))}
              </div>
            </div>
          ) : hasMix ? (
            <div className={styles.donutWrap}>
              <Donut data={dash.productMix} size={130} />
              <div className={styles.donutLegend}>
                {dash.productMix.map((r) => (
                  <div key={r.name} className={styles.donutRow}>
                    <span className={styles.swatch} style={{ background: r.color }} />
                    <span className={styles.donutName}>{r.name}</span>
                    <span className={styles.donutVal}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Icon.Package size={20} />}
              title="Sin pedidos hoy todavía"
              sub="El mix aparece cuando entren los primeros pedidos."
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Requiere tu atención"
        dataTour="dash-atencion"
        meta={
          loading ? (
            <span className={styles.muted}>Cargando…</span>
          ) : (
            <span className={styles.muted}>
              {attention.length} {attention.length === 1 ? 'pedido activo' : 'pedidos activos'} sin moverse
            </span>
          )
        }
        actions={
          <button type="button" className="btn btn-ghost sm" onClick={() => router.push('/pedidos')}>
            <Icon.Route size={12} />
            Ir a pedidos
          </button>
        }
        noPad
      >
        {loading ? (
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width="100%" height={20} radius={6} />
            ))}
          </div>
        ) : attention.length === 0 ? (
          <EmptyState
            icon={<Icon.CheckCircle size={20} />}
            title="Todo al día"
            sub="Ningún pedido activo lleva demasiado tiempo sin moverse."
          />
        ) : (
          <div className={styles.dtableLink}>
            <DataTable
              columns={attnColumns}
              rows={attention}
              rowKey={(o) => o.id}
              onRowClick={() => router.push('/pedidos')}
            />
          </div>
        )}
      </Panel>
    </div>
  );
}

/** Color del chip de estado tomado de STATUSES (fuente de verdad de columnas). */
function chipStyle(status: string): React.CSSProperties {
  const s = STATUSES.find((x) => x.id === status);
  if (!s) return {};
  return { color: s.color, background: `${s.color}1f` };
}
