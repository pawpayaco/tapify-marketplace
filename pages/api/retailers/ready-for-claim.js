import { supabaseAdmin } from '../../../lib/supabase';

const CLAIMABLE_DISPLAY_STATUSES = ['priority_queue', 'standard_queue', 'active', 'shipped'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('displays')
      .select(`
        id,
        status,
        location,
        retailers:retailer_id!inner (
          id,
          name,
          address,
          location,
          onboarding_completed,
          converted
        )
      `)
      .in('status', CLAIMABLE_DISPLAY_STATUSES)
      .eq('retailers.converted', true)
      .eq('retailers.onboarding_completed', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ready-for-claim] Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to load claimable retailers' });
    }

    const retailersMap = new Map();

    (data || []).forEach((display) => {
      const retailer = display.retailers;
      if (!retailer?.id) {
        return;
      }

      if (!CLAIMABLE_DISPLAY_STATUSES.includes(display.status)) {
        return;
      }

      if (!retailer.converted || !retailer.onboarding_completed) {
        return;
      }

      const existing = retailersMap.get(retailer.id);

      const normalized = {
        id: retailer.id,
        name: retailer.name,
        address: retailer.address || retailer.location || '',
        shippingStatus: display.status,
        displayLocation: display.location || retailer.address || retailer.location || '',
        displayId: display.id,
      };

      if (!existing) {
        retailersMap.set(retailer.id, normalized);
        return;
      }

      // Prefer the most "active" status when multiple displays exist.
      const statusRank = {
        active: 3,
        shipped: 3,
        priority_queue: 2,
        standard_queue: 1,
      };

      const currentRank = statusRank[existing.shippingStatus] ?? 0;
      const incomingRank = statusRank[display.status] ?? 0;

      if (incomingRank > currentRank) {
        retailersMap.set(retailer.id, normalized);
      }
    });

    const results = Array.from(retailersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({ results });
  } catch (err) {
    console.error('[ready-for-claim] Handler error:', err);
    return res.status(500).json({ error: 'Failed to load claimable retailers' });
  }
}

