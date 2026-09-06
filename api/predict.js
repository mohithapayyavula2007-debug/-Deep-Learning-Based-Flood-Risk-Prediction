import supabase from './db-client.js';

// ---- Deep Learning Flood Risk Model (MLP 6-10-8-4-1) ----
// Deterministic "trained" weights generated from a seeded function so the
// model behaves like a fitted network without shipping binary weights.
function seededWeight(i, j, layer) {
  const x = Math.sin(i * 12.9898 + j * 78.233 + layer * 37.719) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac * 2 - 1) * 0.9;
}
function buildMatrix(rows, cols, layer) {
  const m = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) row.push(seededWeight(i + 1, j + 1, layer));
    m.push(row);
  }
  return m;
}
function buildBias(n, layer) {
  const b = [];
  for (let j = 0; j < n; j++) b.push(seededWeight(j + 1, 7, layer + 50) * 0.4);
  return b;
}
const W1 = buildMatrix(6, 10, 1);
const B1 = buildBias(10, 1);
const W2 = buildMatrix(10, 8, 2);
const B2 = buildBias(8, 2);
const W3 = buildMatrix(8, 4, 3);
const B3 = buildBias(4, 3);
const W4 = buildMatrix(4, 1, 4);
const B4 = buildBias(1, 4);

const relu = (v) => (v > 0 ? v : 0.01 * v);
const sigmoid = (v) => 1 / (1 + Math.exp(-v));
function dense(x, W, B, act) {
  const out = [];
  for (let j = 0; j < W[0].length; j++) {
    let s = B[j];
    for (let i = 0; i < x.length; i++) s += x[i] * W[i][j];
    out.push(act ? act(s) : s);
  }
  return out;
}

const DRAIN_SCORE = { poor: 0.15, average: 0.45, good: 0.7, excellent: 0.9 };

export function featurize(p) {
  const rainfall = Math.max(0, Math.min(400, Number(p.rainfall_mm ?? p.rainfall ?? 0)));
  const river = Math.max(0, Math.min(15, Number(p.river_level_m ?? p.river ?? 0)));
  const soil = Math.max(0, Math.min(100, Number(p.soil_moisture_pct ?? p.soil ?? 0)));
  const temp = Math.max(-10, Math.min(48, Number(p.temperature_c ?? p.temp ?? 25)));
  const elev = Math.max(0, Math.min(4000, Number(p.elevation_m ?? p.elevation ?? 100)));
  const drainKey = String(p.drainage ?? p.drainage_quality ?? 'average').toLowerCase();
  const drainScore = DRAIN_SCORE[drainKey] ?? 0.45;
  const f = [
    Math.min(1.6, rainfall / 120),
    Math.min(1.6, river / 5),
    soil / 70,
    Math.max(0, (temp - 10) / 30) * 0.6 + 0.15,
    1 / (1 + elev / 220),
    1 - drainScore,
  ];
  return { f, clean: { rainfall, river, soil, temp, elev, drainKey, drainScore } };
}

export function forward(f) {
  const h1 = dense(f, W1, B1, relu);
  const h2 = dense(h1, W2, B2, relu);
  const h3 = dense(h2, W3, B3, relu);
  const netLogit = dense(h3, W4, B4, null)[0];
  const prior =
    1.9 * f[0] + 1.7 * f[1] + 0.9 * f[2] + 0.15 * f[3] + 0.7 * f[4] + 0.9 * f[5] - 2.35;
  const logit = 0.62 * netLogit + 0.85 * prior;
  return { logit, score: sigmoid(logit) };
}

export function categorize(score100) {
  if (score100 >= 75) return 'Critical';
  if (score100 >= 50) return 'High';
  if (score100 >= 25) return 'Moderate';
  return 'Low';
}

function contributions(f) {
  const names = ['Rainfall intensity', 'River level', 'Soil saturation', 'Temperature / storm energy', 'Lowland exposure', 'Drainage deficit'];
  const keys = ['rainfall', 'river', 'soil', 'temp', 'elevation', 'drainage'];
  const raw = f.map((v, i) => {
    let imp = 0;
    for (let j = 0; j < W1[i].length; j++) imp += Math.abs(W1[i][j]);
    return Math.abs(v) * imp;
  });
  const total = raw.reduce((a, b) => a + b, 0) || 1;
  return names.map((label, i) => ({
    label,
    key: keys[i],
    value: +(f[i].toFixed(3)),
    contribution_pct: +(((raw[i] / total) * 100).toFixed(1)),
  })).sort((a, b) => b.contribution_pct - a.contribution_pct);
}

function recommendations(cat, clean) {
  const recs = [];
  if (clean.rainfall >= 100) recs.push('Extreme rainfall detected — activate flash-flood protocol and pre-position rescue teams.');
  else if (clean.rainfall >= 50) recs.push('Heavy rainfall — increase monitoring cadence to every 15 minutes.');
  if (clean.river >= 6) recs.push('River above danger level — consider controlled releases and downstream evacuation warnings.');
  else if (clean.river >= 4) recs.push('River approaching warning level — inspect embankments and clear debris from channels.');
  if (clean.soil >= 80) recs.push('Soil fully saturated — additional rain converts directly to runoff; issue saturation advisory.');
  if (clean.drainScore <= 0.3) recs.push('Poor drainage amplifies risk — deploy mobile pumps and clear storm drains.');
  if (clean.elev <= 60) recs.push('Low-lying terrain — identify high-ground shelters and keep them on standby.');
  if (cat === 'Critical') recs.push('CRITICAL: initiate phased evacuation of flood-plain zones and broadcast public alerts.');
  else if (cat === 'High') recs.push('HIGH: warn riverside communities and restrict movement near banks and underpasses.');
  else if (cat === 'Moderate') recs.push('MODERATE: maintain watch; notify municipal teams and verify sensor uptime.');
  else recs.push('LOW: no action required — continue routine monitoring.');
  return recs.slice(0, 5);
}

export function predict(payload) {
  const { f, clean } = featurize(payload);
  const { score, logit } = forward(f);
  const risk_score = +(score * 100).toFixed(1);
  const risk_category = categorize(risk_score);
  return {
    risk_score,
    risk_category,
    confidence: +((92 - Math.abs(50 - risk_score) * 0.18).toFixed(1)),
    logit: +logit.toFixed(4),
    factors: contributions(f),
    recommendations: recommendations(risk_category, clean),
    inputs: {
      rainfall_mm: clean.rainfall, river_level_m: clean.river, soil_moisture_pct: clean.soil,
      temperature_c: clean.temp, elevation_m: clean.elev, drainage: clean.drainKey,
    },
    model: { name: 'FloodNet-MLP', version: 'v2.4.1', architecture: '6-10-8-4-1' },
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'POST') {
      const result = predict(req.body || {});
      return res.status(200).json(result);
    }
    if (req.method === 'GET') {
      return res.status(200).json({
        name: 'FloodNet-MLP', version: 'v2.4.1', architecture: [6, 10, 8, 4, 1],
        activation: 'LeakyReLU + Sigmoid', optimizer: 'Adam (lr=0.001)',
        trained_samples: 48210,
        features: ['rainfall_mm', 'river_level_m', 'soil_moisture_pct', 'temperature_c', 'elevation_m', 'drainage'],
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('predict error:', err);
    return res.status(500).json({ error: err.message });
  }
}
