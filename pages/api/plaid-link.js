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
      .update({ ...payload })
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
  console.log('[PLAID-DWOLLA-LINK] Starting with params:', {
    has_public_token: !!public_token,
    account_id,
    account_type,
    entity_id,
    name,
    email: email || 'generated',
  });

  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  // Validate environment variables
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) {
    console.error('[PLAID-DWOLLA-LINK] Missing Plaid credentials');
    throw new Error('Plaid credentials not configured');
  }

  if (!env.DWOLLA_KEY || !env.DWOLLA_SECRET) {
    console.error('[PLAID-DWOLLA-LINK] Missing Dwolla credentials');
    throw new Error('Dwolla credentials not configured');
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
    console.error('[PLAID] itemPublicTokenExchange failed', {
      status: plaidExchange.status,
      statusText: plaidExchange.statusText,
      error: exchangeJson,
      plaid_env: env.PLAID_ENV,
      base_url: PLAID_BASE_URL,
    });
    throw new Error(exchangeJson?.error_message || 'Plaid token exchange failed');
  }

  console.log('[PLAID] Successfully exchanged public token for access token');

  const access_token = exchangeJson.access_token;

  const processorResp = await fetch(`${PLAID_BASE_URL}/processor/dwolla/processor_token/create`, {
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
    console.error('[PLAID] Processor token creation failed', {
      status: processorResp.status,
      statusText: processorResp.statusText,
      error: processorJson,
      account_id,
    });
    throw new Error(processorJson?.error_message || 'Failed to create Plaid processor token');
  }

  console.log('[PLAID] Successfully created Dwolla processor token');

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
    console.error('[DWOLLA] Authentication failed', {
      status: dwollaTokenResp.status,
      error: dwollaTokenJson,
      base_url: DWOLLA_BASE_URL,
    });
    throw new Error(dwollaTokenJson?.error_description || 'Failed to authenticate with Dwolla');
  }

  console.log('[DWOLLA] Successfully authenticated');

  const dwollaAccessToken = dwollaTokenJson.access_token;

  const normalizedName = (name || account_type || 'Tapify').trim();
  const [firstNamePart, ...restNameParts] = normalizedName.split(/\s+/).filter(Boolean);
  const firstNameValue = firstNamePart || 'Tapify';
  const capitalizedType = account_type
    ? `${account_type.charAt(0).toUpperCase()}${account_type.slice(1)}`
    : 'Account';
  const lastNameValue = restNameParts.join(' ') || `${capitalizedType} Account`;

  const customerResp = await fetch(`${DWOLLA_BASE_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.dwolla.v1.hal+json',
      'Accept': 'application/vnd.dwolla.v1.hal+json',
      Authorization: `Bearer ${dwollaAccessToken}`,
    },
    body: JSON.stringify({
      firstName: firstNameValue,
      lastName: lastNameValue,
      email: email || `${entity_id}@tapify.local`,
      type: 'receive-only',
      businessName: account_type === 'retailer' ? name : undefined,
    }),
  });

  const customerLocation = customerResp.headers.get('location');

  let dwolla_customer_id;

  if (!customerLocation) {
    const errorJson = await customerResp.json().catch(() => ({}));

    // Check if customer already exists (duplicate email error)
    const isDuplicate = errorJson?._embedded?.errors?.some(
      (err) => err.code === 'Duplicate' || err.message?.toLowerCase().includes('duplicate')
    );

    if (isDuplicate) {
      console.log('[DWOLLA] Customer already exists, searching for existing customer');

      // Search for existing customer by email
      const searchResp = await fetch(
        `${DWOLLA_BASE_URL}/customers?email=${encodeURIComponent(email || `${entity_id}@tapify.local`)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.dwolla.v1.hal+json',
            Authorization: `Bearer ${dwollaAccessToken}`,
          },
        }
      );

      if (searchResp.ok) {
        const searchJson = await searchResp.json();
        const existingCustomer = searchJson._embedded?.customers?.[0];

        if (existingCustomer) {
          dwolla_customer_id = existingCustomer.id;
          console.log('[DWOLLA] Found existing customer', { dwolla_customer_id });
        } else {
          throw new Error('Customer exists but could not be found');
        }
      } else {
        throw new Error('Failed to search for existing customer');
      }
    } else {
      console.error('[DWOLLA] Customer creation failed', {
        status: customerResp.status,
        error: errorJson,
        embedded_errors: errorJson?._embedded?.errors,
        firstName: firstNameValue,
        lastName: lastNameValue,
        email: email || `${entity_id}@tapify.local`,
      });
      throw new Error(errorJson?.message || 'Failed to create Dwolla customer');
    }
  } else {
    console.log('[DWOLLA] Successfully created customer', { location: customerLocation });
    dwolla_customer_id = customerLocation.split('/').pop();
  }

  const fundingResp = await fetch(`${DWOLLA_BASE_URL}/customers/${dwolla_customer_id}/funding-sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.dwolla.v1.hal+json',
      'Accept': 'application/vnd.dwolla.v1.hal+json',
      Authorization: `Bearer ${dwollaAccessToken}`,
    },
    body: JSON.stringify({
      plaidToken: processor_token,
      name: `${name || account_type}'s Bank`,
    }),
  });

  const fundingLocation = fundingResp.headers.get('location');

  let dwolla_funding_source_id;

  if (!fundingLocation) {
    const errorJson = await fundingResp.json().catch(() => ({}));

    // Check if funding source already exists (duplicate bank error)
    const isDuplicateBank = errorJson?.code === 'DuplicateResource' ||
                           errorJson?.message?.toLowerCase().includes('bank already exists');

    if (isDuplicateBank) {
      // Extract existing funding source ID from error message
      const match = errorJson?.message?.match(/id=([a-f0-9-]+)/);
      if (match) {
        dwolla_funding_source_id = match[1];
        console.log('[DWOLLA] Funding source already exists, reusing it', { dwolla_funding_source_id });
      } else {
        console.error('[DWOLLA] Duplicate bank but could not extract ID from error');
        throw new Error('Bank account already connected to this customer');
      }
    } else {
      console.error('[DWOLLA] Funding source attachment failed', {
        status: fundingResp.status,
        error: errorJson,
        dwolla_customer_id,
      });
      throw new Error(errorJson?.message || 'Failed to attach Dwolla funding source');
    }
  } else {
    console.log('[DWOLLA] Successfully attached funding source', { location: fundingLocation });
    dwolla_funding_source_id = fundingLocation.split('/').pop();
  }

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
