import { AuthError, requireSession } from '../../lib/api-auth';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';
import { env } from '../../lib/env';

const PLAID_BASE_URL =
  env.PLAID_ENV === 'production' ? 'https://production.plaid.com'
  : env.PLAID_ENV === 'development' ? 'https://development.plaid.com'
  : 'https://sandbox.plaid.com';

const DWOLLA_BASE_URL = env.DWOLLA_ENV?.includes('api.dwolla.com')
  ? 'https://api.dwolla.com'
  : 'https://api-sandbox.dwolla.com';

const ACCOUNT_TABLE = {
  vendor: 'vendor_accounts',
  retailer: 'retailer_accounts',
  sourcer: 'sourcer_accounts',
};

// Confirm the caller actually owns this entity. Previously the handler trusted
// entity_id straight from the request body and only checked that *someone* was
// logged in, so any authenticated user could remove another store's bank.
async function assertOwnership(accountType, entityId, user) {
  if (accountType !== 'retailer') {
    throw new AuthError(403, 'Only retailer bank connections can be removed here');
  }
  const { data: retailer, error } = await supabaseAdmin
    .from('retailers')
    .select('id, created_by_user_id, email')
    .eq('id', entityId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!retailer) throw new AuthError(404, 'Retailer not found');

  const owns =
    retailer.created_by_user_id === user.id ||
    (retailer.email && user.email && retailer.email.toLowerCase() === user.email.toLowerCase());

  if (!owns) throw new AuthError(403, 'You do not have access to this store');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  const { account_type, entity_id } = req.body ?? {};
  if (!account_type || !entity_id) {
    return res.status(400).json({ error: 'Missing account_type or entity_id' });
  }

  const table = ACCOUNT_TABLE[account_type];
  if (!table) {
    return res.status(400).json({ error: `Invalid account type: ${account_type}` });
  }

  try {
    const { user } = await requireSession(req, res);
    await assertOwnership(account_type, entity_id, user);

    const idColumn = `${account_type}_id`;
    const { data: accountData } = await supabaseAdmin
      .from(table)
      .select('plaid_access_token, dwolla_funding_source_id')
      .eq(idColumn, entity_id)
      .maybeSingle();

    // Invalidate the Item at Plaid. Without this the bank connection stays live
    // on Plaid's side (and billable) even though we've forgotten the token.
    if (accountData?.plaid_access_token) {
      try {
        const resp = await fetch(`${PLAID_BASE_URL}/item/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: env.PLAID_CLIENT_ID,
            secret: env.PLAID_SECRET,
            access_token: accountData.plaid_access_token,
          }),
        });
        if (!resp.ok) {
          const e = await resp.json().catch(() => ({}));
          console.warn('[REMOVE-BANK] Plaid item/remove failed:', e.error_code || resp.status);
        }
      } catch (e) {
        // Non-fatal: still clear our side so the user isn't stuck.
        console.warn('[REMOVE-BANK] Plaid item/remove error:', e.message);
      }
    }

    // Best-effort Dwolla cleanup, for accounts linked before Dwolla was dropped.
    if (accountData?.dwolla_funding_source_id) {
      try {
        const tokenResp = await fetch(`${DWOLLA_BASE_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.DWOLLA_KEY,
            client_secret: env.DWOLLA_SECRET,
            grant_type: 'client_credentials',
          }),
        });
        if (tokenResp.ok) {
          const { access_token } = await tokenResp.json();
          await fetch(`${DWOLLA_BASE_URL}/funding-sources/${accountData.dwolla_funding_source_id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.dwolla.v1.hal+json',
              Accept: 'application/vnd.dwolla.v1.hal+json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ removed: true }),
          });
        }
      } catch (e) {
        console.warn('[REMOVE-BANK] Dwolla cleanup skipped:', e.message);
      }
    }

    // Clear every credential + display field. Row is kept for payout history.
    const { error } = await supabaseAdmin
      .from(table)
      .update({
        plaid_access_token: null,
        plaid_item_id: null,
        plaid_account_id: null,
        institution_name: null,
        account_name: null,
        account_mask: null,
        linked_at: null,
        dwolla_customer_id: null,
        dwolla_funding_source_id: null,
      })
      .eq(idColumn, entity_id);

    if (error) throw new Error(`Failed to remove bank connection: ${error.message}`);

    await logEvent('remove-bank', 'bank_removed', {
      account_type,
      entity_id,
      by: user.id,
    });

    return res.status(200).json({ success: true, message: 'Bank connection removed' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('[REMOVE-BANK] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
