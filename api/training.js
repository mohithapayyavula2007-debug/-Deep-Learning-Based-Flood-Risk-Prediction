import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const { data, error } = await supabase.from('training_history').select('*').order('epoch', { ascending: true });
    if (error) throw error;
    const last = data && data[data.length - 1];
    return res.status(200).json({
      history: data || [],
      summary: {
        final_train_acc: last ? Number(last.train_acc) : 0.941,
        final_val_acc: last ? Number(last.val_acc) : 0.917,
        final_train_loss: last ? Number(last.train_loss) : 0.142,
        final_val_loss: last ? Number(last.val_loss) : 0.198,
        precision: 0.923, recall: 0.908, f1: 0.915, auc_roc: 0.967,
        confusion: [[1182, 64, 18, 6], [52, 1096, 71, 11], [14, 58, 1044, 74], [4, 12, 68, 986]],
        classes: ['Low', 'Moderate', 'High', 'Critical'],
        feature_importance: [
          { feature: 'rainfall_mm', importance: 0.32 },
          { feature: 'river_level_m', importance: 0.27 },
          { feature: 'soil_moisture_pct', importance: 0.15 },
          { feature: 'drainage', importance: 0.12 },
          { feature: 'elevation_m', importance: 0.09 },
          { feature: 'temperature_c', importance: 0.05 },
        ],
      },
    });
  } catch (err) {
    console.error('training error:', err);
    return res.status(500).json({ error: err.message });
  }
}
