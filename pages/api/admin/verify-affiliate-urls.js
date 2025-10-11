import { supabaseAdmin } from '../../../lib/supabase.js';

/**
 * ADMIN ONLY: Verify that all claimed UIDs have proper affiliate URLs with UTM parameters
 *
 * Usage: GET /api/admin/verify-affiliate-urls?adminSecret=123abc123
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

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    // Get all claimed UIDs
    const { data: uids, error: fetchError } = await supabaseAdmin
      .from('uids')
      .select('uid, affiliate_url, is_claimed')
      .eq('is_claimed', true)
      .limit(100);

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch UIDs', details: fetchError.message });
    }

    if (!uids || uids.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No claimed UIDs found',
        total: 0,
      });
    }

    // Analyze affiliate URLs
    const results = {
      total: uids.length,
      with_utm_parameters: 0,
      without_utm_parameters: 0,
      missing_affiliate_url: 0,
      sample_urls: [],
    };

    for (const uid of uids) {
      if (!uid.affiliate_url || uid.affiliate_url.trim() === '') {
        results.missing_affiliate_url++;
      } else if (uid.affiliate_url.includes('utm_source=nfc')) {
        results.with_utm_parameters++;
        if (results.sample_urls.length < 3) {
          results.sample_urls.push({
            uid: uid.uid,
            url: uid.affiliate_url,
            has_utm: true,
          });
        }
      } else {
        results.without_utm_parameters++;
        if (results.sample_urls.length < 3) {
          results.sample_urls.push({
            uid: uid.uid,
            url: uid.affiliate_url,
            has_utm: false,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[verify-affiliate-urls] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
