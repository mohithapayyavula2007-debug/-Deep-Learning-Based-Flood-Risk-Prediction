import { Link, useLocation } from 'react-router-dom';
import { Waves, LayoutDashboard, BrainCircuit, Radio, MapPinned, LineChart, Siren } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard },
  { to: '/predict', label: 'Risk Predictor', icon: BrainCircuit },
  { to: '/stations', label: 'Sensor Network', icon: Radio },
  { to: '/zones', label: 'Zones & Alerts', icon: MapPinned },
  { to: '/model', label: 'Model Intelligence', icon: Siren },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-[#060d1a] text-slate-100 flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-cyan-500/10 bg-[#081226]/90 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-[15px] leading-tight">AquaShield AI</p>
            <p className="text-[11px] text-cyan-300/70 font-medium tracking-wide">FLOOD RISK PREDICTION</p>
          </div>
        </div>
        <nav className="px-3 space-y-1 flex-1">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/25' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'}`}>
                <Icon className="w-[18px] h-[18px]" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border border-cyan-500/20">
          <p className="text-xs font-bold text-cyan-200">FloodNet-MLP v2.4.1</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">6-10-8-4-1 deep network · 48k samples · val acc 91.7%</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-300 font-semibold">Model online</span>
          </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <div className="md:hidden sticky top-0 z-20 bg-[#060d1a]/95 border-b border-cyan-500/10 px-4 py-3 flex items-center gap-2 overflow-x-auto">
          <Waves className="w-5 h-5 text-cyan-400 shrink-0" />
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${loc.pathname === n.to ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'}`}>{n.label}</Link>
          ))}
        </div>
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}
