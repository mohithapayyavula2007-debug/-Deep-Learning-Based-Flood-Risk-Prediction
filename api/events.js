import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('flood_events').select('*').order('event_date', { ascending: false }).limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.location) return res.status(400).json({ error: 'location required' });
      const { data, error } = await supabase.from('flood_events').insert({
        location: b.location, event_date: b.event_date || new Date().toISOString().slice(0, 10),
        severity: b.severity || 'Moderate', rainfall_mm: Number(b.rainfall_mm) || 0,
        river_level_m: Number(b.river_level_m) || 0, damage_usd_m: Number(b.damage_usd_m) || 0,
        deaths: Number(b.deaths) || 0, description: b.description || '',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('flood_events').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('events error:', err);
    return res.status(500).json({ error: err.message });
  }
}
