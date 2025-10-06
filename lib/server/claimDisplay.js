import { requireSession, AuthError } from '../api-auth.js';
import { supabaseAdmin } from '../supabase.js';
import { env } from '../env.js';
import { logEvent } from '../../utils/logger.js';

export async function handleClaimRequest(req, res) {
  console.log('[claimDisplay] ========== NEW REQUEST START ==========');
  console.log('[claimDisplay] Request method:', req.method);
  console.log('[claimDisplay] Request URL:', req.url);
  console.log('[claimDisplay] Request headers:', JSON.stringify(req.headers, null, 2));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const method = (req.method || '').toUpperCase();
  console.log('[claimDisplay] Normalized method:', method);

  if (method === 'OPTIONS') {
    console.log('[claimDisplay] Handling OPTIONS preflight');
    return res.status(200).end();
  }

  if (method !== 'POST') {
    console.log('[claimDisplay] ERROR: Invalid method, expected POST, got:', method);
    return res.status(405).json({ error: 'Method not allowed', receivedMethod: method });
  }

  console.log('[claimDisplay] Method validation passed, proceeding with POST handler');

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
    const { user } = await requireSession(req, res);
    console.log('[claimDisplay] User authenticated:', user?.id);

    const { data: uidRecord, error: uidError } = await supabaseAdmin
      .from('uids')
      .select('id, is_claimed, affiliate_url, retailer_id')
      .eq('uid', uid)
      .maybeSingle();

    if (uidError) {
      console.error('[claim-uid] Fetch UID error:', uidError.message);
      return res.status(500).json({ error: 'Failed to fetch UID' });
    }

    if (!uidRecord) {
      return res.status(404).json({ error: 'UID not found' });
    }

    if (uidRecord.is_claimed) {
      return res.status(409).json({ error: 'UID already claimed' });
    }

    const businessId = rawBusinessId || null;
    let retailerId = rawRetailerId || uidRecord?.retailer_id || null;
    let retailerRecord = null;

    if (businessId) {
      const { data: business, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('id')
        .eq('id', businessId)
        .maybeSingle();

      if (businessError) {
        console.error('[claim-uid] Business lookup error:', businessError.message);
        return res.status(500).json({ error: 'Failed to fetch business' });
      }

      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
    }

    if (retailerId) {
      const { data: retailer, error: retailerError } = await supabaseAdmin
        .from('retailers')
        .select('id, email, business_id')
        .eq('id', retailerId)
        .maybeSingle();

      if (retailerError) {
        console.error('[claim-uid] Retailer lookup error:', retailerError.message);
        return res.status(500).json({ error: 'Failed to fetch retailer' });
      }

      if (!retailer) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      retailerRecord = retailer;
    }

    if (!retailerId && businessId) {
      const { data: retailer, error: retailerError } = await supabaseAdmin
        .from('retailers')
        .select('id, email, business_id')
        .eq('business_id', businessId)
        .maybeSingle();

      if (retailerError) {
        console.error('[claim-uid] Retailer lookup error:', retailerError.message);
        return res.status(500).json({ error: 'Failed to fetch retailer' });
      }

      retailerId = retailer?.id ?? null;
      retailerRecord = retailer;
    }

    if (!retailerId) {
      const { data: retailer } = await supabaseAdmin
        .from('retailers')
        .select('id')
        .eq('created_by_user_id', user.id)
        .maybeSingle();

      retailerId = retailer?.id ?? null;
    }

    if (!retailerId) {
      return res.status(400).json({ error: 'Unable to determine retailer for this claim' });
    }

    const defaultAffiliateUrl = env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      ? `https://${env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/collections/all?ref=${uid}`
      : null;

    const affiliateUrl = uidRecord?.affiliate_url ?? defaultAffiliateUrl;

    const updatePayload = {
      is_claimed: true,
      claimed_at: new Date().toISOString(),
      claimed_by_user_id: user.id,
      affiliate_url: affiliateUrl,
    };

    if (retailerId) {
      updatePayload.retailer_id = retailerId;
    }

    if (businessId) {
      updatePayload.business_id = businessId;
    } else if (retailerRecord?.business_id) {
      updatePayload.business_id = retailerRecord.business_id;
    }

    const { error: updateError } = await supabaseAdmin
      .from('uids')
      .update(updatePayload)
      .eq('uid', uid);

    if (updateError) {
      console.error('[claim-uid] Failed to mark UID claimed:', updateError.message);
      return res.status(500).json({ error: 'Failed to claim UID' });
    }

    if (retailerId) {
      const { error: displayUpdateError } = await supabaseAdmin
        .from('displays')
        .update({ status: 'active' })
        .eq('retailer_id', retailerId)
        .in('status', ['priority_queue', 'standard_queue']);

      if (displayUpdateError) {
        console.warn('[claim-uid] Display status update warning:', displayUpdateError.message);
      }
    }

    if (businessId) {
      const { error: businessUpdateError } = await supabaseAdmin
        .from('businesses')
        .update({
          is_connected: true,
          connected_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (businessUpdateError) {
        console.warn('[claim-uid] Business update warning:', businessUpdateError.message);
      }
    }

    await logEvent(user.id, 'uid_claimed', {
      uid,
      business_id: businessId,
      retailer_id: retailerId,
    });

    return res.status(200).json({ success: true, retailer_id: retailerId, business_id: businessId });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[claim-uid] Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
