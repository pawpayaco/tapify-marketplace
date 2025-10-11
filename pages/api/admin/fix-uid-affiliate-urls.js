import { supabaseAdmin } from '../../../lib/supabase.js';

/**
 * ADMIN ONLY: One-time fix script to repair UIDs with null affiliate_urls
 *
 * This fixes the commission tracking bug where claimed UIDs were missing affiliate_urls,
 * causing subsequent NFC taps to redirect back to the claim page instead of the Shopify store.
 *
 * Usage: POST to /api/admin/fix-uid-affiliate-urls with admin secret
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

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  const shopifyDomain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  if (!shopifyDomain) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_SHOPIFY_DOMAIN not configured' });
  }

  console.log('[fix-uid-affiliate-urls] Starting fix...');

  try {
    // Find all claimed UIDs with null, empty, or missing UTM parameters in affiliate_url
    const { data: allUids, error: fetchError } = await supabaseAdmin
      .from('uids')
      .select('uid, retailer_id, business_id, is_claimed, affiliate_url')
      .eq('is_claimed', true);

    if (fetchError) {
      console.error('[fix-uid-affiliate-urls] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch UIDs', details: fetchError.message });
    }

    // Filter for UIDs that need fixing (null, empty, missing UTM parameters, or wrong domain)
    const brokenUids = allUids?.filter(uid =>
      !uid.affiliate_url ||
      uid.affiliate_url.trim() === '' ||
      !uid.affiliate_url.includes('utm_source=nfc') ||
      !uid.affiliate_url.includes('pawpayaco.com/products/custom')
    ) || [];

    if (!brokenUids || brokenUids.length === 0) {
      console.log('[fix-uid-affiliate-urls] No UIDs need fixing');
      return res.status(200).json({
        success: true,
        message: 'No UIDs need fixing',
        fixed_count: 0,
      });
    }

    console.log(`[fix-uid-affiliate-urls] Found ${brokenUids.length} UIDs to fix`);

    // Update each UID with proper affiliate URL (includes UTM parameters for better tracking)
    const updates = [];
    for (const uidData of brokenUids) {
      const affiliateUrl = `https://pawpayaco.com/products/custom?ref=${uidData.uid}&utm_source=nfc&utm_medium=display&utm_campaign=${uidData.uid}`;

      const { error: updateError } = await supabaseAdmin
        .from('uids')
        .update({ affiliate_url: affiliateUrl })
        .eq('uid', uidData.uid);

      if (updateError) {
        console.error(`[fix-uid-affiliate-urls] Failed to update ${uidData.uid}:`, updateError);
        updates.push({
          uid: uidData.uid,
          success: false,
          error: updateError.message,
        });
      } else {
        console.log(`[fix-uid-affiliate-urls] Fixed ${uidData.uid} → ${affiliateUrl}`);
        updates.push({
          uid: uidData.uid,
          success: true,
          affiliate_url: affiliateUrl,
        });
      }
    }

    const successCount = updates.filter(u => u.success).length;
    const failCount = updates.filter(u => !u.success).length;

    console.log(`[fix-uid-affiliate-urls] Complete. Success: ${successCount}, Failed: ${failCount}`);

    return res.status(200).json({
      success: true,
      message: `Fixed ${successCount} UIDs`,
      fixed_count: successCount,
      failed_count: failCount,
      details: updates,
    });
  } catch (error) {
    console.error('[fix-uid-affiliate-urls] Handler error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
