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

async function createPayoutJob(orderId, retailerId, vendorId, total, sourceUid, hasPriorityDisplay = false) {
  if (!retailerId || !vendorId) {
    console.warn('[shopify-webhook] Cannot create payout job - missing retailerId or vendorId');
    return null;
  }

  const { data: retailer } = await supabaseAdmin
    .from('retailers')
    .select('recruited_by_sourcer_id')
    .eq('id', retailerId)
    .maybeSingle();

  const sourcerId = retailer?.recruited_by_sourcer_id ?? null;

  // Phase 1 (No Sourcer): Retailer 20%, Vendor 80%
  // Phase 2 (With Sourcer): Retailer 20%, Vendor 60%, Sourcer 10%, Tapify 10%
  const retailerCut = Number((total * 0.2).toFixed(2));

  const vendorCut = sourcerId
    ? Number((total * 0.60).toFixed(2))  // Phase 2: 60%
    : Number((total - retailerCut).toFixed(2));  // Phase 1: 80%

  const sourcerCut = sourcerId
    ? Number((total * 0.10).toFixed(2))  // Phase 2: 10%
    : 0;

  const tapifyCut = sourcerId
    ? Number((total * 0.10).toFixed(2))  // Phase 2: 10%
    : 0;

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
      tapify_cut: tapifyCut,  // Added for Phase 2 four-party splits
      total_amount: total,
      status: hasPriorityDisplay ? 'priority_display' : 'pending',
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
      // Check if ref is in retailer-{id} format (fallback for new registrations without claimed UIDs)
      if (uid.startsWith('retailer-')) {
        const extractedRetailerId = uid.replace('retailer-', '');
        console.log('[shopify-webhook] Detected retailer-id format ref:', extractedRetailerId);

        // Verify retailer exists
        const { data: retailerRecord, error: retailerError } = await supabaseAdmin
          .from('retailers')
          .select('id, business_id')
          .eq('id', extractedRetailerId)
          .maybeSingle();

        if (retailerError) {
          console.error('[shopify-webhook] Failed to fetch retailer record', retailerError.message);
        } else if (retailerRecord) {
          retailerId = retailerRecord.id;
          businessId = retailerRecord.business_id ?? null;
          console.log('[shopify-webhook] ✅ Retailer attribution via retailer-id format:', retailerId);
        } else {
          console.warn('[shopify-webhook] ⚠️ Retailer ID not found in database:', extractedRetailerId);
        }
      } else {
        // Standard UID format - lookup in uids table
        const { data: uidRecord, error: uidError } = await supabaseAdmin
          .from('uids')
          .select('uid, retailer_id, business_id, is_claimed')
          .eq('uid', uid)
          .maybeSingle();

        if (uidError) {
          console.error('[shopify-webhook] Failed to fetch UID record', uidError.message);
        } else if (uidRecord) {
          retailerId = uidRecord?.retailer_id ?? null;
          businessId = uidRecord?.business_id ?? null;

          // ✅ IMPROVED: Log warning if UID is unclaimed
          if (!uidRecord.is_claimed) {
            console.warn('[shopify-webhook] ⚠️ UID is UNCLAIMED:', uid, '- order will record but payout may be delayed');
          }
        } else {
          console.warn('[shopify-webhook] ⚠️ UID not found in database:', uid);
        }
      }
    } else {
      console.log('[shopify-webhook] No UID provided in order note_attributes');
    }

    const pawpayaVendorId = await ensurePawpayaVendor();

    // Detect Priority Display product
    const hasPriorityDisplay = order.line_items?.some(item =>
      item.title?.toLowerCase().includes('priority display') ||
      item.title?.toLowerCase().includes('priority placement')
    );

    console.log('[shopify-webhook] Priority Display detected:', hasPriorityDisplay);

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
      is_priority_display: hasPriorityDisplay,  // ✅ FIXED: Ensure boolean type
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
      // ✅ Automatically fill missing NOT NULL columns before inserting
      const safeOrderRecord = await fillMissingDefaults('orders', orderRecord);

      const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert(safeOrderRecord)
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('[shopify-webhook] Failed to insert order', insertError.message);
        console.error('[shopify-webhook] Error details:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }
      orderId = insertedOrder?.id ?? null;
    }

    // Update retailer priority_display_active flag if Priority Display was purchased
    if (hasPriorityDisplay && retailerId) {
      console.log('[shopify-webhook] Priority Display detected, updating retailer flag for retailer:', retailerId);
      const { error: retailerUpdateError } = await supabaseAdmin
        .from('retailers')
        .update({ priority_display_active: true })
        .eq('id', retailerId);

      if (retailerUpdateError) {
        console.error('[shopify-webhook] Failed to update retailer priority flag', retailerUpdateError.message);
      } else {
        console.log('[shopify-webhook] ✅ Priority Display order processed for retailer:', retailerId);
      }
    }

    // ✅ IMPROVED: Better handling of missing retailer_id
    if (orderId && orderRecord.total > 0) {
      if (retailerId) {
        const payoutJob = await createPayoutJob(
          orderId,
          retailerId,
          pawpayaVendorId,
          orderRecord.total,
          uid,
          hasPriorityDisplay
        );
        if (payoutJob) {
          console.log('[shopify-webhook] ✅ Payout job created:', payoutJob.id);
        }
      } else {
        console.warn(
          '[shopify-webhook] ⚠️ No retailer_id for order - payout_job skipped.',
          'Order:', orderId,
          'UID:', uid || 'none'
        );
        // TODO: Optionally create a "pending_claim" payout job for manual admin review
      }
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
      if (businessUpdateError) {
        console.error('[shopify-webhook] Failed to update business', businessUpdateError.message);
      }
    }

    await logEvent('shopify-webhook', 'order_received', {
      shop_domain: shopDomain,
      shopify_order_id: orderRecord.shopify_order_id,
      retailer_id: retailerId,
      total: orderRecord.total,
      is_priority_display: hasPriorityDisplay,
    });

    console.log('[shopify-webhook] ✅ Webhook processed successfully');
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[shopify-webhook] Handler error', error);
    console.error('[shopify-webhook] Stack trace:', error.stack);

    // Log to error tracking
    await logEvent('shopify-webhook', 'processing_error', {
      error: error.message,
      stack: error.stack,
      order_id: order?.id
    });

    // CRITICAL: Always return 200 to prevent Shopify retry spam
    // Returning 500 causes Shopify to retry for 48 hours
    return res.status(200).json({
      received: true,
      error: 'processing_error',
      message: 'Order received but processing failed'
    });
  }
}
