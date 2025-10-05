import crypto from 'crypto';

import { supabaseAdmin } from '../../lib/supabase';
import { env } from '../../lib/env';
import { logEvent } from '../../utils/logger';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

async function ensurePawpayaVendor() {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id')
    .eq('name', 'Pawpaya')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[shopify-webhook] Failed to resolve Pawpaya vendor id', error.message);
    return null;
  }

  return data?.id ?? null;
}

async function markLatestScanConverted(uid, revenue) {
  const { data: scan } = await supabaseAdmin
    .from('scans')
    .select('id')
    .eq('uid', uid)
    .eq('converted', false)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scan?.id) return;

  await supabaseAdmin
    .from('scans')
    .update({ converted: true, revenue })
    .eq('id', scan.id);
}

async function createPayoutJob(orderId, retailerId, vendorId, total, sourceUid) {
  if (!retailerId || !vendorId) return null;

  const retailerCut = Number((total * 0.2).toFixed(2));
  const vendorCut = Number((total - retailerCut).toFixed(2));

  const { data, error } = await supabaseAdmin
    .from('payout_jobs')
    .insert({
      order_id: orderId,
      retailer_id: retailerId,
      vendor_id: vendorId,
      retailer_cut: retailerCut,
      vendor_cut: vendorCut,
      total_amount: total,
      status: 'pending',
      source_uid: sourceUid ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[shopify-webhook] Failed to create payout job', error.message);
  }

  return data;
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];

    if (!hmacHeader) {
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    const digest = crypto.createHmac('sha256', env.SHOPIFY_WEBHOOK_SECRET).update(rawBody).digest('base64');

    const signatureBuffer = Buffer.from(hmacHeader, 'base64');
    const digestBuffer = Buffer.from(digest, 'base64');

    const validSignature =
      signatureBuffer.length === digestBuffer.length &&
      crypto.timingSafeEqual(digestBuffer, signatureBuffer);

    if (!validSignature) {
      console.warn('[shopify-webhook] Invalid HMAC signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = JSON.parse(rawBody.toString('utf8'));
    const shopDomain = req.headers['x-shopify-shop-domain'] || null;

    const refAttr = order?.note_attributes?.find?.((attr) => attr?.name === 'ref');
    const uid = refAttr?.value ?? null;

    let retailerId = null;
    let businessId = null;

    if (uid) {
      const { data: uidRecord, error: uidError } = await supabaseAdmin
        .from('uids')
        .select('id, retailer_id, business_id')
        .eq('uid', uid)
        .maybeSingle();

      if (uidError) {
        console.error('[shopify-webhook] Failed to fetch UID record', uidError.message);
      } else {
        retailerId = uidRecord?.retailer_id ?? null;
        businessId = uidRecord?.business_id ?? null;
      }
    }

    const pawpayaVendorId = await ensurePawpayaVendor();

    const orderRecord = {
      shopify_order_id: String(order.id),
      shopify_order_number: order.order_number ? String(order.order_number) : null,
      shop_domain: shopDomain,
      customer_email: order.email ?? order.customer?.email ?? null,
      customer_name: order.customer ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim() : null,
      currency: order.currency ?? 'USD',
      total: toNumber(order.total_price),
      subtotal: toNumber(order.subtotal_price),
      tax_total: toNumber(order.total_tax),
      discount_total: toNumber(order.total_discounts),
      financial_status: order.financial_status ?? null,
      fulfillment_status: order.fulfillment_status ?? null,
      processed_at: order.created_at ?? new Date().toISOString(),
      source_uid: uid,
      retailer_id: retailerId,
      business_id: businessId,
      vendor_id: pawpayaVendorId,
      line_items: order.line_items ?? [],
      raw_payload: order,
    };

    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('shopify_order_id', orderRecord.shopify_order_id)
      .maybeSingle();

    let orderId = existingOrder?.id ?? null;

    if (existingOrder) {
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update(orderRecord)
        .eq('id', existingOrder.id);

      if (updateError) {
        console.error('[shopify-webhook] Failed to update existing order', updateError.message);
      }
    } else {
      const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert(orderRecord)
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('[shopify-webhook] Failed to insert order', insertError.message);
        throw insertError;
      }

      orderId = insertedOrder?.id ?? null;
    }

    if (orderId && orderRecord.total > 0) {
      await createPayoutJob(orderId, retailerId, pawpayaVendorId, orderRecord.total, uid);
    }

    if (uid && orderRecord.total > 0) {
      await markLatestScanConverted(uid, orderRecord.total);
    }

    if (uid) {
      await supabaseAdmin
        .from('uids')
        .update({
          last_order_at: new Date().toISOString(),
          last_order_total: orderRecord.total,
        })
        .eq('uid', uid);
    }

    await logEvent('shopify-webhook', 'order_received', {
      shop_domain: shopDomain,
      shopify_order_id: orderRecord.shopify_order_id,
      retailer_id: retailerId,
      total: orderRecord.total,
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[shopify-webhook] Handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
