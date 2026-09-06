import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('stations').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { name, river, latitude, longitude, elevation_m, status, drainage } = req.body || {};
      if (!name) return res.status(400).json({ error: 'Station name is required' });
      const { data, error } = await supabase.from('stations').insert({
        name, river: river || 'Unknown', latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0, elevation_m: Number(elevation_m) || 0,
        status: status || 'online', drainage: drainage || 'average',
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('stations').update(fields).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('stations').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('stations error:', err);
    return res.status(500).json({ error: err.message });
  }
}
