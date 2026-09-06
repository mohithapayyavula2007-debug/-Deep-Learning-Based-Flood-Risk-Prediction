import { useEffect, useState } from 'react';
import { Radio, Siren, MapPinned, BrainCircuit, Droplets, Waves, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiGet, timeAgo, RISK_COLORS } from '../lib/api';
import { Card, SectionTitle, StatCard, RiskBadge, BarRow } from '../components/ui';
import { TrendChart, Donut } from '../components/Charts';

export default function Dashboard() {
  const [ov, setOv] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [preds, setPreds] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [o, z, a, p, s] = await Promise.all([
        apiGet('/api/overview'), apiGet('/api/zones'), apiGet('/api/alerts'),
        apiGet('/api/predictions?limit=8'), apiGet('/api/stations'),
      ]);
      setOv(o); setZones(z); setAlerts(a.filter((x: any) => x.active).slice(0, 5));
      setPreds(p); setStations(s);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="py-24 text-center"><div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" /><p className="text-sm text-slate-400 mt-4">Loading command center…</p></div>;
  if (err) return <div className="py-16 text-center"><p className="text-red-300 font-semibold">Failed to load: {err}</p><button onClick={load} className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-200 text-sm font-bold">Retry</button></div>;

  const rainSeries = (ov?.latest_readings || []).slice().reverse().map((r: any) => Number(r.rainfall_mm));
  const riverSeries = (ov?.latest_readings || []).slice().reverse().map((r: any) => Number(r.river_level_m));

  return (
    <div>
      <SectionTitle kicker="LIVE FLOOD COMMAND CENTER" title="Deep Learning Flood Risk Prediction" sub="FloodNet-MLP fuses live river sensors, rainfall radar and terrain data to score flood risk in real time across every monitored basin." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg flood risk" value={`${preds.length ? (preds.reduce((a: number, p: any) => a + Number(p.risk_score), 0) / preds.length).toFixed(1) : '—'}`} sub={`${ov?.predictions_total || 0} model runs`} icon={<BrainCircuit className="w-5 h-5" />} accent="#22d3ee" />
        <StatCard label="Active alerts" value={String(ov?.active_alerts ?? 0)} sub={`${ov?.critical_zones ?? 0} critical zones`} icon={<Siren className="w-5 h-5" />} accent="#ef4444" />
        <StatCard label="Sensors online" value={`${ov?.stations_online ?? 0}/${ov?.stations_total ?? 0}`} sub={`Peak river ${ov?.max_river_level ?? 0} m`} icon={<Radio className="w-5 h-5" />} accent="#22c55e" />
        <StatCard label="Rain (24h avg)" value={`${ov?.avg_rainfall_24h ?? 0} mm`} sub={`Est. damage $${ov?.total_damage_usd_m ?? 0}M logged`} icon={<Droplets className="w-5 h-5" />} accent="#818cf8" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" /> Live hydrology — latest sensor sweep</h3>
              <Link to="/stations" className="text-xs font-bold text-cyan-300 hover:text-cyan-100">Open network →</Link>
            </div>
            <TrendChart series={rainSeries} color="#22d3ee" height={130} />
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rainfall (mm)</p>
                <p className="text-lg font-black text-cyan-300">{rainSeries.length ? Math.max(...rainSeries).toFixed(1) : '—'} <span className="text-xs font-medium text-slate-500">peak</span></p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">River level (m)</p>
                <p className="text-lg font-black text-blue-300">{riverSeries.length ? Math.max(...riverSeries).toFixed(2) : '—'} <span className="text-xs font-medium text-slate-500">peak</span></p>
              </div>
            </div>
          </Card>
        </div>
        <Card>
          <h3 className="font-bold mb-3">Prediction mix</h3>
          <Donut parts={['Low', 'Moderate', 'High', 'Critical'].map((k) => ({ label: k, value: ov?.prediction_distribution?.[k] || 0, color: RISK_COLORS[k] }))} />
          <Link to="/predict" className="mt-4 block text-center text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 hover:opacity-90">Run new prediction</Link>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2"><MapPinned className="w-4 h-4 text-orange-400" /> Highest-risk zones</h3>
            <Link to="/zones" className="text-xs font-bold text-cyan-300">All zones →</Link>
          </div>
          <div className="space-y-3">
            {zones.slice(0, 5).map((z: any) => (
              <div key={z.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold truncate">{z.name}</p>
                    <RiskBadge level={z.risk_level} size="sm" />
                  </div>
                  <BarRow label={`${z.region} · pop ${Number(z.population).toLocaleString()}`} pct={Number(z.risk_score)} color={RISK_COLORS[z.risk_level] || '#22d3ee'} />
                </div>
              </div>
            ))}
            {!zones.length && <p className="text-xs text-slate-500">No zones yet.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold mb-3 flex items-center gap-2"><Siren className="w-4 h-4 text-red-400" /> Active alerts</h3>
          <div className="space-y-2.5">
            {alerts.map((a: any) => (
              <div key={a.id} className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">{a.zone_name}</p>
                  <RiskBadge level={a.severity} size="sm" />
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{a.message}</p>
                <p className="text-[11px] text-slate-500 mt-1">{timeAgo(a.issued_at)}</p>
              </div>
            ))}
            {!alerts.length && <p className="text-xs text-slate-500">No active alerts — all basins nominal.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold flex items-center gap-2"><Waves className="w-4 h-4 text-blue-400" /> Sensor stations</h3>
          <Link to="/stations" className="text-xs font-bold text-cyan-300">Manage →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-white/10">
              <th className="py-2 pr-3">Station</th><th className="py-2 pr-3">River</th><th className="py-2 pr-3">Elev</th><th className="py-2 pr-3">Status</th><th className="py-2">Latest reading</th>
            </tr></thead>
            <tbody>
              {stations.slice(0, 6).map((s: any) => {
                const r = (ov?.latest_readings || []).find((x: any) => x.station_id === s.id);
                return (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-3 font-bold">{s.name}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{s.river}</td>
                    <td className="py-2.5 pr-3 text-slate-400">{s.elevation_m} m</td>
                    <td className="py-2.5 pr-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.status === 'online' ? 'bg-emerald-500/15 text-emerald-300' : s.status === 'warning' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-red-500/15 text-red-300'}`}>{s.status}</span></td>
                    <td className="py-2.5 text-xs text-slate-400">{r ? `${r.rainfall_mm} mm · ${r.river_level_m} m · ${timeAgo(r.recorded_at)}` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
