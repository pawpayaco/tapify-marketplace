import { supabaseAdmin } from '../../../lib/supabase';
import { requireAdmin } from '../../../lib/api-auth';

/**
 * Get all retailers with their payout jobs, UIDs, and sales data
 * GET /api/admin/retailer-payouts
 * Query params:
 *  - status: 'pending' | 'paid' | 'all' (default: 'pending')
 */
export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);

    const { status = 'pending' } = req.query;

    // Step 1: Get all retailers
    const { data: retailers, error: retailersError } = await supabaseAdmin
      .from('retailers')
      .select('id, name, email, location, created_at, converted, onboarding_completed')
      .eq('converted', true)
      .eq('onboarding_completed', true)
      .order('name');

    if (retailersError) {
      console.error('[retailer-payouts] Error fetching retailers:', retailersError);
      return res.status(500).json({ error: retailersError.message });
    }

    // Step 2: Get all payout jobs (filter by status if needed)
    let payoutQuery = supabaseAdmin
      .from('payout_jobs')
      .select(`
        *,
        vendors:vendor_id (name, email),
        retailers:retailer_id (name, email, location),
        sourcer_accounts:sourcer_id (name, email)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      payoutQuery = payoutQuery.eq('status', status);
    }

    const { data: payoutJobs, error: payoutError } = await payoutQuery;

    if (payoutError) {
      console.error('[retailer-payouts] Error fetching payout jobs:', payoutError);
      return res.status(500).json({ error: payoutError.message });
    }

    // Step 3: Get all UIDs
    const { data: uids, error: uidsError } = await supabaseAdmin
      .from('uids')
      .select('uid, retailer_id, is_claimed, registered_at, affiliate_url')
      .eq('is_claimed', true)
      .order('registered_at', { ascending: false });

    if (uidsError) {
      console.error('[retailer-payouts] Error fetching UIDs:', uidsError);
      return res.status(500).json({ error: uidsError.message });
    }

    // Step 4: Get all orders for context
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, shopify_order_id, retailer_id, total, processed_at, product_name, source_uid')
      .order('processed_at', { ascending: false })
      .limit(1000);

    if (ordersError) {
      console.error('[retailer-payouts] Error fetching orders:', ordersError);
      return res.status(500).json({ error: ordersError.message });
    }

    // Step 5: Group data by retailer
    const retailerPayoutData = retailers.map(retailer => {
      // Get all payout jobs for this retailer
      const retailerPayouts = payoutJobs.filter(p => p.retailer_id === retailer.id);

      // Get all UIDs for this retailer
      const retailerUids = uids.filter(u => u.retailer_id === retailer.id);

      // Get all orders for this retailer
      const retailerOrders = orders.filter(o => o.retailer_id === retailer.id);

      // Calculate totals
      const pendingEarnings = retailerPayouts
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);

      const paidEarnings = retailerPayouts
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);

      const totalEarnings = pendingEarnings + paidEarnings;

      const pendingCount = retailerPayouts.filter(p => p.status === 'pending').length;
      const paidCount = retailerPayouts.filter(p => p.status === 'paid').length;

      return {
        retailer: {
          id: retailer.id,
          name: retailer.name,
          email: retailer.email,
          location: retailer.location,
          created_at: retailer.created_at
        },
        uids: retailerUids.map(u => ({
          uid: u.uid,
          registered_at: u.registered_at,
          affiliate_url: u.affiliate_url
        })),
        payouts: retailerPayouts,
        orders: retailerOrders,
        summary: {
          pending_earnings: pendingEarnings,
          paid_earnings: paidEarnings,
          total_earnings: totalEarnings,
          pending_count: pendingCount,
          paid_count: paidCount,
          total_orders: retailerOrders.length,
          uid_count: retailerUids.length
        }
      };
    });

    // Filter out retailers with no data if status is not 'all'
    const filteredData = status === 'all'
      ? retailerPayoutData
      : retailerPayoutData.filter(r => r.payouts.length > 0);

    return res.status(200).json({
      success: true,
      retailers: filteredData,
      totals: {
        total_retailers: filteredData.length,
        total_pending: filteredData.reduce((sum, r) => sum + r.summary.pending_earnings, 0),
        total_paid: filteredData.reduce((sum, r) => sum + r.summary.paid_earnings, 0),
        total_payouts: payoutJobs.length
      }
    });
  } catch (error) {
    console.error('[retailer-payouts] Unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
