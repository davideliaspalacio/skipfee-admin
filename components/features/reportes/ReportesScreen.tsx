'use client';

import { Fragment, useState } from 'react';
import { Icon } from '@/lib/icons';
import { COP } from '@/lib/data';
import { Tabs } from '@/components/ui/Tabs';
import { Panel } from '@/components/ui/Panel';
import { BarChart } from '@/components/ui/Charts';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import { useReports } from '@/lib/queries';
import type { ReportPeriod, ReportsData } from '@/lib/api/reports';
import styles from './reportes.module.css';

const PERIOD_TABS: { id: ReportPeriod; label: string }[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
];

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
};

/** Paleta por zona: reusa los colores de marca declarados en lib/data (ZONES). */
const ZONE_COLORS: Record<string, string> = {
  poblado: '#E85D04',
  envigado: '#606C38',
  laureles: '#5E6AD2',
  fatima: '#A16207',
};

export function ReportesScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const { data: report, isLoading } = useReports(period);
  const loading = isLoading || report == null;
  const periodLabel = PERIOD_LABEL[period];

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <div className={styles.headTitle}>Reportes y métricas</div>
          <div className={styles.headSub}>Rendimiento del negocio · últimos {periodLabel}</div>
        </div>
        <Tabs tabs={PERIOD_TABS} value={period} onChange={(id) => setPeriod(id as ReportPeriod)} />
      </div>

      <div className={styles.grid}>
        <FinancialCard report={report} loading={loading} periodLabel={periodLabel} />
        <WeeklyChart report={report} loading={loading} />
      </div>

      <div className={styles.gridSecondary}>
        <TopProducts report={report} loading={loading} periodLabel={periodLabel} />
        <ZoneAnalysis report={report} loading={loading} />
      </div>

      <Heatmap report={report} loading={loading} periodLabel={periodLabel} />

      <ConversionFunnel report={report} loading={loading} />
    </div>
  );
}

/* ============================================================
   Tarjeta financiera — neto como héroe, bruto/domicilios abajo.
   ============================================================ */
function FinancialCard({
  report,
  loading,
  periodLabel,
}: {
  report?: ReportsData;
  loading: boolean;
  periodLabel: string;
}) {
  const fin = report?.financial;
  const up = (fin?.variation ?? 0) >= 0;

  return (
    <Panel
      title="Resumen financiero"
      dataTour="reportes-financiero"
      meta={
        loading ? (
          <Skeleton width={58} height={22} radius={99} />
        ) : (
          <span className={`${styles.finVar} ${up ? styles.finVarUp : styles.finVarDown}`}>
            {up ? <Icon.TrendingUp size={12} /> : <Icon.TrendingDown size={12} />}
            {up ? '+' : ''}
            {fin?.variation}%
          </span>
        )
      }
      noPad
    >
      <div className={styles.finCard}>
        <div className={styles.finHero}>
          <span className={styles.finHeroLbl}>
            <Icon.DollarSign size={12} /> Neto del período
          </span>
          <div className={styles.finHeroVal}>
            {loading ? <Skeleton width={180} height={40} /> : COP(fin!.neto)}
          </div>
        </div>

        <div className={styles.finSplit}>
          <FinCell
            label="Ingresos brutos"
            value={loading ? null : COP(fin!.bruto)}
            tone="pos"
            tip="Suma de los totales de pedidos entregados en el período. Incluye productos, domicilio y propina cobrados al cliente."
          />
          <FinCell
            label="Costo de domicilios"
            value={loading ? null : COP(fin!.domicilios)}
            tone="neg"
            tip="Suma de las tarifas de zona aplicadas a los pedidos entregados. Es lo que paga el negocio por cada despacho."
          />
        </div>
      </div>
    </Panel>
  );
}

function FinCell({
  label,
  value,
  tone,
  tip,
}: {
  label: string;
  /** null mientras carga */
  value: string | null;
  tone: 'pos' | 'neg';
  tip: string;
}) {
  return (
    <div className={styles.finCell}>
      <span className={styles.finCellLbl}>
        {label}
        <button type="button" className={styles.infoBtn} aria-label={tip}>
          <Icon.Info size={13} />
          <span className={styles.tipText} role="tooltip">
            {tip}
          </span>
        </button>
      </span>
      <span className={`${styles.finCellVal} ${tone === 'pos' ? styles.finPos : styles.finNeg}`}>
        {value === null ? <Skeleton width={100} height={18} /> : value}
      </span>
    </div>
  );
}

/* ============================================================
   Comparativo por día — este período vs anterior (BarChart UI).
   ============================================================ */
