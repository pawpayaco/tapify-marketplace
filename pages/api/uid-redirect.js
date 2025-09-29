export default async function handler(req, res) {
  const u = req.query.u || null;

  // For now: if no UID in DB, fall back to /claim
  if (!u) {
    res.redirect(302, '/claim');
    return;
  }

  // Placeholder for DB lookup:
  // const affiliateUrl = await lookupAffiliateUrl(u);
  const affiliateUrl = null;

  if (affiliateUrl) {
    res.redirect(302, affiliateUrl);
  } else {
    res.redirect(302, `/claim?u=${encodeURIComponent(u)}`);
  }
}
