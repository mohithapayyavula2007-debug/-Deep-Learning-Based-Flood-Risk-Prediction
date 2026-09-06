import { useState } from 'react';
import { BrainCircuit, Save, RotateCcw, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiSend, RISK_COLORS } from '../lib/api';
import { Card, SectionTitle, Gauge, RiskBadge, BarRow } from '../components/ui';

const PRESETS: Record<string, any> = {
  'Sunny baseline': { rainfall_mm: 4, river_level_m: 1.2, soil_moisture_pct: 28, temperature_c: 24, elevation_m: 320, drainage: 'good' },
  'Monsoon watch': { rainfall_mm: 68, river_level_m: 3.8, soil_moisture_pct: 72, temperature_c: 29, elevation_m: 45, drainage: 'average' },
  'Flash-flood emergency': { rainfall_mm: 165, river_level_m: 6.9, soil_moisture_pct: 94, temperature_c: 31, elevation_m: 12, drainage: 'poor' },
  'Mountain snowmelt': { rainfall_mm: 34, river_level_m: 4.6, soil_moisture_pct: 65, temperature_c: 12, elevation_m: 1450, drainage: 'good' },
};

const FIELDS = [
  { key: 'rainfall_mm', label: 'Rainfall (mm / 24h)', min: 0, max: 300, step: 1, hint: 'Radar + gauge accumulation' },
  { key: 'river_level_m', label: 'River level (m)', min: 0, max: 12, step: 0.1, hint: 'Above local datum' },
  { key: 'soil_moisture_pct', label: 'Soil moisture (%)', min: 0, max: 100, step: 1, hint: 'Saturation at 10cm depth' },
  { key: 'temperature_c', label: 'Temperature (C)', min: -5, max: 45, step: 0.5, hint: 'Storm-energy proxy' },
  { key: 'elevation_m', label: 'Elevation (m)', min: 0, max: 2500, step: 5, hint: 'Site altitude' },
];

export default function Predictor() {
  const [form, setForm] = useState({ rainfall_mm: 68, river_level_m: 3.8, soil_moisture_pct: 72, temperature_c: 29, elevation_m: 45, drainage: 'average' });
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const [err, setErr] = useState('');

  const run = async () => {
    try {
      setBusy(true); setErr(''); setSaved('');
      const r = await apiSend('/api/predict', 'POST', form);
      setResult(r);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!result) return;
    try {
      setSaved('');
      await apiSend('/api/predictions', 'POST', { ...form, risk_score: result.risk_score, risk_category: result.risk_category });
      setSaved('Prediction logged to history ✓');
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div>
      <SectionTitle kicker="FLOODNET-MLP INFERENCE" title="Flood Risk Predictor" sub="Tune live hydrological inputs and run them through the 6-10-8-4-1 deep network. Scores update end-to-end from the backend model." />
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(PRESETS).map((k) => (
          <button key={k} onClick={() => { setForm({ ...PRESETS[k] }); setResult(null); setSaved(''); }} className="text-xs font-bold px-3.5 py-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20">{k}</button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-cyan-400" /> Hydrological inputs</h3>
          <div className="space-y-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-bold text-slate-300">{f.label}</label>
                  <span className="text-sm font-black text-cyan-200">{(form as any)[f.key]}</span>
                </div>
                <input type="range" min={f.min} max={f.max} step={f.step} value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="w-full accent-cyan-400" />
                <p className="text-[11px] text-slate-500">{f.hint}</p>
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-slate-300">Drainage quality</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['poor', 'average', 'good', 'excellent'].map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, drainage: d })}
                    className={`text-xs font-bold py-2 rounded-xl border capitalize ${form.drainage === d ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100' : 'border-white/10 text-slate-400 hover:border-cyan-500/30'}`}>{d}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={run} disabled={busy} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-black hover:opacity-90 disabled:opacity-50">
              <Zap className="w-4 h-4" />{busy ? 'Running inference…' : 'Predict flood risk'}
            </button>
            <button onClick={() => { setForm({ ...PRESETS['Sunny baseline'] }); setResult(null); }} className="px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5" title="Reset"><RotateCcw className="w-4 h-4" /></button>
          </div>
          {err && <p className="text-xs text-red-300 mt-3 font-semibold">{err}</p>}
        </Card>

        <Card>
          {!result ? (
            <div className="h-full min-h-[380px] flex flex-col items-center justify-center text-center py-10">
              <BrainCircuit className="w-12 h-12 text-slate-600 mb-4" />
              <p className="font-bold text-slate-300">No inference yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[260px]">Adjust the inputs and hit Predict flood risk — the backend neural net returns a score, factor breakdown and action plan.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex flex-col items-center">
                <Gauge score={result.risk_score} />
                <div className="mt-2"><RiskBadge level={result.risk_category} size="lg" /></div>
                <p className="text-[11px] text-slate-500 mt-2">confidence {result.confidence}% · logit {result.logit} · {result.model.name} {result.model.version}</p>
              </div>
              <div className="mt-5 space-y-2.5">
                <p className="text-xs font-extrabold tracking-wider text-slate-400">WHY THIS SCORE — FACTOR ATTRIBUTION</p>
                {result.factors.map((f: any) => (
                  <BarRow key={f.key} label={f.label} pct={f.contribution_pct} color={RISK_COLORS[result.risk_category]} />
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-xs font-extrabold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> RECOMMENDED ACTIONS</p>
                <ul className="space-y-1.5">{result.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2"><span className="text-cyan-400 font-black">▸</span>{r}</li>))}</ul>
              </div>
              <button onClick={save} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-bold text-emerald-200 hover:bg-emerald-500/20"><Save className="w-4 h-4" /> Save to prediction history</button>
              {saved && <p className="text-xs text-emerald-300 font-bold mt-2 text-center">{saved}</p>}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
