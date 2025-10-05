import { AuthError, requireSession } from '../../lib/api-auth';
import { env } from '../../lib/env';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

const DWOLLA_BASE_URL = env.DWOLLA_ENV?.includes('api.dwolla.com')
  ? 'https://api.dwolla.com'
  : 'https://api-sandbox.dwolla.com';

const PLAID_BASE_URL =
  env.PLAID_ENV === 'production'
    ? 'https://production.plaid.com'
    : env.PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

const ACCOUNT_TABLE = {
  vendor: 'vendor_accounts',
  retailer: 'retailer_accounts',
  sourcer: 'sourcer_accounts',
};

async function upsertAccountRecord(table, idColumn, entityId, payload) {
  const { data: existing } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq(idColumn, entityId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from(table)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to update ${table}: ${error.message}`);
    }
    return existing.id;
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert({
      [idColumn]: entityId,
      ...payload,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to create ${table}: ${error.message}`);
  }

  return data?.id;
}

export async function completePlaidDwollaLink({
  public_token,
  account_id,
  account_type,
  entity_id,
  name,
  email,
  user,
}) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const table = ACCOUNT_TABLE[account_type];

  if (!table) {
    throw new Error(`Unsupported account type: ${account_type}`);
  }

  const plaidExchange = await fetch(`${PLAID_BASE_URL}/item/public_token/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      public_token,
    }),
  });

  const exchangeJson = await plaidExchange.json();

  if (!plaidExchange.ok) {
    throw new Error(exchangeJson?.error_message || 'Plaid token exchange failed');
  }

  const access_token = exchangeJson.access_token;

  const processorResp = await fetch(`${PLAID_BASE_URL}/processor/dwolla/bank_account_token/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      access_token,
      account_id,
    }),
  });

  const processorJson = await processorResp.json();

  if (!processorResp.ok) {
    throw new Error(processorJson?.error_message || 'Failed to create Plaid processor token');
  }

  const processor_token = processorJson.processor_token;

  const dwollaTokenResp = await fetch(`${DWOLLA_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DWOLLA_KEY,
      client_secret: env.DWOLLA_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  const dwollaTokenJson = await dwollaTokenResp.json();

  if (!dwollaTokenResp.ok) {
    throw new Error(dwollaTokenJson?.error_description || 'Failed to authenticate with Dwolla');
  }

  const dwollaAccessToken = dwollaTokenJson.access_token;

  const customerResp = await fetch(`${DWOLLA_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dwollaAccessToken}`,
    },
    body: JSON.stringify({
      firstName: name || 'Unknown',
      email: email || `${entity_id}@tapify.local`,
      type: 'receive-only',
    }),
  });

  const customerLocation = customerResp.headers.get('location');

  if (!customerLocation) {
    const errorJson = await customerResp.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Failed to create Dwolla customer');
  }

  const dwolla_customer_id = customerLocation.split('/').pop();

  const fundingResp = await fetch(`${DWOLLA_BASE_URL}/customers/${dwolla_customer_id}/funding-sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dwollaAccessToken}`,
    },
    body: JSON.stringify({
      plaidToken: processor_token,
      name: `${name || account_type}'s Bank`,
    }),
  });

  const fundingLocation = fundingResp.headers.get('location');

  if (!fundingLocation) {
    const errorJson = await fundingResp.json().catch(() => ({}));
    throw new Error(errorJson?.message || 'Failed to attach Dwolla funding source');
  }

  const dwolla_funding_source_id = fundingLocation.split('/').pop();

  const idColumn = `${account_type}_id`;

  await upsertAccountRecord(table, idColumn, entity_id, {
    plaid_access_token: access_token,
    dwolla_customer_id,
    dwolla_funding_source_id,
  });

  await logEvent(user?.id ?? 'system', 'bank_linked', {
    account_type,
    entity_id,
    dwolla_customer_id,
  });

  return { dwolla_customer_id, dwolla_funding_source_id };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_token, account_id, account_type, entity_id, name, email } = req.body ?? {};

  if (!public_token || !account_id || !account_type || !entity_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { user } = await requireSession(req, res);
    const result = await completePlaidDwollaLink({
      public_token,
      account_id,
      account_type,
      entity_id,
      name,
      email,
      user,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[PlaidLink] Error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
