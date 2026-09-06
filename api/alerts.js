import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('alerts').select('*').order('issued_at', { ascending: false }).limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { zone_name, severity, message } = req.body || {};
      if (!zone_name || !message) return res.status(400).json({ error: 'zone_name and message required' });
      const { data, error } = await supabase.from('alerts').insert({
        zone_name, severity: severity || 'High', message,
        issued_at: new Date().toISOString(), active: true,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, active } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('alerts').update({ active: active ?? false }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('alerts error:', err);
    return res.status(500).json({ error: err.message });
  }
}
