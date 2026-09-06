import { useEffect, useState } from 'react';
import { Radio, Plus, Trash2, RefreshCw, MapPin } from 'lucide-react';
import { apiGet, apiSend, timeAgo } from '../lib/api';
import { Card, SectionTitle } from '../components/ui';

const EMPTY = { name: '', river: '', latitude: '', longitude: '', elevation_m: '', status: 'online', drainage: 'average' };

export default function Stations() {
  const [stations, setStations] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [simBusy, setSimBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true); setErr('');
      const [s, r] = await Promise.all([apiGet('/api/stations'), apiGet('/api/readings?limit=60')]);
      setStations(s); setReadings(r);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const latestFor = (id: number) => readings.find((r) => r.station_id === id);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMsg('');
      await apiSend('/api/stations', 'POST', { ...form, latitude: Number(form.latitude) || 0, longitude: Number(form.longitude) || 0, elevation_m: Number(form.elevation_m) || 0 });
      setForm(EMPTY); setMsg('Station deployed ✓'); load();
    } catch (e: any) { setMsg(e.message); }
  };
  const simulate = async () => {
    try { setSimBusy(true); await apiSend('/api/readings', 'POST', { simulate: true }); setMsg('Live sweep ingested — fresh readings streamed ✓'); load(); }
    catch (e: any) { setMsg(e.message); } finally { setSimBusy(false); }
  };
  const del = async (id: number) => { if (!confirm('Remove this station?')) return; await apiSend('/api/stations', 'DELETE', { id }); load(); };
  const cycle = async (s: any) => {
    const next = s.status === 'online' ? 'warning' : s.status === 'warning' ? 'offline' : 'online';
    await apiSend('/api/stations', 'PUT', { id: s.id, status: next }); load();
  };

  return (
    <div>
      <SectionTitle kicker="TELEMETRY MESH" title="Sensor Network" sub="River gauges, rain collectors and soil probes streaming into the prediction engine. Trigger a live sweep to simulate the next telemetry burst." />
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={simulate} disabled={simBusy} className="flex items-center gap-2 text-xs font-black px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${simBusy ? 'animate-spin' : ''}`} />{simBusy ? 'Streaming…' : 'Simulate live sensor sweep'}
        </button>
        <button onClick={load} className="text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5">Refresh</button>
        {msg && <span className="text-xs font-semibold text-cyan-300 self-center">{msg}</span>}
      </div>
      {loading ? <div className="py-20 text-center"><div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" /></div>
        : err ? <p className="text-red-300 font-semibold">{err}</p> : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {stations.map((s) => {
              const r = latestFor(s.id);
              return (
                <Card key={s.id} className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center"><Radio className="w-5 h-5" /></div>
                      <div><p className="font-black text-sm">{s.name}</p><p className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{s.river}</p></div>
                    </div>
                    <button onClick={() => cycle(s)} title="Cycle status" className={`text-[11px] font-black px-2.5 py-1 rounded-full ${s.status === 'online' ? 'bg-emerald-500/15 text-emerald-300' : s.status === 'warning' ? 'bg-yellow-500/15 text-yellow-300' : 'bg-red-500/15 text-red-300'}`}>{s.status}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                    {[['Rain', r ? `${r.rainfall_mm} mm` : '—', '#22d3ee'], ['River', r ? `${r.river_level_m} m` : '—', '#60a5fa'], ['Soil', r ? `${r.soil_moisture_pct}%` : '—', '#a78bfa'], ['Temp', r ? `${r.temperature_c}C` : '—', '#f472b6']].map(([l, v, c]) => (
                      <div key={l} className="rounded-xl bg-white/[0.03] border border-white/[0.06] py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{l}</p>
                        <p className="text-sm font-black" style={{ color: c as string }}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                    <span>Elev {s.elevation_m} m · {s.drainage} drainage</span>
                    <span>{r ? timeAgo(r.recorded_at) : 'no data'}</span>
                  </div>
                  <button onClick={() => del(s.id)} className="absolute top-3 right-3 mt-9 text-slate-600 hover:text-red-400" title="Remove"><Trash2 className="w-4 h-4" /></button>
                </Card>
              );
            })}
          </div>
        )}
      <Card className="mt-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-400" /> Deploy new station</h3>
        <form onSubmit={add} className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[['name', 'Station name *'], ['river', 'River'], ['latitude', 'Latitude'], ['longitude', 'Longitude'], ['elevation_m', 'Elevation (m)']].map(([k, ph]) => (
            <input key={k} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph} required={k === 'name'}
              className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
          ))}
          <select value={form.drainage} onChange={(e) => setForm({ ...form, drainage: e.target.value })} className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 outline-none focus:border-cyan-400 text-slate-200">
            {['poor', 'average', 'good', 'excellent'].map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
          </select>
          <button className="sm:col-span-3 lg:col-span-1 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-sm font-black py-2.5 hover:bg-cyan-500/30">Deploy station</button>
        </form>
      </Card>
    </div>
  );
}
