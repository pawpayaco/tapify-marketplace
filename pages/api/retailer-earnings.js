import { supabase } from '../../lib/supabase';

/**
 * Get earnings data for the logged-in retailer
 * GET /api/retailer-earnings
 */
export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not configured' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get retailer record
    const { data: retailer, error: retailerError } = await supabase
      .from('retailers')
      .select('id, name, email')
      .eq('created_by_user_id', user.id)
      .maybeSingle();

    if (retailerError) {
      console.error('[retailer-earnings] Error fetching retailer:', retailerError);
      return res.status(500).json({ error: retailerError.message });
    }

    if (!retailer) {
      // Try fallback by email
      const { data: emailRetailer, error: emailError } = await supabase
        .from('retailers')
        .select('id, name, email')
        .eq('email', user.email)
        .maybeSingle();

      if (emailError || !emailRetailer) {
        return res.status(404).json({ error: 'Retailer not found' });
      }

      retailer.id = emailRetailer.id;
      retailer.name = emailRetailer.name;
      retailer.email = emailRetailer.email;
    }

    // Get payout jobs for this retailer
    const { data: payoutJobs, error: payoutError } = await supabase
      .from('payout_jobs')
      .select('*')
      .eq('retailer_id', retailer.id)
      .order('created_at', { ascending: false });

    if (payoutError) {
      console.error('[retailer-earnings] Error fetching payout jobs:', payoutError);
      return res.status(500).json({ error: payoutError.message });
    }

    // Calculate earnings
    const pendingEarnings = (payoutJobs || [])
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);

    const paidEarnings = (payoutJobs || [])
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.retailer_cut || 0), 0);

    const totalEarnings = pendingEarnings + paidEarnings;

    return res.status(200).json({
      success: true,
      retailer: {
        id: retailer.id,
        name: retailer.name,
        email: retailer.email
      },
      earnings: {
        pending: pendingEarnings,
        paid: paidEarnings,
        total: totalEarnings
      },
      payouts: payoutJobs || [],
      counts: {
        pending: (payoutJobs || []).filter(p => p.status === 'pending').length,
        paid: (payoutJobs || []).filter(p => p.status === 'paid').length,
        total: (payoutJobs || []).length
      }
    });
  } catch (error) {
    console.error('[retailer-earnings] Unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
