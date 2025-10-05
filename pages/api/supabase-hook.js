import { supabaseAdmin } from '../../lib/supabase';
import { env } from '../../lib/env';
import { logEvent } from '../../utils/logger';

const respond = (res, status, payload) => {
  if (!res.headersSent) {
    res.status(status).json(payload);
  }
};

const getSecretHeader = (req) =>
  req.headers['x-supabase-signature'] || req.headers['x-api-key'] || req.headers['authorization'];

const normalizeDateKey = (timestamp) =>
  new Date(timestamp ?? Date.now()).toISOString().slice(0, 10);

async function updateLeaderboard({ retailerId, scanIncrement = 0, orderIncrement = 0, revenueIncrement = 0, eventDate }) {
  if (!retailerId) return;

  const period = normalizeDateKey(eventDate);

  const { data: existing, error } = await supabaseAdmin
    .from('leaderboards')
    .select('id, scan_count, order_count, revenue_total')
    .eq('period', period)
    .eq('retailer_id', retailerId)
    .maybeSingle();

  if (error) {
    console.error('[supabase-hook] Failed to read leaderboard slice', error.message);
    return;
  }

  const payload = {
    period,
    retailer_id: retailerId,
    scan_count: (existing?.scan_count ?? 0) + scanIncrement,
    order_count: (existing?.order_count ?? 0) + orderIncrement,
    revenue_total: (existing?.revenue_total ?? 0) + revenueIncrement,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin
    .from('leaderboards')
    .upsert(payload, { onConflict: 'period,retailer_id' });

  if (upsertError) {
    console.error('[supabase-hook] Failed to update leaderboard', upsertError.message);
  }
}

async function ensureOrderPayout(record) {
  if (!record?.id || !record?.total) return;

  const { data: existing, error } = await supabaseAdmin
    .from('payout_jobs')
    .select('id')
    .eq('order_id', record.id)
    .maybeSingle();

  if (error) {
    console.error('[supabase-hook] Failed to read payout job for order', error.message);
    return;
  }

  if (existing?.id) {
    return;
  }

  const retailerCut = Number((Number(record.total) * 0.2).toFixed(2));
  const vendorCut = Number((Number(record.total) - retailerCut).toFixed(2));

  const { error: insertError } = await supabaseAdmin.from('payout_jobs').insert({
    order_id: record.id,
    retailer_id: record.retailer_id ?? null,
    vendor_id: record.vendor_id ?? null,
    total_amount: record.total,
    retailer_cut: retailerCut,
    vendor_cut: vendorCut,
    source_uid: record.source_uid ?? null,
    status: 'pending',
  });

  if (insertError) {
    console.error('[supabase-hook] Failed to create payout job from hook', insertError.message);
  }
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return respond(res, 500, { error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'POST') {
    return respond(res, 405, { error: 'Method not allowed' });
  }

  const signature = getSecretHeader(req);

  if (!signature || signature !== env.SUPABASE_WEBHOOK_SECRET) {
    return respond(res, 401, { error: 'Invalid webhook signature' });
  }

  const event = req.body ?? {};

  try {
    if (event.table === 'orders' && event.type === 'INSERT') {
      await ensureOrderPayout(event.record);
      await updateLeaderboard({
        retailerId: event.record?.retailer_id ?? null,
        orderIncrement: 1,
        revenueIncrement: Number(event.record?.total ?? 0),
        eventDate: event.record?.processed_at ?? event.record?.created_at,
      });

      await logEvent('supabase-hook', 'order_insert', {
        order_id: event.record?.id,
        retailer_id: event.record?.retailer_id,
        vendor_id: event.record?.vendor_id,
      });
    }

    if (event.table === 'scans' && event.type === 'INSERT') {
      if (event.record?.uid) {
        await supabaseAdmin
          .from('uids')
          .update({
            last_scan_at: event.record.timestamp ?? new Date().toISOString(),
            last_scan_ip: event.record?.ip_address ?? null,
            last_scan_user_agent: event.record?.user_agent ?? null,
          })
          .eq('uid', event.record.uid);

        if (typeof supabaseAdmin.rpc === 'function') {
          await supabaseAdmin.rpc('increment_uid_scan_count', { p_uid: event.record.uid });
        }
      }

      await updateLeaderboard({
        retailerId: event.record?.retailer_id ?? null,
        scanIncrement: 1,
        eventDate: event.record?.timestamp,
      });

      await logEvent('supabase-hook', 'scan_insert', {
        uid: event.record?.uid,
        retailer_id: event.record?.retailer_id,
      });
    }

    return respond(res, 200, { ok: true });
  } catch (error) {
    console.error('[supabase-hook] Handler error', error);
    return respond(res, 500, { error: 'Internal server error' });
  }
}
