import { useEffect, useState } from 'react';
import { Trash2, LineChart, History, CloudRainWind } from 'lucide-react';
import { apiGet, apiSend, timeAgo, RISK_COLORS } from '../lib/api';
import { Card, SectionTitle, RiskBadge } from '../components/ui';
import { TrendChart, Donut } from '../components/Charts';

export default function Analytics() {
  const [readings, setReadings] = useState<any[]>([]);
  const [preds, setPreds] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true); setErr('');
      const [r, p, e] = await Promise.all([apiGet('/api/readings?limit=200'), apiGet('/api/predictions?limit=100'), apiGet('/api/events')]);
      setReadings(r); setPreds(p); setEvents(e);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: number) => { await apiSend('/api/predictions', 'DELETE', { id }); load(); };
  const clear = async () => { if (!confirm('Clear all prediction history?')) return; await apiSend('/api/predictions', 'DELETE', { all: true }); load(); };
  const logEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await apiSend('/api/events', 'POST', Object.fromEntries(fd.entries()));
      setMsg('Event archived ✓'); (e.target as HTMLFormElement).reset(); load();
    } catch (e: any) { setMsg(e.message); }
  };

  const chrono = readings.slice().reverse();
  const rain = chrono.map((r) => Number(r.rainfall_mm));
  const river = chrono.map((r) => Number(r.river_level_m));
  const dist: Record<string, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
  preds.forEach((p) => { if (dist[p.risk_category] !== undefined) dist[p.risk_category]++; });
  const avgRisk = preds.length ? preds.reduce((a, p) => a + Number(p.risk_score), 0) / preds.length : 0;

  return (
    <div>
      <SectionTitle kicker="TRENDS & LEDGERS" title="Analytics" sub="Telemetry trends, prediction distributions and the full auditable history of every model run." />
      {loading ? <div className="py-20 text-center"><div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" /></div>
        : err ? <p className="text-red-300 font-semibold">{err}</p> : (
          <>
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <h3 className="font-bold mb-2 flex items-center gap-2"><LineChart className="w-4 h-4 text-cyan-400" /> Telemetry trends ({readings.length} samples)</h3>
                <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mt-1">Rainfall mm</p>
                <TrendChart series={rain} color="#22d3ee" height={120} />
                <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider mt-2">River level m</p>
                <TrendChart series={river} color="#60a5fa" height={120} />
              </Card>
              <div className="space-y-4">
                <Card>
                  <h3 className="font-bold mb-3">Risk distribution</h3>
                  <Donut parts={Object.keys(dist).map((k) => ({ label: k, value: dist[k], color: RISK_COLORS[k] }))} />
                  <p className="text-xs text-slate-400 mt-3">Mean risk <span className="font-black text-slate-100">{avgRisk.toFixed(1)}</span> across {preds.length} runs</p>
                </Card>
                <Card>
                  <h3 className="font-bold mb-2 flex items-center gap-2"><CloudRainWind className="w-4 h-4 text-indigo-300" /> Archive flood event</h3>
                  <form onSubmit={logEvent} className="grid grid-cols-2 gap-2">
                    <input name="location" required placeholder="Location *" className="col-span-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <input name="event_date" type="date" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-slate-300 outline-none" />
                    <select name="severity" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-slate-200 outline-none">{['Low', 'Moderate', 'High', 'Critical'].map((s) => <option key={s} className="bg-slate-900">{s}</option>)}</select>
                    <input name="rainfall_mm" placeholder="Rain mm" type="number" step="any" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none placeholder:text-slate-600" />
                    <input name="river_level_m" placeholder="River m" type="number" step="any" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none placeholder:text-slate-600" />
                    <input name="damage_usd_m" placeholder="Damage $M" type="number" step="any" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none placeholder:text-slate-600" />
                    <input name="deaths" placeholder="Deaths" type="number" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none placeholder:text-slate-600" />
                    <input name="description" placeholder="Notes" className="col-span-2 text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none placeholder:text-slate-600" />
                    <button className="col-span-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-sm font-black py-2 hover:bg-indigo-500/30">Archive event</button>
                  </form>
                  {msg && <p className="text-[11px] text-cyan-300 font-bold mt-2">{msg}</p>}
                  <p className="text-[11px] text-slate-500 mt-2">{events.length} events in ledger</p>
                </Card>
              </div>
            </div>
            <Card className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-emerald-400" /> Prediction history ({preds.length})</h3>
                {preds.length > 0 && <button onClick={clear} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25">Clear all</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[760px]">
                  <thead><tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                    <th className="py-2 pr-2">When</th><th className="py-2 pr-2">Rain</th><th className="py-2 pr-2">River</th><th className="py-2 pr-2">Soil</th><th className="py-2 pr-2">Temp</th><th className="py-2 pr-2">Elev</th><th className="py-2 pr-2">Drain</th><th className="py-2 pr-2">Score</th><th className="py-2 pr-2">Category</th><th className="py-2"></th>
                  </tr></thead>
                  <tbody>
                    {preds.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-2 pr-2 text-slate-400 whitespace-nowrap">{timeAgo(p.created_at)}</td>
                        <td className="py-2 pr-2 font-bold">{p.rainfall_mm}</td>
                        <td className="py-2 pr-2 font-bold">{p.river_level_m}</td>
                        <td className="py-2 pr-2">{p.soil_moisture_pct}%</td>
                        <td className="py-2 pr-2">{p.temperature_c}°</td>
                        <td className="py-2 pr-2">{p.elevation_m}m</td>
                        <td className="py-2 pr-2 capitalize text-slate-400">{p.drainage}</td>
                        <td className="py-2 pr-2 font-black" style={{ color: RISK_COLORS[p.risk_category] }}>{Number(p.risk_score).toFixed(1)}</td>
                        <td className="py-2 pr-2"><RiskBadge level={p.risk_category} size="sm" /></td>
                        <td className="py-2"><button onClick={() => del(p.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                    {!preds.length && <tr><td colSpan={10} className="py-8 text-center text-slate-500">No predictions yet — run the predictor to populate this ledger.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
    </div>
  );
}