function WeeklyChart({ report, loading }: { report?: ReportsData; loading: boolean }) {
  const data = (report?.weeklyComparison ?? []).map((b) => ({
    label: b.label,
    a: b.thisMonth / 1_000_000,
    b: b.lastMonth / 1_000_000,
  }));

  return (
    <Panel
      title="Comparativo por día"
      meta={
        <span className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: 'var(--green)' }} /> Actual
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: 'var(--text-muted)', opacity: 0.4 }}
            />{' '}
            Anterior
          </span>
        </span>
      }
    >
      {loading ? (
        <BarChartSkeleton />
      ) : data.length === 0 ? (
        <EmptyState icon={<Icon.BarChart size={20} />} title="Sin movimiento" sub="No hay ventas en este período." />
      ) : (
        <BarChart data={data} />
      )}
    </Panel>
  );
}

/* ============================================================
   Top productos — ranking con HBar de marca.
   ============================================================ */
function TopProducts({
  report,
  loading,
  periodLabel,
}: {
  report?: ReportsData;
  loading: boolean;
  periodLabel: string;
}) {
  const ranking = report?.topProducts ?? [];
  const max = ranking[0]?.sold ?? 1;

  return (
    <Panel title="Top productos" meta={`Últimos ${periodLabel}`}>
      {loading ? (
        <ProductListSkeleton rows={6} />
      ) : ranking.length === 0 ? (
        <EmptyState icon={<Icon.Package size={20} />} title="Sin ventas" sub="Nadie ha pedido en este período." />
      ) : (
        <div className={styles.prodList}>
          {ranking.map((p, i) => (
            <div key={p.id} className={styles.prodRow}>
              <span className={styles.prodRank}>{i + 1}</span>
              <div className={styles.prodMid}>
                <div className={styles.prodName}>{p.name}</div>
                <div className="hbar">
                  <span style={{ width: `${max ? (p.sold / max) * 100 : 0}%` }} />
                </div>
              </div>
              <span className={styles.prodVal}>
                {p.sold}
                <span className={styles.prodValSub}>uds</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ============================================================
   Análisis por zona — .dtable de marca.
   ============================================================ */
function ZoneAnalysis({ report, loading }: { report?: ReportsData; loading: boolean }) {
  const rows = report?.zoneAnalysis ?? [];

  return (
    <Panel title="Análisis por zona" meta="Pedidos y rentabilidad" noPad dataTour="reportes-zonas">
      <table className="dtable">
        <thead>
          <tr>
            <th>Zona</th>
            <th style={{ textAlign: 'right' }}>Pedidos</th>
            <th style={{ textAlign: 'right' }}>Ingresos</th>
            <th style={{ textAlign: 'right' }}>Ticket prom.</th>
            <th style={{ textAlign: 'right' }}>Costo dom.</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                <td><Skeleton width={92} height={13} /></td>
                <td className="num"><Skeleton width={26} height={13} /></td>
                <td className="num"><Skeleton width={66} height={13} /></td>
                <td className="num"><Skeleton width={66} height={13} /></td>
                <td className="num"><Skeleton width={56} height={13} /></td>
              </tr>
            ))}

          {!loading &&
            rows.map((r) => (
              <tr key={r.zone}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: ZONE_COLORS[r.zone] ?? 'var(--text-muted)',
                        flex: 'none',
                      }}
                    />
                    {r.zoneName}
                  </span>
                </td>
                <td className="num">{r.orders}</td>
                <td className="num pos">{COP(r.revenue)}</td>
                <td className="num">{COP(r.avgTicket)}</td>
                <td className="num neg">{COP(r.deliveryCost)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {!loading && rows.length === 0 && (
        <EmptyState icon={<Icon.MapPin size={20} />} title="Sin datos de zona" sub="No hay pedidos despachados en este período." />
      )}
    </Panel>
  );
}

/* ============================================================
   Heatmap horario — grid CSS, intensidad por opacity sobre --green.
   ============================================================ */
const HEAT_HOURS = ['11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];
const HEAT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Backend usa índice de getDay() (0=domingo). Reordenamos para mostrar Lun→Dom.
const HEAT_ORDER = [1, 2, 3, 4, 5, 6, 0];
const HEAT_EMPTY = Array(12).fill(0);

function Heatmap({
  report,
  loading,
  periodLabel,
}: {
  report?: ReportsData;
  loading: boolean;
  periodLabel: string;
}) {
  return (
    <Panel
      title="Hora pico · día × hora"
      meta={`Intensidad de pedidos · ${periodLabel}`}
      actions={
        <span className={styles.heatLegend}>
          Menos
          <span className={styles.heatScale}>
            {[0.15, 0.35, 0.55, 0.75, 1].map((o, i) => (
              <span key={i} className={styles.heatScaleCell} style={{ background: 'var(--green)', opacity: o }} />
            ))}
          </span>
          Más
        </span>
      }
    >
      <div className={styles.heat}>
        <span className={styles.heatCorner} />
        {HEAT_HOURS.map((h) => (
          <span key={h} className={styles.heatCol}>
            {h}
          </span>
        ))}

        {HEAT_ORDER.map((di) => {
          const row = loading ? HEAT_EMPTY : report?.heatmap?.[di] ?? HEAT_EMPTY;
          return (
            <Fragment key={HEAT_DAYS[di]}>
              <span className={styles.heatRowLbl}>{HEAT_DAYS[di]}</span>
              {row.map((v, hi) =>
                loading ? (
                  <Skeleton key={hi} width="100%" height={18} radius={4} style={{ aspectRatio: '1 / 1' }} />
                ) : (
                  <span
                    key={hi}
                    className={`${styles.heatCell}${(v ?? 0) < 0.02 ? ` ${styles.heatCellEmpty}` : ''}`}
                    style={{ opacity: (v ?? 0) < 0.02 ? 1 : 0.14 + (v ?? 0) * 0.86 }}
                    title={`${HEAT_DAYS[di]} ${HEAT_HOURS[hi]} · ${Math.round((v ?? 0) * 100)}% de intensidad`}
                  />
                ),
              )}
            </Fragment>
          );
        })}
      </div>
    </Panel>
  );
}

/* ============================================================
   Embudo de conversión — barras estilo .sla.
   ============================================================ */
function ConversionFunnel({ report, loading }: { report?: ReportsData; loading: boolean }) {
  const c = report?.conversion;
  const rate = c?.rate ?? 0;

  return (
    <Panel title="Tasa de conversión" meta={<Icon.Sparkles size={13} />}>
      {loading ? (
        <ConversionSkeleton />
      ) : (
        <>
          <div className={styles.convTop}>
            <span className={styles.convRate}>
              {rate}
              <span className="pct" style={{ fontSize: '1.2rem', color: 'var(--green-strong)', marginLeft: 1 }}>
                %
              </span>
            </span>
            <span className={styles.convCaption}>Chats que terminaron en un pedido pagado</span>
          </div>

          <div className={styles.funnel}>
            <FunnelRow
              name="Chats abiertos"
              value={c!.openChats}
              pct={100}
              fill="base"
            />
            <FunnelRow
              name="Pedidos cerrados"
              value={c!.closedOrders}
              pct={rate}
              fill="win"
            />
            <FunnelRow
              name="No convertidos"
              value={c!.nonConverted}
              pct={100 - rate}
              fill="loss"
            />
          </div>
        </>
      )}
    </Panel>
  );
}

function FunnelRow({
  name,
  value,
  pct,
  fill,
}: {
  name: string;
  value: number;
  pct: number;
  fill: 'base' | 'win' | 'loss';
}) {
  const fillClass =
    fill === 'win' ? styles.funFillWin : fill === 'loss' ? styles.funFillLoss : styles.funFillBase;
  return (
    <div className={styles.funRow}>
      <span className={styles.funNm}>{name}</span>
      <span className={styles.funTrack}>
        <span className={`${styles.funFill} ${fillClass}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </span>
      <span className={styles.funVal}>{value}</span>
    </div>
  );
}

/* ============================================================
   Skeletons
   ============================================================ */
function BarChartSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, padding: '12px 6px 4px' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'flex-end', justifyContent: 'center' }}>
          <Skeleton width="40%" style={{ maxWidth: 18 }} height={60 + ((i * 23) % 90)} radius={3} />
          <Skeleton width="40%" style={{ maxWidth: 18 }} height={40 + ((i * 17) % 70)} radius={3} />
        </div>
      ))}
    </div>
  );
}

function ProductListSkeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.prodList}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.prodRow}>
          <Skeleton width={26} height={26} radius={8} />
          <div className={styles.prodMid}>
            <div style={{ marginBottom: 6 }}>
              <Skeleton width={130 - (i % 3) * 22} height={13} />
            </div>
            <Skeleton width="100%" height={8} radius={99} />
          </div>
          <Skeleton width={22} height={13} />
        </div>
      ))}
    </div>
  );
}

function ConversionSkeleton() {
  return (
    <>
      <div className={styles.convTop}>
        <Skeleton width={92} height={40} />
        <Skeleton width={210} height={13} />
      </div>
      <div className={styles.funnel}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.funRow}>
            <Skeleton width={110} height={13} />
            <Skeleton width="100%" height={12} radius={99} />
            <Skeleton width={28} height={13} />
          </div>
        ))}
      </div>
    </>
  );
}
