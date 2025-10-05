import { requireSession, AuthError } from '../../lib/api-auth';
import { supabaseAdmin } from '../../lib/supabase';
import { env } from '../../lib/env';
import { logEvent } from '../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  const { uid, businessId } = req.body ?? {};

  if (!uid || !businessId) {
    return res.status(400).json({ error: 'uid and businessId are required' });
  }

  try {
    const { user } = await requireSession(req, res);

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

    let retailerId = uidRecord?.retailer_id ?? null;

    const { data: retailer } = await supabaseAdmin
      .from('retailers')
      .select('id, email')
      .eq('business_id', businessId)
      .maybeSingle();

    retailerId = retailer?.id ?? null;

    if (!retailerId) {
      const { data: owner } = await supabaseAdmin
        .from('retailer_owners')
        .select('retailer_id')
        .eq('owner_email', user.email)
        .maybeSingle();

      retailerId = owner?.retailer_id ?? null;
    }

    const defaultAffiliateUrl = env.NEXT_PUBLIC_SHOPIFY_DOMAIN
      ? `https://${env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/collections/all?ref=${uid}`
      : null;

    const affiliateUrl = uidRecord?.affiliate_url ?? defaultAffiliateUrl;

    const { error: updateError } = await supabaseAdmin
      .from('uids')
      .update({
        business_id: businessId,
        retailer_id: retailerId,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id,
        affiliate_url: affiliateUrl,
      })
      .eq('uid', uid);

    if (updateError) {
      console.error('[claim-uid] Failed to mark UID claimed:', updateError.message);
      return res.status(500).json({ error: 'Failed to claim UID' });
    }

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

    await logEvent(user.id, 'uid_claimed', {
      uid,
      business_id: businessId,
      retailer_id: retailerId,
    });

    return res.status(200).json({ success: true, retailer_id: retailerId });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[claim-uid] Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
