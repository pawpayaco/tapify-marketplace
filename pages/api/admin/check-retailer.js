import { supabaseAdmin } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  const { retailerId, userId, adminSecret } = req.query;

  if (adminSecret !== '123abc123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin not configured' });
  }

  try {
    // Check specific retailer
    if (retailerId) {
      const { data, error } = await supabaseAdmin
        .from('retailers')
        .select('id, name, email, created_by_user_id')
        .eq('id', retailerId)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ retailer: data });
    }

    // Check retailers for a user
    if (userId) {
      const { data, error } = await supabaseAdmin
        .from('retailers')
        .select('id, name, email, created_by_user_id')
        .eq('created_by_user_id', userId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ retailers: data, count: data?.length || 0 });
    }

    return res.status(400).json({ error: 'Provide retailerId or userId' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
