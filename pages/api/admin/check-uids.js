import { supabaseAdmin } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  const { retailerId, adminSecret } = req.query;

  if (adminSecret !== '123abc123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin not configured' });
  }

  if (!retailerId) {
    return res.status(400).json({ error: 'retailerId required' });
  }

  try {
    // Check UIDs for this retailer - simplified query
    const { data: uidsData, error: uidsError } = await supabaseAdmin
      .from('uids')
      .select(`
        *,
        business:business_id (
          id,
          name
        )
      `)
      .in('retailer_id', [retailerId])
      .limit(100);

    if (uidsError) {
      return res.status(500).json({ error: uidsError.message, details: uidsError });
    }

    return res.status(200).json({
      retailer_id: retailerId,
      uids: uidsData,
      count: uidsData?.length || 0
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
