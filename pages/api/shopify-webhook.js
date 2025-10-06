import crypto from 'crypto';
import { fillMissingDefaults } from '../../utils/fillDefaults';
import { supabaseAdmin } from '../../lib/supabase';
import { env } from '../../lib/env';
import { logEvent } from '../../utils/logger';

export const config = {
  api: { bodyParser: false },
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

  const { data: retailer } = await supabaseAdmin
    .from('retailers')
    .select('recruited_by_sourcer_id')
    .eq('id', retailerId)
    .maybeSingle();

  const sourcerId = retailer?.recruited_by_sourcer_id ?? null;
  const retailerCut = Number((total * 0.2).toFixed(2));
  const vendorCut = Number((total - retailerCut).toFixed(2));
  const sourcerCut = sourcerId ? Number((total * 0.05).toFixed(2)) : 0;

  const { data, error } = await supabaseAdmin
    .from('payout_jobs')
    .insert({
      order_id: orderId,
      retailer_id: retailerId,
      vendor_id: vendorId,
      sourcer_id: sourcerId,
      retailer_cut: retailerCut,
      vendor_cut: vendorCut,
      sourcer_cut: sourcerCut,
      total_amount: total,
      status: 'pending',
      source_uid: sourceUid ?? null,
    })
    .select('id')
    .maybeSingle();

  if (error) console.error('[shopify-webhook] Failed to create payout job', error.message);
  return data;
}

export default async function handler(req, res) {
  if (!supabaseAdmin)
    return res.status(500).json({ error: 'Supabase admin client not configured' });

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const rawBody = await getRawBody(req);
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];

    if (!hmacHeader) return res.status(401).json({ error: 'Missing HMAC signature' });

    const digest = crypto
      .createHmac('sha256', env.SHOPIFY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('base64');

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
        .select('uid, retailer_id, business_id')
        .eq('uid', uid)
        .maybeSingle();

      if (uidError)
        console.error('[shopify-webhook] Failed to fetch UID record', uidError.message);
      else {
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
      customer_name: order.customer
        ? `${order.customer.first_name ?? ''} ${order.customer.last_name ?? ''}`.trim()
        : null,
      currency: order.currency ?? 'USD',
      total: toNumber(order.total_price),
      subtotal: toNumber(order.subtotal_price),
      tax_total: toNumber(order.total_tax),
      discount_total: toNumber(order.total_discounts),
      product_name: order?.line_items?.[0]?.title ?? 'Unknown Product',
      amount: toNumber(order.total_price ?? order.subtotal_price ?? 0),
      commission: Number((order.total_price * 0.2).toFixed(2)),
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
      if (updateError)
        console.error('[shopify-webhook] Failed to update existing order', updateError.message);
    } else {
      // ✅ Automatically fill missing NOT NULL columns before inserting
      const safeOrderRecord = await fillMissingDefaults('orders', orderRecord);

      const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert(safeOrderRecord)
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('[shopify-webhook] Failed to insert order', insertError.message);
        throw insertError;
      }
      orderId = insertedOrder?.id ?? null;
    }

    if (orderId && orderRecord.total > 0)
      await createPayoutJob(orderId, retailerId, pawpayaVendorId, orderRecord.total, uid);

    if (uid && orderRecord.total > 0)
      await markLatestScanConverted(uid, orderRecord.total);

    if (uid)
      await supabaseAdmin
        .from('uids')
        .update({
          last_order_at: new Date().toISOString(),
          last_order_total: orderRecord.total,
        })
        .eq('uid', uid);

    // Optional: business express shipping flag
    const hasExpressShipping = order.line_items?.some(
      (item) =>
        item.product_id &&
        item.variant_id &&
        (item.title?.toLowerCase().includes('express') ||
          item.title?.toLowerCase().includes('priority') ||
          item.sku?.toLowerCase().includes('priority'))
    );

    if (hasExpressShipping && businessId) {
      console.log('[shopify-webhook] Express shipping purchase detected');
      const { error: businessUpdateError } = await supabaseAdmin
        .from('businesses')
        .update({ display_shipping: true })
        .eq('id', businessId);
      if (businessUpdateError)
        console.error('[shopify-webhook] Failed to update business', businessUpdateError.message);
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
