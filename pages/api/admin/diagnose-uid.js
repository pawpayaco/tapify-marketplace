import { supabaseAdmin } from '../../../lib/supabase.js';

/**
 * ADMIN ONLY: Diagnostic tool to check UID status and fix issues
 *
 * Usage: GET /api/admin/diagnose-uid?uid=0419F601&adminSecret=123abc123
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication
  const adminSecret = req.headers['x-admin-secret'] || req.query.adminSecret;
  if (adminSecret !== process.env.ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ error: 'uid parameter required' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    // Get UID record with related data
    const { data: uidData, error: uidError } = await supabaseAdmin
      .from('uids')
      .select(`
        *,
        retailer:retailer_id (
          id,
          name,
          email,
          created_by_user_id
        ),
        business:business_id (
          id,
          name
        )
      `)
      .eq('uid', uid)
      .maybeSingle();

    if (uidError) {
      return res.status(500).json({ error: 'Database error', details: uidError.message });
    }

    if (!uidData) {
      return res.status(404).json({ error: 'UID not found', uid });
    }

    // Get recent scans for this UID
    const { data: scansData } = await supabaseAdmin
      .from('scans')
      .select('*')
      .eq('uid', uid)
      .order('timestamp', { ascending: false })
      .limit(5);

    // Analyze the issues
    const issues = [];
    const fixes = [];

    if (!uidData.is_claimed) {
      issues.push('UID is not marked as claimed (is_claimed = false)');
      fixes.push('Need to claim this UID through /claim page or set is_claimed = true');
    }

    if (!uidData.affiliate_url || uidData.affiliate_url.trim() === '') {
      issues.push('UID has no affiliate_url (required for redirect to work)');
      fixes.push('Need to set affiliate_url to Shopify store URL with ref parameter');
    }

    if (!uidData.retailer_id) {
      issues.push('UID has no retailer_id (not linked to any retailer)');
      fixes.push('Need to claim this UID and link it to a retailer');
    }

    if (!uidData.claimed_at && uidData.is_claimed) {
      issues.push('UID is marked as claimed but has no claimed_at timestamp');
    }

    // Generate recommended affiliate URL (with UTM parameters for better tracking)
    const recommendedUrl = `https://pawpayaco.com/products/custom?ref=${uid}&utm_source=nfc&utm_medium=display&utm_campaign=${uid}`;

    return res.status(200).json({
      uid: uid,
      status: uidData.is_claimed ? 'claimed' : 'unclaimed',
      data: {
        is_claimed: uidData.is_claimed,
        claimed_at: uidData.claimed_at,
        affiliate_url: uidData.affiliate_url,
        retailer_id: uidData.retailer_id,
        business_id: uidData.business_id,
        last_scan_at: uidData.last_scan_at,
        scan_count: uidData.scan_count,
      },
      retailer: uidData.retailer ? {
        id: uidData.retailer.id,
        name: uidData.retailer.name,
        email: uidData.retailer.email,
        user_id: uidData.retailer.created_by_user_id,
      } : null,
      business: uidData.business ? {
        id: uidData.business.id,
        name: uidData.business.name,
      } : null,
      recent_scans: scansData?.map(s => ({
        timestamp: s.timestamp,
        clicked: s.clicked,
        location: s.location,
      })) || [],
      issues: issues.length > 0 ? issues : ['No issues detected'],
      recommended_fixes: fixes.length > 0 ? fixes : ['UID appears to be properly configured'],
      recommended_affiliate_url: recommendedUrl,
      redirect_behavior: !uidData.is_claimed || !uidData.affiliate_url
        ? `Will redirect to /claim?u=${uid}`
        : `Will redirect to ${uidData.affiliate_url}`,
    });
  } catch (error) {
    console.error('[diagnose-uid] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
