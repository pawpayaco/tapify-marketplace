import { supabaseAdmin } from '../../../lib/supabase.js';

/**
 * ADMIN ONLY: Fix a UID that's not working properly
 *
 * This will:
 * 1. Mark the UID as claimed
 * 2. Set a valid affiliate_url if missing
 * 3. Ensure it's linked to a retailer
 *
 * Usage: POST /api/admin/fix-uid
 * Body: { uid, retailerId, adminSecret }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const adminSecret = req.headers['x-admin-secret'] || req.body?.adminSecret;
  if (adminSecret !== process.env.ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uid, retailerId } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'uid is required' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  if (!shopifyDomain) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_SHOPIFY_DOMAIN not configured' });
  }

  try {
    console.log('[fix-uid] Fixing UID:', uid);

    // Get current UID data
    const { data: currentUid, error: fetchError } = await supabaseAdmin
      .from('uids')
      .select('*, retailer:retailer_id(id, name, email)')
      .eq('uid', uid)
      .maybeSingle();

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch UID', details: fetchError.message });
    }

    if (!currentUid) {
      // UID doesn't exist - create it
      if (!retailerId) {
        return res.status(400).json({
          error: 'UID not found and no retailerId provided',
          hint: 'Provide retailerId to create a new UID',
        });
      }

      const affiliateUrl = `https://pawpayaco.com/products/custom?ref=${uid}&utm_source=nfc&utm_medium=display&utm_campaign=${uid}`;

      const { error: createError } = await supabaseAdmin
        .from('uids')
        .insert({
          uid: uid,
          retailer_id: retailerId,
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          affiliate_url: affiliateUrl,
        });

      if (createError) {
        return res.status(500).json({ error: 'Failed to create UID', details: createError.message });
      }

      console.log('[fix-uid] Created new UID:', uid);

      return res.status(200).json({
        success: true,
        action: 'created',
        uid: uid,
        retailer_id: retailerId,
        affiliate_url: affiliateUrl,
        message: 'UID created and configured successfully',
      });
    }

    // UID exists - fix it
    const updates = {};
    const changes = [];

    // Fix: is_claimed
    if (!currentUid.is_claimed) {
      updates.is_claimed = true;
      updates.claimed_at = new Date().toISOString();
      changes.push('Set is_claimed to true');
    }

    // Fix: affiliate_url
    if (!currentUid.affiliate_url || currentUid.affiliate_url.trim() === '') {
      updates.affiliate_url = `https://pawpayaco.com/products/custom?ref=${uid}&utm_source=nfc&utm_medium=display&utm_campaign=${uid}`;
      changes.push('Generated affiliate_url');
    }

    // Fix: retailer_id
    if (!currentUid.retailer_id && retailerId) {
      updates.retailer_id = retailerId;
      changes.push('Linked to retailer');
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        success: true,
        action: 'no_changes_needed',
        uid: uid,
        message: 'UID is already properly configured',
        current_data: {
          is_claimed: currentUid.is_claimed,
          affiliate_url: currentUid.affiliate_url,
          retailer_id: currentUid.retailer_id,
          retailer_name: currentUid.retailer?.name,
        },
      });
    }

    // Apply fixes
    const { error: updateError } = await supabaseAdmin
      .from('uids')
      .update(updates)
      .eq('uid', uid);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update UID', details: updateError.message });
    }

    console.log('[fix-uid] Updated UID:', uid, 'Changes:', changes);

    return res.status(200).json({
      success: true,
      action: 'updated',
      uid: uid,
      changes: changes,
      updated_fields: updates,
      message: `UID fixed successfully. Applied ${changes.length} change(s).`,
    });
  } catch (error) {
    console.error('[fix-uid] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
