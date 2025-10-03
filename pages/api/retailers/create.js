// pages/api/retailers/create.js
// POST - Create a prospective retailer from onboarding "Add store"

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[retailers/create] Missing SUPABASE env vars');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    name, 
    address = null, 
    place_id = null, 
    phone = null, 
    email = null, 
    source = 'onboard' 
  } = req.body;

  console.log('[retailers/create] Request:', { name, address, phone, email });

  if (!name) {
    return res.status(400).json({ error: 'Store name is required' });
  }

  try {
    // Insert new retailer
    const { data: retailer, error: retailerError } = await supabase
      .from('retailers')
      .insert({
        name,
        address: address || null,
        location: address || null,
        place_id: place_id || null,
        store_phone: phone || null,
        phone: phone || null,
        email: email || null,
        source,
        created_at: new Date().toISOString()
      })
      .select('id, name, address, location, email, phone, store_phone')
      .single();

    if (retailerError) {
      console.error('[retailers/create] Retailer insert error:', retailerError);
      throw new Error(retailerError.message);
    }

    console.log('[retailers/create] Created retailer:', retailer.id, retailer.name);

    // Create outreach row for tracking (not yet registered)
    const { error: outreachError } = await supabase
      .from('retailer_outreach')
      .insert({
        retailer_id: retailer.id,
        campaign: 'onboard-created',
        channel: 'onboard',
        registered: false,
        created_at: new Date().toISOString(),
        notes: `Created via public onboard: ${name}`
      });

    // Log outreach error but don't fail the request (it's just tracking)
    if (outreachError) {
      console.warn('[retailers/create] Outreach insert warning:', outreachError.message);
    }

    return res.status(200).json({ ok: true, retailer });
    
  } catch (err) {
    console.error('[retailers/create] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create retailer' });
  }
}

