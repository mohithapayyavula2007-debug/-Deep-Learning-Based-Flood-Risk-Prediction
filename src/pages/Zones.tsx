import { useEffect, useState } from 'react';
import { MapPinned, Siren, Plus, Trash2, CheckCheck } from 'lucide-react';
import { apiGet, apiSend, timeAgo, RISK_COLORS } from '../lib/api';
import { Card, SectionTitle, RiskBadge, BarRow } from '../components/ui';

export default function Zones() {
  const [zones, setZones] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [zf, setZf] = useState({ name: '', region: '', population: '', elevation_m: '', risk_level: 'Moderate', risk_score: '45' });
  const [af, setAf] = useState({ zone_name: '', severity: 'High', message: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      setLoading(true); setErr('');
      const [z, a, e] = await Promise.all([apiGet('/api/zones'), apiGet('/api/alerts'), apiGet('/api/events')]);
      setZones(z); setAlerts(a); setEvents(e);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const addZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await apiSend('/api/zones', 'POST', { ...zf, population: Number(zf.population) || 0, elevation_m: Number(zf.elevation_m) || 0, risk_score: Number(zf.risk_score) || 0 }); setZf({ name: '', region: '', population: '', elevation_m: '', risk_level: 'Moderate', risk_score: '45' }); setMsg('Zone mapped ✓'); load(); }
    catch (e: any) { setMsg(e.message); }
  };
  const addAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await apiSend('/api/alerts', 'POST', af); setAf({ zone_name: '', severity: 'High', message: '' }); setMsg('Alert broadcast ✓'); load(); }
    catch (e: any) { setMsg(e.message); }
  };
  const resolve = async (id: number, active: boolean) => { await apiSend('/api/alerts', 'PUT', { id, active }); load(); };
  const delAlert = async (id: number) => { await apiSend('/api/alerts', 'DELETE', { id }); load(); };
  const delZone = async (id: number) => { if (!confirm('Delete zone?')) return; await apiSend('/api/zones', 'DELETE', { id }); load(); };

  return (
    <div>
      <SectionTitle kicker="EXPOSURE MAPPING" title="Zones & Alert Center" sub="Basin-level exposure scored by the deep network, live public alerts, and the historical flood-event ledger." />
      {msg && <p className="text-xs font-bold text-cyan-300 mb-3">{msg}</p>}
      {loading ? <div className="py-20 text-center"><div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" /></div>
        : err ? <p className="text-red-300 font-semibold">{err}</p> : (
          <>
            <Card className="overflow-hidden">
              <h3 className="font-bold mb-1 flex items-center gap-2"><MapPinned className="w-4 h-4 text-cyan-400" /> Basin risk schematic</h3>
              <p className="text-[11px] text-slate-500 mb-3">Bubble size reflects population · color = model risk level</p>
              <div className="relative h-56 rounded-2xl bg-gradient-to-br from-[#0a1a33] via-[#0b2140] to-[#081226] border border-cyan-500/10 overflow-hidden">
                <svg viewBox="0 0 600 220" className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
                  <path d="M-20,150 C120,120 200,180 320,140 C420,105 500,150 640,110" stroke="#22d3ee" strokeOpacity="0.5" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <path d="M-20,165 C120,135 200,195 320,155 C420,120 500,165 640,125" stroke="#3b82f6" strokeOpacity="0.35" strokeWidth="16" fill="none" strokeLinecap="round" />
                </svg>
                {zones.map((z, i) => {
                  const left = 6 + ((i * 53) % 82);
                  const top = 12 + ((i * 37) % 62);
                  const size = 34 + Math.min(46, Math.sqrt(Number(z.population) || 1000) / 28);
                  return (
                    <div key={z.id} className="absolute group" style={{ left: `${left}%`, top: `${top}%` }}>
                      <div className="rounded-full border-2 flex items-center justify-center font-black text-[10px] cursor-default"
                        style={{ width: size, height: size, borderColor: RISK_COLORS[z.risk_level], background: `${RISK_COLORS[z.risk_level]}26`, color: RISK_COLORS[z.risk_level], boxShadow: `0 0 22px ${RISK_COLORS[z.risk_level]}55` }}>
                        {Number(z.risk_score).toFixed(0)}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-black/85 border border-white/10 px-2.5 py-1.5 text-[11px] font-bold">{z.name} · {z.risk_level}</div>
                      <p className="text-center text-[10px] font-bold text-slate-300 mt-1 max-w-[90px] truncate">{z.name}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {zones.map((z) => (
                <Card key={z.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="font-black">{z.name}</p><p className="text-[11px] text-slate-500">{z.region} · elev {z.elevation_m} m · pop {Number(z.population).toLocaleString()}</p></div>
                    <div className="flex items-center gap-2"><RiskBadge level={z.risk_level} size="sm" />
                      <button onClick={() => delZone(z.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div>
                  </div>
                  <div className="mt-3"><BarRow label={`Model risk score — updated ${timeAgo(z.updated_at)}`} pct={Number(z.risk_score)} color={RISK_COLORS[z.risk_level]} /></div>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <Card>
                <h3 className="font-bold mb-3 flex items-center gap-2"><Siren className="w-4 h-4 text-red-400" /> Alert center ({alerts.filter((a) => a.active).length} active)</h3>
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {alerts.map((a) => (
                    <div key={a.id} className={`rounded-xl border p-3 ${a.active ? 'border-red-500/25 bg-red-500/[0.06]' : 'border-white/10 bg-white/[0.02] opacity-70'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold">{a.zone_name}</p><RiskBadge level={a.severity} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{a.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-slate-500">{timeAgo(a.issued_at)} · {a.active ? 'broadcasting' : 'resolved'}</span>
                        <div className="flex gap-1.5">
                          {a.active && <button onClick={() => resolve(a.id, false)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" />Resolve</button>}
                          <button onClick={() => delAlert(a.id)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/5 text-slate-400">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!alerts.length && <p className="text-xs text-slate-500">No alerts issued yet.</p>}
                </div>
                <form onSubmit={addAlert} className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  <p className="text-xs font-extrabold text-slate-400 tracking-wider">BROADCAST NEW ALERT</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={af.zone_name} onChange={(e) => setAf({ ...af, zone_name: e.target.value })} required placeholder="Zone name" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-red-400 placeholder:text-slate-600" />
                    <select value={af.severity} onChange={(e) => setAf({ ...af, severity: e.target.value })} className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-slate-200 outline-none">
                      {['Low', 'Moderate', 'High', 'Critical'].map((s) => <option key={s} className="bg-slate-900">{s}</option>)}
                    </select>
                  </div>
                  <input value={af.message} onChange={(e) => setAf({ ...af, message: e.target.value })} required placeholder="Alert message…" className="w-full text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-red-400 placeholder:text-slate-600" />
                  <button className="w-full rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm font-black py-2.5 hover:bg-red-500/30">Broadcast alert</button>
                </form>
              </Card>

              <div className="space-y-4">
                <Card>
                  <h3 className="font-bold mb-3">Historical flood ledger</h3>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {events.map((e) => (
                      <div key={e.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold">{e.location}</p><RiskBadge level={e.severity} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{e.event_date} · {e.rainfall_mm} mm · river {e.river_level_m} m · ${e.damage_usd_m}M · {e.deaths} deaths</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{e.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-cyan-400" /> Map new zone</h3>
                  <form onSubmit={addZone} className="grid grid-cols-2 gap-2">
                    <input value={zf.name} onChange={(e) => setZf({ ...zf, name: e.target.value })} required placeholder="Zone name *" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <input value={zf.region} onChange={(e) => setZf({ ...zf, region: e.target.value })} placeholder="Region / basin" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <input value={zf.population} onChange={(e) => setZf({ ...zf, population: e.target.value })} placeholder="Population" type="number" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <input value={zf.elevation_m} onChange={(e) => setZf({ ...zf, elevation_m: e.target.value })} placeholder="Elevation (m)" type="number" className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <select value={zf.risk_level} onChange={(e) => setZf({ ...zf, risk_level: e.target.value })} className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-slate-200 outline-none">
                      {['Low', 'Moderate', 'High', 'Critical'].map((s) => <option key={s} className="bg-slate-900">{s}</option>)}
                    </select>
                    <input value={zf.risk_score} onChange={(e) => setZf({ ...zf, risk_score: e.target.value })} placeholder="Score 0-100" type="number" min={0} max={100} className="text-sm rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 outline-none focus:border-cyan-400 placeholder:text-slate-600" />
                    <button className="col-span-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-sm font-black py-2.5 hover:bg-cyan-500/30">Add zone</button>
                  </form>
                </Card>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
