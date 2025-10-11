import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.socket?.remoteAddress ?? null;
};

const getLocationDescriptor = (req) => {
  const city = req.headers['x-vercel-ip-city'];
  const region = req.headers['x-vercel-ip-country-region'];
  const country = req.headers['x-vercel-ip-country'];

  return [city, region, country].filter(Boolean).join(', ') || null;
};

async function recordScan({ uid, retailerId, businessId, location, ipAddress, userAgent }) {
  await supabaseAdmin.from('scans').insert({
    uid,
    retailer_id: retailerId ?? null,
    business_id: businessId ?? null,
    clicked: true,
    location,
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  await supabaseAdmin
    .from('uids')
    .update({
      last_scan_at: new Date().toISOString(),
      last_scan_ip: ipAddress,
      last_scan_location: location,
      last_scan_user_agent: userAgent,
    })
    .eq('uid', uid);

  if (typeof supabaseAdmin.rpc === 'function') {
    await supabaseAdmin.rpc('increment_uid_scan_count', { p_uid: uid });
  }
}

export default async function handler(req, res) {
  const { u: uid } = req.query;

  if (!uid) {
    return res.status(400).send('Missing UID.');
  }

  if (!supabaseAdmin) {
    console.error('[uid-redirect] Supabase admin client not configured');
    return res.redirect(302, `/claim?u=${uid}`);
  }

  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] ?? null;
  const location = getLocationDescriptor(req);

  try {
    const { data: uidRow, error } = await supabaseAdmin
      .from('uids')
      .select('affiliate_url, is_claimed, retailer_id, business_id')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.warn('[uid-redirect] Failed to fetch UID', error.message);
      await logEvent('uid-redirect', 'missing_uid', { uid, error: error.message });
      return res.redirect(302, `/claim?u=${uid}`);
    }

    if (!uidRow) {
      console.warn('[uid-redirect] UID not found', uid);
      await logEvent('uid-redirect', 'unknown_uid', { uid });
      return res.redirect(302, `/claim?u=${uid}`);
    }

    await recordScan({
      uid,
      retailerId: uidRow.retailer_id,
      businessId: uidRow.business_id,
      location,
      ipAddress,
      userAgent,
    });

    const { is_claimed, affiliate_url } = uidRow;

    // Debug logging for redirect decision
    console.log('[uid-redirect] Redirect decision:', {
      uid,
      is_claimed,
      has_affiliate_url: !!affiliate_url,
      affiliate_url,
    });

    if (!is_claimed || !affiliate_url) {
      console.log('[uid-redirect] Redirecting to claim page. Reason:', {
        not_claimed: !is_claimed,
        missing_affiliate_url: !affiliate_url,
      });
      return res.redirect(302, `/claim?u=${uid}`);
    }

    // Valid claim with affiliate URL - redirect to Shopify
    await logEvent('uid-redirect', 'scan_redirect', {
      uid,
      retailer_id: uidRow.retailer_id,
      affiliate_url,
    });

    console.log('[uid-redirect] Redirecting to affiliate URL:', affiliate_url);
    return res.redirect(302, affiliate_url);
  } catch (err) {
    console.error('[uid-redirect] Handler error', err);
    await logEvent('uid-redirect', 'error', { uid, message: err.message });
    return res.redirect(302, `/claim?u=${uid}`);
  }
}
