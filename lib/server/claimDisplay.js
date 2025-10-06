import { requireSession, AuthError } from '../api-auth.js';
import { supabaseAdmin } from '../supabase.js';
import { logEvent } from '../../utils/logger.js';

// Get env vars directly to avoid Zod validation blocking
const env = {
  NEXT_PUBLIC_SHOPIFY_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
};

export async function handleClaimRequest(req, res) {
  console.log('[claimDisplay] ========== NEW REQUEST START ==========');
  console.log('[claimDisplay] Request method:', req.method);
  console.log('[claimDisplay] Request URL:', req.url);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const method = (req.method || '').toUpperCase();

  if (method === 'OPTIONS') {
    console.log('[claimDisplay] Handling OPTIONS preflight');
    return res.status(200).end();
  }

  if (method !== 'POST') {
    console.log('[claimDisplay] ERROR: Invalid method, expected POST, got:', method);
    return res.status(405).json({ error: 'Method not allowed', receivedMethod: method });
  }

  if (!supabaseAdmin) {
    console.log('[claimDisplay] ERROR: Supabase admin client not configured');
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  console.log('[claimDisplay] Request body:', JSON.stringify(req.body, null, 2));
  const { uid, businessId: rawBusinessId, retailerId: rawRetailerId } = req.body ?? {};
  console.log('[claimDisplay] Extracted params:', { uid, rawBusinessId, rawRetailerId });

  if (!uid || (!rawBusinessId && !rawRetailerId)) {
    console.log('[claimDisplay] ERROR: Missing required parameters');
    return res.status(400).json({ error: 'uid and retailerId (or businessId) are required' });
  }

  try {
    console.log('[claimDisplay] Checking user session...');

    // Try to get user session, but don't require it
    let user = null;
    try {
      const session = await requireSession(req, res);
      user = session.user;
      console.log('[claimDisplay] User authenticated:', user?.id);
    } catch (authError) {
      console.log('[claimDisplay] No authentication, proceeding with anonymous claim');
    }

    // ✅ STEP 1: Fetch and validate UID
    const { data: uidRecord, error: uidError } = await supabaseAdmin
      .from('uids')
      .select('uid, is_claimed, affiliate_url, retailer_id')
      .eq('uid', uid)
      .maybeSingle();

    if (uidError) {
      console.error('[claimDisplay] Fetch UID error:', uidError.message);
      return res.status(500).json({ error: 'Failed to fetch UID', details: uidError.message });
    }

    if (!uidRecord) {
      console.error('[claimDisplay] UID not found:', uid);
      return res.status(404).json({ error: 'UID not found' });
    }

    if (uidRecord.is_claimed) {
      console.warn('[claimDisplay] UID already claimed:', uid, 'by retailer:', uidRecord.retailer_id);
      return res.status(409).json({
        error: 'UID already claimed',
        claimed_by: uidRecord.retailer_id
      });
    }

    // ✅ STEP 2: Resolve businessId (if provided)
    const businessId = rawBusinessId || null;
    let businessRecord = null;

    if (businessId) {
      const { data: business, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('id, name')
        .eq('id', businessId)
        .maybeSingle();

      if (businessError) {
        console.error('[claimDisplay] Business lookup error:', businessError.message);
        return res.status(500).json({ error: 'Failed to fetch business', details: businessError.message });
      }

      if (!business) {
        console.error('[claimDisplay] Business not found:', businessId);
        return res.status(404).json({ error: 'Business not found' });
      }

      businessRecord = business;
      console.log('[claimDisplay] Business found:', business.name);
    }

    // ✅ STEP 3: Resolve retailerId with fallback logic
    let retailerId = rawRetailerId || uidRecord?.retailer_id || null;
    let retailerRecord = null;

    // Try direct retailer lookup
    if (retailerId) {
      const { data: retailer, error: retailerError } = await supabaseAdmin
        .from('retailers')
        .select('id, name, email, business_id')
        .eq('id', retailerId)
        .maybeSingle();

      if (retailerError) {
        console.error('[claimDisplay] Retailer lookup error:', retailerError.message);
      } else if (retailer) {
        retailerRecord = retailer;
        console.log('[claimDisplay] Retailer found:', retailer.name);
      } else {
        console.warn('[claimDisplay] Retailer ID provided but not found:', retailerId);
        retailerId = null; // Reset so we can try other lookups
      }
    }

    // Fallback: Try to find retailer by business_id
    if (!retailerId && businessId) {
      const { data: retailer, error: retailerError } = await supabaseAdmin
        .from('retailers')
        .select('id, name, email, business_id')
        .eq('business_id', businessId)
        .maybeSingle();

      if (retailerError) {
        console.error('[claimDisplay] Retailer by business lookup error:', retailerError.message);
      } else if (retailer) {
        retailerId = retailer.id;
        retailerRecord = retailer;
        console.log('[claimDisplay] Retailer found by business_id:', retailer.name);
      }
    }

    // Fallback: Try to find retailer by user_id
    if (!retailerId && user) {
      const { data: retailer } = await supabaseAdmin
        .from('retailers')
        .select('id, name, email, business_id')
        .eq('created_by_user_id', user.id)
        .maybeSingle();

      if (retailer) {
        retailerId = retailer.id;
        retailerRecord = retailer;
        console.log('[claimDisplay] Retailer found by user_id:', retailer.name);
      }
    }

    // ✅ IMPROVED: Auto-create retailer if still not found and we have business_id
    if (!retailerId && businessId && businessRecord) {
      console.log('[claimDisplay] ⚙️ Auto-creating retailer for business:', businessRecord.name);

      const { data: newRetailer, error: createError } = await supabaseAdmin
        .from('retailers')
        .insert({
          name: businessRecord.name || 'Claimed Display',
          business_id: businessId,
          created_by_user_id: user?.id ?? null,
          source: 'uid_claim_auto',
        })
        .select('id, name, email, business_id')
        .maybeSingle();

      if (createError) {
        console.error('[claimDisplay] Failed to auto-create retailer:', createError.message);
        return res.status(500).json({
          error: 'Failed to create retailer for this business',
          details: createError.message
        });
      }

      retailerId = newRetailer.id;
      retailerRecord = newRetailer;
      console.log('[claimDisplay] ✅ Retailer auto-created:', newRetailer.id, newRetailer.name);
    }

    // Final check: If still no retailer, return error
    if (!retailerId) {
      console.error('[claimDisplay] Unable to determine retailer after all fallbacks');
      return res.status(400).json({
        error: 'Unable to determine retailer for this claim',
        hint: 'Please ensure a retailer exists for this business or provide a valid retailerId'
      });
    }

    // ✅ STEP 4: Build affiliate URL
    const defaultAffiliateUrl = env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      ? `https://${env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/collections/all?ref=${uid}`
      : null;

    const affiliateUrl = uidRecord?.affiliate_url ?? defaultAffiliateUrl;

    // ✅ STEP 5: Update UID with claim data
    const updatePayload = {
      is_claimed: true,
      claimed_at: new Date().toISOString(),
      affiliate_url: affiliateUrl,
      retailer_id: retailerId,
    };

    // Only set claimed_by_user_id if user is authenticated
    if (user) {
      updatePayload.claimed_by_user_id = user.id;
    }

    if (businessId) {
      updatePayload.business_id = businessId;
    } else if (retailerRecord?.business_id) {
      updatePayload.business_id = retailerRecord.business_id;
    }

    console.log('[claimDisplay] Update payload:', JSON.stringify(updatePayload, null, 2));

    const { error: updateError } = await supabaseAdmin
      .from('uids')
      .update(updatePayload)
      .eq('uid', uid);

    if (updateError) {
      console.error('[claimDisplay] Failed to mark UID claimed:', updateError.message);
      return res.status(500).json({ error: 'Failed to claim UID', details: updateError.message });
    }

    console.log('[claimDisplay] ✅ UID claimed successfully:', uid);

    // ✅ STEP 6: Update display status
    if (retailerId) {
      const { error: displayUpdateError } = await supabaseAdmin
        .from('displays')
        .update({ status: 'active' })
        .eq('retailer_id', retailerId)
        .in('status', ['priority_queue', 'standard_queue']);

      if (displayUpdateError) {
        console.warn('[claimDisplay] Display status update warning:', displayUpdateError.message);
      } else {
        console.log('[claimDisplay] ✅ Display(s) activated for retailer:', retailerId);
      }
    }

    // ✅ STEP 7: Update business connection status
    if (businessId) {
      const { error: businessUpdateError } = await supabaseAdmin
        .from('businesses')
        .update({
          is_connected: true,
          connected_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (businessUpdateError) {
        console.warn('[claimDisplay] Business update warning:', businessUpdateError.message);
      } else {
        console.log('[claimDisplay] ✅ Business marked as connected:', businessId);
      }
    }

    // ✅ STEP 8: Log event if user is authenticated
    if (user) {
      await logEvent(user.id, 'uid_claimed', {
        uid,
        business_id: businessId,
        retailer_id: retailerId,
        auto_created: !rawRetailerId && !retailerRecord ? true : false,
      });
    } else {
      console.log('[claimDisplay] Anonymous claim - skipping event logging');
    }

    console.log('[claimDisplay] ========== CLAIM SUCCESS ==========');
    return res.status(200).json({
      success: true,
      retailer_id: retailerId,
      retailer_name: retailerRecord?.name,
      business_id: businessId,
      affiliate_url: affiliateUrl,
    });
  } catch (error) {
    console.error('[claimDisplay] Handler error:', error);
    console.error('[claimDisplay] Stack trace:', error.stack);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
