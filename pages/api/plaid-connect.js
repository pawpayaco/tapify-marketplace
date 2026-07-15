// Plaid bank linking WITHOUT Dwolla.
//
// Dwolla production isn't approved (token endpoint returns invalid_client), and
// a production Plaid processor token can't be handed to Dwolla sandbox anyway.
// Payouts are settled manually via Chase direct deposit off a CSV export, so all
// we need from Plaid is a durable reference to the account.
//
// Deliberately stores NO account/routing numbers. Those are fetched live from
// /auth/get when the payout CSV is generated (see /api/admin/payout-csv) and are
// never written to the database.
//
// The Dwolla path in /api/plaid-link is left intact for whenever Dwolla approves.

import { AuthError, requireSession } from '../../lib/api-auth';
import { env } from '../../lib/env';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

const PLAID_BASE_URL =
  env.PLAID_ENV === 'production' ? 'https://production.plaid.com'
  : env.PLAID_ENV === 'development' ? 'https://development.plaid.com'
  : 'https://sandbox.plaid.com';

async function plaid(path, body) {
  const res = await fetch(`${PLAID_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      ...body,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_message || json.error_code || `Plaid ${path} failed`);
  }
  return json;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin client not configured' });

  try {
    await requireSession(req, res);
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }

  const { public_token, retailer_id, account_id, metadata } = req.body ?? {};
  const accountId = account_id || metadata?.account_id || metadata?.accounts?.[0]?.id || null;

  if (!public_token || !retailer_id) {
    return res.status(400).json({ error: 'public_token and retailer_id are required' });
  }

  try {
    // 1. public_token -> long-lived access_token
    const { access_token, item_id } = await plaid('/item/public_token/exchange', { public_token });

    // 2. Confirm the account actually supports ACH before we call it linked.
    //    Fetching now surfaces a bad account at link time rather than on payout day.
    const auth = await plaid('/auth/get', { access_token });
    const numbers = auth.numbers?.ach ?? [];
    const chosen = accountId
      ? numbers.find((n) => n.account_id === accountId) ?? numbers[0]
      : numbers[0];

    if (!chosen) {
      return res.status(400).json({
        error: 'That account has no ACH routing details. Pick a checking or savings account.',
      });
    }

    const account = auth.accounts?.find((a) => a.account_id === chosen.account_id);

    // 3. Store the reference + display mask. NOT the account/routing numbers.
    const { error } = await supabaseAdmin
      .from('retailer_accounts')
      .upsert(
        {
          retailer_id,
          plaid_access_token: access_token,
          plaid_item_id: item_id,
          plaid_account_id: chosen.account_id,
          institution_name: metadata?.institution?.name ?? null,
          account_name: account?.name ?? null,
          account_mask: account?.mask ?? null,
          linked_at: new Date().toISOString(),
        },
        { onConflict: 'retailer_id' }
      );

    if (error) throw new Error(error.message);

    await logEvent('plaid-connect', 'bank_linked', {
      retailer_id,
      institution: metadata?.institution?.name ?? null,
      mask: account?.mask ?? null,
    });

    return res.status(200).json({
      success: true,
      institution: metadata?.institution?.name ?? null,
      account_name: account?.name ?? null,
      mask: account?.mask ?? null,
    });
  } catch (err) {
    console.error('[plaid-connect] Failed:', err.message);
    await logEvent('plaid-connect', 'link_error', { retailer_id, error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
