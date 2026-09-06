import { RISK_BG, RISK_COLORS } from '../lib/api';

export function RiskBadge({ level, size = 'md' }: { level: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = RISK_BG[level] || RISK_BG.Moderate;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  return <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${pad} ${cls}`}><span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLORS[level] || '#999' }} />{level}</span>;
}

export function Gauge({ score, size = 190 }: { score: number; size?: number }) {
  const r = 80;
  const circ = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';
  return (
    <div className="relative" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 200 122" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="#16263f" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 110 A 80 80 0 0 1 180 110" fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        {[0, 25, 50, 75, 100].map((t) => {
          const a = Math.PI - (t / 100) * Math.PI;
          const x1 = 100 + Math.cos(a) * 62, y1 = 110 - Math.sin(a) * 62;
          const x2 = 100 + Math.cos(a) * 70, y2 = 110 - Math.sin(a) * 70;
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b5878" strokeWidth="2" />;
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="font-black leading-none" style={{ color, fontSize: size * 0.19 }}>{score.toFixed(1)}</p>
        <p className="text-[11px] tracking-[0.2em] text-slate-400 font-bold mt-1">RISK / 100</p>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/[0.07] bg-[#0b1730]/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ${className}`}>{children}</div>;
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-extrabold tracking-[0.25em] text-cyan-400">{kicker}</p>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{title}</h1>
      {sub && <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">{sub}</p>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b1730]/80 p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}22`, color: accent }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="text-xl font-black tracking-tight truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function BarRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-300 font-medium truncate pr-2">{label}</span>
        <span className="font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}
