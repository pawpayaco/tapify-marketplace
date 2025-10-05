// pages/api/submit-vendor.js
import { requireSession, AuthError } from '../../lib/api-auth';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  const {
    name,
    email,
    storeType,
    websiteUrl,
    platformUrl,
    fulfillmentSpeed,
    inventoryCap,
    productPhotoUrl,
    collectionName,
    sourcedBy,
  } = req.body;

  if (!name || !platformUrl || !collectionName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const { user } = await requireSession(req, res);

    const payload = {
      name,
      email,
      store_type: storeType,
      website_url: websiteUrl,
      platform_url: platformUrl,
      fulfillment_speed: fulfillmentSpeed,
      inventory_cap: inventoryCap,
      product_photo_url: productPhotoUrl,
      collection_name: collectionName,
      onboarded_by: sourcedBy || null,
      submitted_by_user_id: user.id,
    };

    const { data, error } = await supabaseAdmin
      .from('vendors')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error('[submit-vendor] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to submit vendor.' });
    }

    await logEvent(user.id, 'vendor_submitted', {
      vendor_id: data?.id,
      store_type: storeType,
    });

    return res.status(200).json({ success: true, vendor: data });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[submit-vendor] API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
