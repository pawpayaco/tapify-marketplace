// pages/api/retailers/create.js
// POST - Create a prospective retailer from onboarding "Add store"

import { requireSession, AuthError } from '../../../lib/api-auth';
import { supabaseAdmin } from '../../../lib/supabase';
import { logEvent } from '../../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
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

  let actor = null;

  try {
    const { user } = await requireSession(req, res);
    actor = user;
  } catch (authError) {
    if (authError instanceof AuthError && (authError.status === 401 || authError.status === 403)) {
      console.log('[retailers/create] No session detected, continuing with public onboarding context');
    } else {
      throw authError;
    }
  }

  try {

    // Insert new retailer
    const { data: retailer, error: retailerError } = await supabaseAdmin
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
        created_at: new Date().toISOString(),
        created_by_user_id: actor?.id || null,
      })
      .select('id, name, address, location, email, phone, store_phone')
      .single();

    if (retailerError) {
      console.error('[retailers/create] Retailer insert error:', retailerError);
      throw new Error(retailerError.message);
    }

    console.log('[retailers/create] Created retailer:', retailer.id, retailer.name);

    // Create outreach row for tracking (not yet registered)
    const { error: outreachError } = await supabaseAdmin
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

    if (actor?.id) {
      await logEvent(actor.id, 'retailer_created', {
        retailer_id: retailer.id,
        source,
      });
    }

    return res.status(200).json({ ok: true, retailer });
    
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[retailers/create] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create retailer' });
  }
}
