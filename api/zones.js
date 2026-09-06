import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('zones').select('*').order('risk_score', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { name, region, population, elevation_m, risk_level, risk_score } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Zone name required' });
      const { data, error } = await supabase.from('zones').insert({
        name, region: region || 'Unknown basin', population: Number(population) || 0,
        elevation_m: Number(elevation_m) || 0, risk_level: risk_level || 'Moderate',
        risk_score: Number(risk_score) || 0, updated_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('zones').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('zones').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('zones error:', err);
    return res.status(500).json({ error: err.message });
  }
}
