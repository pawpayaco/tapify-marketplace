// pages/api/admin/add-owner.js
// POST - Admin adds owner info for outreach (does NOT create auth user)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[add-owner] Missing SUPABASE env vars');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    retailer_id, 
    owner_name, 
    owner_email, 
    owner_phone, 
    notes = '' 
  } = req.body;

  console.log('[add-owner] Request:', { retailer_id, owner_email, owner_name });

  if (!retailer_id || !owner_email) {
    return res.status(400).json({ 
      error: 'retailer_id and owner_email are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(owner_email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // 1. Update the retailers table with owner info for easy access
    const { error: updateRetailerError } = await supabase
      .from('retailers')
      .update({
        owner_name: owner_name || null,
        email: owner_email, // Store owner email in retailer record
        phone: owner_phone || null // Store owner phone in retailer record
      })
      .eq('id', retailer_id);

    if (updateRetailerError) {
      console.error('[add-owner] Retailer update error:', updateRetailerError);
      // Don't fail - continue to add to retailer_owners table
    } else {
      console.log('[add-owner] Updated retailer record with owner info');
    }

    // 2. Insert or update owner record in retailer_owners table using upsert
    const { data: ownerData, error: ownerError } = await supabase
      .from('retailer_owners')
      .upsert({
        retailer_id,
        owner_name: owner_name || null,
        owner_phone: owner_phone || null,
        owner_email,
        collected_by: 'admin',
        collected_at: new Date().toISOString(),
        notes: notes || null
      }, {
        onConflict: 'retailer_id,owner_email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (ownerError) {
      console.error('[add-owner] Owner insert error:', ownerError);
      throw new Error(ownerError.message);
    }

    console.log('[add-owner] Owner added to retailer_owners:', ownerData);

    // Create outreach tracking record
    const { error: outreachError } = await supabase
      .from('retailer_outreach')
      .insert({
        retailer_id,
        campaign: 'admin-added',
        channel: 'admin',
        registered: false,
        created_at: new Date().toISOString(),
        notes: `Admin added owner: ${owner_email}`
      });

    // Log outreach error but don't fail the request (outreach is just tracking)
    if (outreachError) {
      console.warn('[add-owner] Outreach insert warning (non-critical):', outreachError.message);
    }

    console.log('[add-owner] Success for retailer:', retailer_id);

    return res.status(200).json({ 
      ok: true,
      message: 'Owner information added successfully',
      owner: ownerData
    });
    
  } catch (err) {
    console.error('[add-owner] Error:', err);
    return res.status(500).json({ 
      error: err.message || 'Failed to add owner information' 
    });
  }
}

