import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const results = await Promise.all([
      supabase.from('stations').select('*'),
      supabase.from('readings').select('*').order('recorded_at', { ascending: false }).limit(200),
      supabase.from('zones').select('*'),
      supabase.from('alerts').select('*').eq('active', true),
      supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('flood_events').select('*'),
      supabase.from('training_history').select('*').order('epoch', { ascending: true }),
    ]);
    const [st, rd, zn, al, pr, ev, tr] = results;
    const stations = st.data || [];
    const readings = rd.data || [];
    const zones = zn.data || [];
    const alerts = al.data || [];
    const predictions = pr.data || [];
    const events = ev.data || [];
    const training = tr.data || [];
    const online = stations.filter((s) => s.status === 'online').length;
    const avgRain = readings.length ? readings.reduce((a, r) => a + Number(r.rainfall_mm), 0) / readings.length : 0;
    const maxRiver = readings.length ? Math.max(...readings.map((r) => Number(r.river_level_m))) : 0;
    const dist = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    predictions.forEach((p) => { if (dist[p.risk_category] !== undefined) dist[p.risk_category]++; });
    const zoneDist = { Low: 0, Moderate: 0, High: 0, Critical: 0 };
    zones.forEach((z) => { if (zoneDist[z.risk_level] !== undefined) zoneDist[z.risk_level]++; });
    const totalDamage = events.reduce((a, e) => a + Number(e.damage_usd_m || 0), 0);
    return res.status(200).json({
      stations_total: stations.length, stations_online: online,
      active_alerts: alerts.length, zones_total: zones.length,
      critical_zones: zones.filter((z) => z.risk_level === 'Critical').length,
      predictions_total: predictions.length,
      avg_rainfall_24h: +avgRain.toFixed(1), max_river_level: +maxRiver.toFixed(2),
      total_damage_usd_m: +totalDamage.toFixed(1),
      prediction_distribution: dist, zone_distribution: zoneDist,
      latest_readings: readings.slice(0, 8),
      training_epochs: training.length,
    });
  } catch (err) {
    console.error('overview error:', err);
    return res.status(500).json({ error: err.message });
  }
}
