import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const limit = Math.min(500, Number(req.query.limit) || 120);
      const station_id = req.query.station_id;
      let q = supabase.from('readings').select('*').order('recorded_at', { ascending: false }).limit(limit);
      if (station_id) q = q.eq('station_id', station_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      if (b.simulate) {
        const { data: stations } = await supabase.from('stations').select('*').limit(50);
        const rows = (stations || []).map((s) => ({
          station_id: s.id,
          rainfall_mm: +(Math.random() * 90 + (Math.random() > 0.8 ? 60 : 0)).toFixed(1),
          river_level_m: +(2 + Math.random() * 4.5).toFixed(2),
          soil_moisture_pct: +(35 + Math.random() * 60).toFixed(1),
          temperature_c: +(18 + Math.random() * 18).toFixed(1),
          recorded_at: new Date().toISOString(),
        }));
        if (!rows.length) return res.status(400).json({ error: 'No stations to simulate' });
        const { data, error } = await supabase.from('readings').insert(rows).select();
        if (error) throw error;
        return res.status(201).json(data);
      }
      const { station_id, rainfall_mm, river_level_m, soil_moisture_pct, temperature_c } = b;
      if (!station_id) return res.status(400).json({ error: 'station_id required' });
      const { data, error } = await supabase.from('readings').insert({
        station_id: Number(station_id),
        rainfall_mm: Number(rainfall_mm) || 0, river_level_m: Number(river_level_m) || 0,
        soil_moisture_pct: Number(soil_moisture_pct) || 0, temperature_c: Number(temperature_c) || 25,
        recorded_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('readings').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('readings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
