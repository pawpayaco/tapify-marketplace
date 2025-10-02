// /pages/api/plaid-link.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ server-side only
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_token, account_id, account_type, entity_id, name, email } = req.body;
  // account_type = "vendor" | "retailer" | "sourcer"
  // entity_id = UUID from your Supabase vendors/retailers/sourcers table

  if (!public_token || !account_id || !account_type || !entity_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    //
    // 1. Exchange public_token for access_token
    //
    const plaidExchange = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        public_token,
      }),
    });
    const exchangeJson = await plaidExchange.json();
    const access_token = exchangeJson.access_token;

    if (!access_token) throw new Error('Plaid token exchange failed');

    //
    // 2. Create processor token for Dwolla
    //
    const processorResp = await fetch('https://sandbox.plaid.com/processor/dwolla/bank_account_token/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token,
        account_id,
      }),
    });
    const processorJson = await processorResp.json();
    const processor_token = processorJson.processor_token;

    if (!processor_token) throw new Error('Processor token creation failed');

    //
    // 3. Create Dwolla Customer
    //
    const dwollaCustomerResp = await fetch(`${process.env.DWOLLA_ENV}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.DWOLLA_KEY}:${process.env.DWOLLA_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        firstName: name || "Unknown",
        email: email || `${entity_id}@tapify.local`,
        type: "receive-only",
      }),
    });

    const dwollaCustomerUrl = dwollaCustomerResp.headers.get('location');
    if (!dwollaCustomerUrl) throw new Error('Failed to create Dwolla customer');

    const dwolla_customer_id = dwollaCustomerUrl.split('/').pop();

    //
    // 4. Attach Funding Source
    //
    const fundingResp = await fetch(`${process.env.DWOLLA_ENV}/customers/${dwolla_customer_id}/funding-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.DWOLLA_KEY}:${process.env.DWOLLA_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        plaidToken: processor_token,
        name: `${name || account_type}'s Bank`,
      }),
    });

    const fundingSourceUrl = fundingResp.headers.get('location');
    if (!fundingSourceUrl) throw new Error('Failed to attach funding source');

    const dwolla_funding_source_id = fundingSourceUrl.split('/').pop();

    //
    // 5. Save into Supabase account table
    //
    const table =
      account_type === 'vendor'
        ? 'vendor_accounts'
        : account_type === 'retailer'
        ? 'retailer_accounts'
        : 'sourcer_accounts';

    const insertResp = await supabase.from(table).insert({
      [`${account_type}_id`]: entity_id,
      plaid_access_token: access_token,
      dwolla_customer_id,
      dwolla_funding_source_id,
    });

    if (insertResp.error) throw insertResp.error;

    return res.status(200).json({
      success: true,
      dwolla_customer_id,
      dwolla_funding_source_id,
    });
  } catch (err) {
    console.error('[Plaid/Dwolla Onboarding Error]', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
