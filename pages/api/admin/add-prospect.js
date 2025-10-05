// pages/api/admin/add-prospect.js
// POST - Admin adds a prospect store to the outreach list

import { requireAdmin, AuthError } from '../../../lib/api-auth';
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
    storeName,
    address,
    ownerName,
    ownerEmail,
    ownerPhone,
    storePhone,
    storeWebsite,
    notes,
    source = 'admin-prospect'
  } = req.body;

  console.log('[add-prospect] Request:', { storeName, ownerEmail });

  if (!storeName) {
    return res.status(400).json({ error: 'Store name is required' });
  }

  // Validate email if provided
  if (ownerEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  try {
    const { user } = await requireAdmin(req, res);

    // Create retailer record
    const { data: retailer, error: retailerError } = await supabaseAdmin
      .from('retailers')
      .insert({
        name: storeName,
        address: address || null,
        location: address || null,
        email: ownerEmail || null,
        owner_name: ownerName || null,
        phone: ownerPhone || null,
        store_phone: storePhone || null,
        store_website: storeWebsite || null,
        source,
        converted: false,
        created_at: new Date().toISOString()
      })
      .select('id, name, address, email, owner_name')
      .single();

    if (retailerError) {
      console.error('[add-prospect] Retailer insert error:', retailerError);
      throw new Error(retailerError.message);
    }

    console.log('[add-prospect] Created retailer:', retailer.id);

    // Create retailer_owners record if owner info provided
    if (ownerEmail) {
      const { error: ownerError } = await supabaseAdmin
        .from('retailer_owners')
        .insert({
          retailer_id: retailer.id,
          owner_name: ownerName || null,
          owner_phone: ownerPhone || null,
          owner_email: ownerEmail,
          collected_by: 'admin',
          collected_at: new Date().toISOString(),
          notes: notes || null
        });

      if (ownerError) {
        console.warn('[add-prospect] Owner insert warning:', ownerError.message);
      }
    }

    // Create outreach tracking record
    const { error: outreachError } = await supabaseAdmin
      .from('retailer_outreach')
      .insert({
        retailer_id: retailer.id,
        campaign: 'admin-prospect',
        channel: 'admin',
        registered: false,
        created_at: new Date().toISOString(),
        notes: notes || `Prospect added by admin: ${storeName}`
      });

    if (outreachError) {
      console.warn('[add-prospect] Outreach insert warning:', outreachError.message);
    }

    console.log('[add-prospect] Success for retailer:', retailer.id);

    await logEvent(user.id, 'admin_add_prospect', {
      retailer_id: retailer.id,
      email: ownerEmail,
    });

    return res.status(200).json({ 
      ok: true,
      message: 'Prospect added successfully',
      retailer
    });
    
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[add-prospect] Error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to add prospect' 
    });
  }
}
