// Single source of truth for where an NFC display sends a shopper.
//
// The chip only ever stores https://app.pawpayaco.com/t?u=<UID> — the destination
// is looked up from uids.affiliate_url at scan time. So changing this only affects
// NEWLY generated URLs; to repoint displays already in the wild, update the
// affiliate_url column for those rows (nothing has to be re-encoded).
//
// Override per-environment with NEXT_PUBLIC_AFFILIATE_PRODUCT_URL.

export const AFFILIATE_PRODUCT_URL =
  process.env.NEXT_PUBLIC_AFFILIATE_PRODUCT_URL ||
  'https://pawpayaco.com/products/friendship-collar-bracelet';

export function buildAffiliateUrl(uid) {
  const url = new URL(AFFILIATE_PRODUCT_URL);
  url.searchParams.set('ref', uid);
  url.searchParams.set('utm_source', 'nfc');
  url.searchParams.set('utm_medium', 'display');
  url.searchParams.set('utm_campaign', uid);
  return url.toString();
}

// True when an existing affiliate_url already points at the configured product.
export function isCurrentAffiliateUrl(value) {
  if (!value) return false;
  try {
    const target = new URL(AFFILIATE_PRODUCT_URL);
    const actual = new URL(value);
    return actual.host === target.host && actual.pathname === target.pathname;
  } catch {
    return false;
  }
}
