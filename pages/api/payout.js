// /pages/api/payout.js
import fetch from 'node-fetch';

import { requireAdmin, AuthError } from '../../lib/api-auth';
import { env } from '../../lib/env';
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

const DWOLLA_BASE_URL = env.DWOLLA_ENV?.includes('api.dwolla.com')
  ? (env.DWOLLA_ENV.includes('api-sandbox') ? 'https://api-sandbox.dwolla.com' : 'https://api.dwolla.com')
  : 'https://api-sandbox.dwolla.com';

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
  const requestBody = {
    _links: {
      source: { href: `${DWOLLA_BASE_URL}/funding-sources/${sourceFundingId}` },
      destination: { href: `${DWOLLA_BASE_URL}/funding-sources/${destFundingId}` },
    },
    amount: { currency: 'USD', value: amount.toFixed(2) },
  };

  console.log('[Dwolla Transfer] Request:', JSON.stringify(requestBody, null, 2));

  const res = await fetch(`${DWOLLA_BASE_URL}/transfers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.dwolla.v1.hal+json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('[Dwolla Transfer] Response status:', res.status);
  console.log('[Dwolla Transfer] Response headers:', JSON.stringify([...res.headers.entries()]));

  const text = await res.text();
  console.log('[Dwolla Transfer] Response body:', text);

  if (!res.ok) {
    let errorMessage = `Dwolla API error (${res.status})`;
    try {
      const json = JSON.parse(text);
      errorMessage = `Dwolla API error: ${JSON.stringify(json)}`;
    } catch (e) {
      errorMessage = `Dwolla API error (${res.status}): ${text}`;
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse Dwolla response: ${text}`);
  }
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let adminUser = null;

  try {
    const auth = await requireAdmin(req, res);
    adminUser = auth.user;

    const { payoutJobId } = req.body;
    if (!payoutJobId) {
      return res.status(400).json({ error: 'Missing payoutJobId' });
    }

    // 1. Fetch payout job
    const { data: job, error: jobError } = await supabaseAdmin
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
    // Note: Vendor bank account NOT required - vendor cut stays in master account
    const { data: retailer } = await supabaseAdmin
      .from('retailer_accounts')
      .select('dwolla_funding_source_id')
      .eq('retailer_id', job.retailer_id)
      .maybeSingle();

    const { data: sourcer } = job.sourcer_id
      ? await supabaseAdmin
          .from('sourcer_accounts')
          .select('dwolla_funding_source_id')
          .eq('id', job.sourcer_id)
          .maybeSingle()
      : { data: null };

    // Check if retailer needs payout but doesn't have bank account
    if (job.retailer_cut > 0 && !retailer?.dwolla_funding_source_id) {
      return res.status(400).json({ error: 'Retailer bank account missing. Please connect bank account in dashboard.' });
    }

    // Check if sourcer needs payout but doesn't have bank account
    if (job.sourcer_cut > 0 && job.sourcer_id && !sourcer?.dwolla_funding_source_id) {
      return res.status(400).json({ error: 'Sourcer bank account missing' });
    }

    // Log funding sources for debugging
    console.log('[Payout] Funding sources:', {
      master: env.DWOLLA_MASTER_FUNDING_SOURCE,
      retailer: retailer?.dwolla_funding_source_id,
      sourcer: sourcer?.dwolla_funding_source_id,
      amounts: {
        retailer_cut: job.retailer_cut,
        sourcer_cut: job.sourcer_cut,
        vendor_cut: job.vendor_cut
      }
    });

    // 3. Get Dwolla token
    const dwollaToken = await getDwollaToken();
    console.log('[Payout] Dwolla token obtained successfully');

    // 4. Send transfers
    const transfers = [];
    const sourceFundingId = env.DWOLLA_MASTER_FUNDING_SOURCE; // ✅ your business bank funding source

    // ✅ SKIP VENDOR TRANSFER - Vendor cut stays in master account (you keep this!)
    // Only transfer to external parties (retailers, sourcers)
    if (job.vendor_cut > 0) {
      console.log(`[payout] Vendor cut $${job.vendor_cut} retained in master account (no transfer)`);
      transfers.push({
        role: 'vendor',
        amount: job.vendor_cut,
        status: 'retained_in_master_account',
        note: 'Vendor portion kept in business account'
      });
    }

    if (retailer?.dwolla_funding_source_id && job.retailer_cut > 0) {
      const retailerTransfer = await createDwollaTransfer(
        dwollaToken,
        sourceFundingId,
        retailer.dwolla_funding_source_id,
        job.retailer_cut
      );
      transfers.push({ role: 'retailer', response: retailerTransfer });
    }

    if (sourcer?.dwolla_funding_source_id && job.sourcer_cut > 0) {
      const sourcerTransfer = await createDwollaTransfer(
        dwollaToken,
        sourceFundingId,
        sourcer.dwolla_funding_source_id,
        job.sourcer_cut
      );
      transfers.push({ role: 'sourcer', response: sourcerTransfer });
    }

    const transferSummaries = transfers.map((transfer) => {
      // Handle vendor retention (no Dwolla transfer)
      if (transfer.role === 'vendor' && transfer.status === 'retained_in_master_account') {
        return {
          role: 'vendor',
          id: null,
          status: 'retained_in_master_account',
          href: null,
          amount: transfer.amount,
          note: transfer.note
        };
      }

      // Handle actual Dwolla transfers (retailer, sourcer)
      const { role, response } = transfer;
      return {
        role,
        id: response?.id ?? null,
        status: response?.status ?? null,
        href: response?._links?.self?.href ?? null,
        amount: response?.amount?.value ?? null,
      };
    });

    const totalSent = transferSummaries.reduce((sum, transfer) => {
      const value = parseFloat(transfer.amount ?? '0');
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const { error: payoutInsertError } = await supabaseAdmin.from('payouts').insert({
      payout_job_id: job.id,
      retailer_id: job.retailer_id,
      vendor_id: job.vendor_id,
      sourcer_id: job.sourcer_id ?? null,
      total_amount: totalSent || job.total_amount || job.vendor_cut + job.retailer_cut + (job.sourcer_cut ?? 0),
      transfer_summary: transferSummaries,
      status: 'sent',
      triggered_by: adminUser?.id ?? null,
    });

    if (payoutInsertError) {
      console.error('[payout] Failed to record payout', payoutInsertError.message);
    }

    // 5. Update payout job
    await supabaseAdmin
      .from('payout_jobs')
      .update({
        status: 'paid',
        date_paid: new Date().toISOString(),
        transfer_ids: transferSummaries.map((entry) => entry.id).filter(Boolean),
      })
      .eq('id', payoutJobId);

    await logEvent(adminUser?.id ?? 'system', 'payout_processed', {
      payout_job_id: payoutJobId,
      transfers: transferSummaries,
    });

    return res.status(200).json({ success: true, transfers: transferSummaries });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[PAYOUT ERROR]', err);
    await logEvent(adminUser?.id ?? 'system', 'payout_failed', {
      error: err.message,
    });
    return res.status(500).json({ error: err.message });
  }
}
