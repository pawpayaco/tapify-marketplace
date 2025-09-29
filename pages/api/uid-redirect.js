// /pages/api/uid-redirect.js

export default async function handler(req, res) {
  const { u: uid } = req.query;

  if (!uid) {
    return res.status(400).send('Missing UID.');
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Server-side only!
    );

    const { data: uidRow, error } = await supabase
      .from('uids')
      .select('affiliate_url, is_claimed')
      .eq('uid', uid)
      .single();

    if (error) {
      console.warn('[Supabase Error]', error.message);
      return res.redirect(302, `/claim?u=${uid}`);
    }

    if (!uidRow) {
      console.warn('[UID Not Found]', uid);
      return res.redirect(302, `/claim?u=${uid}`);
    }

    const { is_claimed, affiliate_url } = uidRow;

    if (!is_claimed || !affiliate_url) {
      return res.redirect(302, `/claim?u=${uid}`);
    }

    return res.redirect(302, affiliate_url);
  } catch (err) {
    console.error('[Redirect Handler Error]', err);
    return res.redirect(302, `/claim?u=${uid}`);
  }
}
