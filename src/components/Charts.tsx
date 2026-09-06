export function TrendChart({ series, color = '#22d3ee', height = 150, fill = true }: { series: number[]; color?: string; height?: number; fill?: boolean }) {
  if (!series.length) return <p className="text-xs text-slate-500">No data</p>;
  const W = 560, H = 180, P = 26;
  const max = Math.max(...series) * 1.15 || 1;
  const min = Math.min(...series) * 0.85 || 0;
  const X = (i: number) => P + (i / Math.max(1, series.length - 1)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - min) / Math.max(0.001, max - min)) * (H - 2 * P);
  const d = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${X(series.length - 1).toFixed(1)},${H - P} L${X(0).toFixed(1)},${H - P} Z`;
  const gid = `g${Math.abs(series.length * 31 + Math.round(max * 7))}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={P} x2={W - P} y1={H * t} y2={H * t} stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="4 4" />
      ))}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {series.map((v, i) => (
        <circle key={i} cx={X(i)} cy={Y(v)} r={series.length > 30 ? 1.6 : 3} fill={color} stroke="#060d1a" strokeWidth="1">
          <title>{`${v}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  let acc = 0;
  const R = 60, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#16263f" strokeWidth="20" />
        {parts.map((p) => {
          const frac = p.value / total;
          const el = <circle key={p.label} cx="80" cy="80" r={R} fill="none" stroke={p.color} strokeWidth="20"
            strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`} strokeDashoffset={(-acc * C).toFixed(1)} strokeLinecap="butt" />;
          acc += frac;
          return el;
        })}
      </svg>
      <div className="space-y-2 text-xs">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            <span className="text-slate-300 font-semibold">{p.label}</span>
            <span className="text-slate-500">{p.value} ({((p.value / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MultiLine({ lines, height = 170 }: { lines: { label: string; color: string; values: number[] }[]; height?: number }) {
  const W = 560, H = 200, P = 28;
  const all = lines.flatMap((l) => l.values);
  if (!all.length) return <p className="text-xs text-slate-500">No data</p>;
  const max = Math.max(...all) * 1.05 || 1, min = Math.min(...all) * 0.95 || 0;
  const n = Math.max(...lines.map((l) => l.values.length));
  const X = (i: number) => P + (i / Math.max(1, n - 1)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - min) / Math.max(0.001, max - min)) * (H - 2 * P);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={P} x2={W - P} y1={H * t} y2={H * t} stroke="#fff" strokeOpacity="0.06" strokeDasharray="4 4" />
        ))}
        {lines.map((l) => (
          <path key={l.label} d={l.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}
            fill="none" stroke={l.color} strokeWidth="2.2" strokeLinecap="round" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-1">
        {lines.map((l) => (
          <span key={l.label} className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-4 h-[3px] rounded" style={{ background: l.color }} />{l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
