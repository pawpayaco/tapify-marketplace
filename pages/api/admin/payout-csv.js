// Payout CSV for manual Chase direct deposit.
//
// Replaces the Dwolla auto-payout path while Dwolla production is unapproved.
// Pulls every pending payout_job, groups by retailer, and fetches account +
// routing numbers live from Plaid at request time. Those numbers are never
// stored - this endpoint is the only place they exist, and only in the response.
//
//   GET /api/admin/payout-csv              -> CSV of pending payouts
//   GET /api/admin/payout-csv?dry=1        -> JSON preview, numbers masked
//
// After paying, mark the jobs settled with POST /api/admin/payout-csv
// { payout_job_ids: [...] } so they stop showing up next week.

import { AuthError, requireAdmin } from '../../../lib/api-auth';
import { env } from '../../../lib/env';
import { supabaseAdmin } from '../../../lib/supabase';
import { logEvent } from '../../../utils/logger';

const PLAID_BASE_URL =
  env.PLAID_ENV === 'production' ? 'https://production.plaid.com'
  : env.PLAID_ENV === 'development' ? 'https://development.plaid.com'
  : 'https://sandbox.plaid.com';

async function plaidAuth(accessToken) {
  const res = await fetch(`${PLAID_BASE_URL}/auth/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.PLAID_CLIENT_ID,
      secret: env.PLAID_SECRET,
      access_token: accessToken,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_message || json.error_code || 'plaid /auth/get failed');
  return json;
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin client not configured' });

  let admin;
  try {
    admin = await requireAdmin(req, res);
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }

  // Mark jobs as paid after you've actually sent the money.
  if (req.method === 'POST') {
    const ids = req.body?.payout_job_ids;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'payout_job_ids array required' });
    }
    const { error } = await supabaseAdmin
      .from('payout_jobs')
      .update({ status: 'paid', date_paid: new Date().toISOString() })
      .in('id', ids);
    if (error) return res.status(500).json({ error: error.message });
    await logEvent('payout-csv', 'marked_paid', { count: ids.length, by: admin?.id ?? null });
    return res.status(200).json({ success: true, marked_paid: ids.length });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('payout_jobs')
      .select('id, retailer_id, retailer_cut, total_amount, source_uid, created_at, status')
      .in('status', ['pending', 'priority_display'])
      .gt('retailer_cut', 0)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    if (!jobs?.length) return res.status(200).json({ rows: [], message: 'No pending payouts.' });

    // group by retailer so each store gets ONE deposit, not one per order
    const byRetailer = new Map();
    for (const j of jobs) {
      if (!j.retailer_id) continue;
      const g = byRetailer.get(j.retailer_id) ?? { amount: 0, ids: [], orders: 0 };
      g.amount += Number(j.retailer_cut || 0);
      g.ids.push(j.id);
      g.orders += 1;
      byRetailer.set(j.retailer_id, g);
    }

    const ids = [...byRetailer.keys()];
    const { data: retailers } = await supabaseAdmin
      .from('retailers').select('id, name, email').in('id', ids);
    const { data: accounts } = await supabaseAdmin
      .from('retailer_accounts')
      .select('retailer_id, plaid_access_token, plaid_account_id, institution_name, account_mask')
      .in('retailer_id', ids);

    const rMap = new Map((retailers ?? []).map((r) => [r.id, r]));
    const aMap = new Map((accounts ?? []).map((a) => [a.retailer_id, a]));
    const dry = req.query.dry === '1';

    const rows = [];
    for (const [retailerId, g] of byRetailer) {
      const r = rMap.get(retailerId);
      const acct = aMap.get(retailerId);
      const base = {
        retailer: r?.name ?? '(unknown)',
        email: r?.email ?? '',
        amount: Number(g.amount.toFixed(2)),
        orders: g.orders,
        payout_job_ids: g.ids,
      };

      if (!acct?.plaid_access_token) {
        rows.push({ ...base, status: 'NO_BANK_LINKED', routing: '', account: '' });
        continue;
      }

      try {
        const auth = await plaidAuth(acct.plaid_access_token);
        const ach = (auth.numbers?.ach ?? []).find(
          (n) => n.account_id === acct.plaid_account_id
        ) ?? auth.numbers?.ach?.[0];

        if (!ach) {
          rows.push({ ...base, status: 'NO_ACH_DETAILS', routing: '', account: '' });
          continue;
        }
        rows.push({
          ...base,
          status: 'READY',
          bank: acct.institution_name ?? '',
          routing: dry ? `••••${String(ach.routing).slice(-4)}` : ach.routing,
          account: dry ? `••••${String(ach.account).slice(-4)}` : ach.account,
        });
      } catch (e) {
        rows.push({ ...base, status: `PLAID_ERROR: ${e.message}`, routing: '', account: '' });
      }
    }

    if (dry) {
      return res.status(200).json({
        total: Number(rows.reduce((a, b) => a + b.amount, 0).toFixed(2)),
        ready: rows.filter((r) => r.status === 'READY').length,
        blocked: rows.filter((r) => r.status !== 'READY').length,
        rows,
      });
    }

    await logEvent('payout-csv', 'exported', {
      retailers: rows.length,
      total: rows.reduce((a, b) => a + b.amount, 0),
      by: admin?.id ?? null,
    });

    const header = ['Retailer', 'Email', 'Bank', 'Routing Number', 'Account Number',
                    'Amount', 'Orders', 'Status', 'Payout Job IDs'];
    const csv = [
      header.join(','),
      ...rows.map((r) => [
        r.retailer, r.email, r.bank ?? '', r.routing, r.account,
        r.amount.toFixed(2), r.orders, r.status, r.payout_job_ids.join(' '),
      ].map(csvCell).join(',')),
    ].join('\n');

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pawpaya-payouts-${stamp}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('[payout-csv] Failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
