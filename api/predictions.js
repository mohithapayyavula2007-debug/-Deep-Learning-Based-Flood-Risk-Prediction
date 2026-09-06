import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const limit = Math.min(200, Number(req.query.limit) || 60);
      const { data, error } = await supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const required = ['rainfall_mm', 'river_level_m', 'soil_moisture_pct', 'temperature_c', 'elevation_m'];
      for (const k of required) if (b[k] === undefined || b[k] === '' || b[k] === null) return res.status(400).json({ error: `${k} is required` });
      if (b.risk_score === undefined || !b.risk_category) return res.status(400).json({ error: 'risk_score and risk_category required (call /api/predict first)' });
      const { data, error } = await supabase.from('predictions').insert({
        rainfall_mm: Number(b.rainfall_mm), river_level_m: Number(b.river_level_m),
        soil_moisture_pct: Number(b.soil_moisture_pct), temperature_c: Number(b.temperature_c),
        elevation_m: Number(b.elevation_m), drainage: b.drainage || 'average',
        risk_score: Number(b.risk_score), risk_category: b.risk_category,
        created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id, all } = req.body || {};
      if (all) {
        const { error } = await supabase.from('predictions').delete().gt('id', 0);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('predictions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('predictions error:', err);
    return res.status(500).json({ error: err.message });
  }
}
