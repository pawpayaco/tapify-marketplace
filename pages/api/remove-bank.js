import { AuthError, requireSession } from '../../lib/api-auth';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';
import { env } from '../../lib/env';

const DWOLLA_BASE_URL = env.DWOLLA_ENV?.includes('api.dwolla.com')
  ? 'https://api.dwolla.com'
  : 'https://api-sandbox.dwolla.com';

const ACCOUNT_TABLE = {
  vendor: 'vendor_accounts',
  retailer: 'retailer_accounts',
  sourcer: 'sourcer_accounts',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    console.log(`[REMOVE-BANK] Removing bank connection for ${account_type} ${entity_id}`);

    const idColumn = `${account_type}_id`;

    // Get current bank connection info before removing
    const { data: accountData } = await supabaseAdmin
      .from(table)
      .select('dwolla_funding_source_id')
      .eq(idColumn, entity_id)
      .maybeSingle();

    const fundingSourceId = accountData?.dwolla_funding_source_id;

    // Remove funding source from Dwolla if it exists
    if (fundingSourceId) {
      try {
        console.log('[REMOVE-BANK] Removing funding source from Dwolla:', fundingSourceId);

        // Get Dwolla access token
        const dwollaTokenResp = await fetch(`${DWOLLA_BASE_URL}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.DWOLLA_KEY,
            client_secret: env.DWOLLA_SECRET,
            grant_type: 'client_credentials',
          }),
        });

        if (dwollaTokenResp.ok) {
          const { access_token } = await dwollaTokenResp.json();

          // Remove funding source
          const removeResp = await fetch(`${DWOLLA_BASE_URL}/funding-sources/${fundingSourceId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/vnd.dwolla.v1.hal+json',
              'Accept': 'application/vnd.dwolla.v1.hal+json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ removed: true }),
          });

          if (removeResp.ok || removeResp.status === 404) {
            console.log('[REMOVE-BANK] Funding source removed from Dwolla');
          } else {
            const errorData = await removeResp.json().catch(() => ({}));
            console.warn('[REMOVE-BANK] Failed to remove from Dwolla:', errorData);
            // Continue anyway - we'll still clear our database
          }
        }
      } catch (dwollaError) {
        console.warn('[REMOVE-BANK] Dwolla removal error:', dwollaError);
        // Continue anyway - we'll still clear our database
      }
    }

    // Remove bank account info from our database (but keep the record for payout history)
    const { error } = await supabaseAdmin
      .from(table)
      .update({
        plaid_access_token: null,
        dwolla_customer_id: null,
        dwolla_funding_source_id: null,
      })
      .eq(idColumn, entity_id);

    if (error) {
      console.error('[REMOVE-BANK] Database error:', error);
      throw new Error(`Failed to remove bank connection: ${error.message}`);
    }

    await logEvent(user?.id ?? 'system', 'bank_removed', {
      account_type,
      entity_id,
    });

    console.log('[REMOVE-BANK] Bank connection removed successfully');

    return res.status(200).json({
      success: true,
      message: 'Bank connection removed successfully'
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[REMOVE-BANK] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
