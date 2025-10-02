// /pages/api/payout.js
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DWOLLA_BASE_URL =
  process.env.DWOLLA_ENV === 'sandbox'
    ? 'https://api-sandbox.dwolla.com'
    : 'https://api.dwolla.com';

// 🔑 Helper: get Dwolla auth token
async function getDwollaToken() {
  const res = await fetch(`${DWOLLA_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DWOLLA_KEY,
      client_secret: process.env.DWOLLA_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) throw new Error('Failed to get Dwolla token');
  return res.json();
}

// 🔑 Helper: send Dwolla transfer
async function createDwollaTransfer(token, sourceFundingId, destFundingId, amount) {
  const res = await fetch(`${DWOLLA_BASE_URL}/transfers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.dwolla.v1.hal+json',
    },
    body: JSON.stringify({
      _links: {
        source: { href: `${DWOLLA_BASE_URL}/funding-sources/${sourceFundingId}` },
        destination: { href: `${DWOLLA_BASE_URL}/funding-sources/${destFundingId}` },
      },
      amount: { currency: 'USD', value: amount.toFixed(2) },
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`Dwolla error: ${JSON.stringify(json)}`);
  return json;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payoutJobId } = req.body;
    if (!payoutJobId) {
      return res.status(400).json({ error: 'Missing payoutJobId' });
    }

    // 1. Fetch payout job
    const { data: job, error: jobError } = await supabase
      .from('payout_jobs')
      .select('*')
      .eq('id', payoutJobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Payout job not found' });
    }
    if (job.status !== 'pending') {
      return res.status(400).json({ error: 'Payout already processed' });
    }

    // 2. Fetch linked accounts w/ funding source IDs
    const { data: vendor } = await supabase
      .from('vendor_accounts')
      .select('dwolla_funding_source_id')
      .eq('vendor_id', job.vendor_id)
      .single();

    const { data: retailer } = await supabase
      .from('retailer_accounts')
      .select('dwolla_funding_source_id')
      .eq('retailer_id', job.retailer_id)
      .single();

    const { data: sourcer } = job.sourcer_id
      ? await supabase
          .from('sourcer_accounts')
          .select('dwolla_funding_source_id')
          .eq('id', job.sourcer_id)
          .single()
      : { data: null };

    if (!vendor?.dwolla_funding_source_id) {
      return res.status(400).json({ error: 'Vendor bank account missing' });
    }

    // 3. Get Dwolla token
    const dwollaToken = await getDwollaToken();

    // 4. Send transfers
    const transfers = [];
    const sourceFundingId = process.env.DWOLLA_MASTER_FUNDING_SOURCE; // ✅ your business bank funding source

    if (job.vendor_cut > 0) {
      transfers.push(
        await createDwollaTransfer(
          dwollaToken,
          sourceFundingId,
          vendor.dwolla_funding_source_id,
          job.vendor_cut
        )
      );
    }

    if (retailer?.dwolla_funding_source_id && job.retailer_cut > 0) {
      transfers.push(
        await createDwollaTransfer(
          dwollaToken,
          sourceFundingId,
          retailer.dwolla_funding_source_id,
          job.retailer_cut
        )
      );
    }

    if (sourcer?.dwolla_funding_source_id && job.sourcer_cut > 0) {
      transfers.push(
        await createDwollaTransfer(
          dwollaToken,
          sourceFundingId,
          sourcer.dwolla_funding_source_id,
          job.sourcer_cut
        )
      );
    }

    // 5. Update payout job
    await supabase
      .from('payout_jobs')
      .update({
        status: 'paid',
        date_paid: new Date().toISOString(),
      })
      .eq('id', payoutJobId);

    return res.status(200).json({ success: true, transfers });
  } catch (err) {
    console.error('[PAYOUT ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}
