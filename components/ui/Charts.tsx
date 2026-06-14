/** Gráficas SVG/CSS ligeras, repintadas a los tokens de marca. Sin libs. */

export interface LineDatum {
  day: string;
  sales: number;
}

export function LineChart({
  data,
  width = 600,
  height = 200,
  color = 'var(--green)',
}: {
  data: LineDatum[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.sales));
  const min = Math.min(...data.map((d) => d.sales));
  const span = max - min || 1;
  const padX = 36;
  const padY = 18;
  const w = width - padX * 2;
  const h = height - padY * 2;
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * w;
    const y = padY + h - ((d.sales - min) / span) * h;
    return [x, y] as const;
  });
  const pathLine = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const pathArea = `${pathLine} L${padX + w},${padY + h} L${padX},${padY + h} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => {
        const y = padY + h - t * h;
        return <line key={i} x1={padX} y1={y} x2={padX + w} y2={y} stroke="var(--line)" strokeDasharray="2 4" />;
      })}
      <path d={pathArea} fill="url(#lc-grad)" />
      <path d={pathLine} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.5" fill={color} />
          <text x={x} y={height - 4} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
            {data[i].day}
          </text>
        </g>
      ))}
      <text x={padX - 6} y={padY + 4} textAnchor="end" fontSize="9.5" fill="var(--text-muted)">
        ${Math.round(max / 1000)}k
      </text>
      <text x={padX - 6} y={padY + h + 2} textAnchor="end" fontSize="9.5" fill="var(--text-muted)">
        ${Math.round(min / 1000)}k
      </text>
    </svg>
  );
}

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function Donut({ data, size = 130 }: { data: DonutDatum[]; size?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  let a0 = -Math.PI / 2;
  const arcs = data.map((d) => {
    const ang = (d.value / total) * Math.PI * 2;
    const a1 = a0 + ang;
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const large = ang > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
    a0 = a1;
    return { path, color: d.color };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <path key={i} d={a.path} fill={a.color} />
      ))}
      <circle cx={cx} cy={cy} r={r - 22} fill="var(--surface)" />
      <text x={cx} y={cy - 1} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
        Total
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)">
        {total}
      </text>
    </svg>
  );
}

export interface BarDatum {
  label: string;
  a: number;
  b?: number;
}

export function BarChart({
  data,
  height = 180,
  color = 'var(--green)',
  accent = 'var(--text-muted)',
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  accent?: string;
}) {
  const max = Math.max(...data.flatMap((d) => [d.a ?? 0, d.b ?? 0])) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height, padding: '12px 6px 4px', borderBottom: '1px solid var(--line)' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, width: '100%', justifyContent: 'center' }}>
            <div style={{ width: '40%', maxWidth: 18, height: `${(d.a / max) * 100}%`, background: color, borderRadius: '3px 3px 0 0' }} />
            {d.b !== undefined && (
              <div style={{ width: '40%', maxWidth: 18, height: `${(d.b / max) * 100}%`, background: accent, opacity: 0.35, borderRadius: '3px 3px 0 0' }} />
            )}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBar({ value, max, color = 'var(--green)' }: { value: number; max: number; color?: string }) {
  return (
    <div className="hbar">
      <span style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
    </div>
  );
}
