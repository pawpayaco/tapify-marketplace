import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { adminSecret } = req.query;
  if (adminSecret !== '123abc123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if vendor already exists
    const { data: existing } = await supabaseAdmin
      .from('vendors')
      .select('id, name')
      .eq('name', 'Pawpaya')
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        message: 'Vendor already exists',
        vendor: existing
      });
    }

    // Create vendor
    const { data, error } = await supabaseAdmin
      .from('vendors')
      .insert({
        name: 'Pawpaya',
        email: 'vendors@pawpayaco.com',
      })
      .select()
      .single();

    if (error) {
      console.error('[create-pawpaya-vendor] Error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Vendor created successfully',
      vendor: data
    });
  } catch (error) {
    console.error('[create-pawpaya-vendor] Unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
