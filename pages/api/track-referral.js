import { supabaseAdmin } from '../../lib/supabase';

/**
 * Track referral events
 * POST /api/track-referral
 *
 * Body:
 * {
 *   manager_phone: string (required)
 *   retailer_id?: uuid (optional, set when event is 'register' or 'reward_sent')
 *   event_type: 'share' | 'view' | 'register' | 'reward_sent' (required)
 *   metadata?: object (optional)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { manager_phone, retailer_id, event_type, metadata } = req.body;

    // Validate required fields
    if (!manager_phone || !event_type) {
      return res.status(400).json({
        error: 'Missing required fields: manager_phone and event_type are required'
      });
    }

    // Validate event_type
    const validEventTypes = ['share', 'view', 'register', 'reward_sent'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}`
      });
    }

    // Check if Supabase admin is configured
    if (!supabaseAdmin) {
      console.error('[track-referral] Supabase admin client not configured');
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Insert the event
    const { data, error } = await supabaseAdmin
      .from('referral_events')
      .insert([
        {
          manager_phone,
          retailer_id: retailer_id || null,
          event_type,
          metadata: metadata || {}
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[track-referral] Database error:', error);
      return res.status(500).json({ error: 'Failed to log event' });
    }

    console.log(`[Referral] ${event_type} logged for ${manager_phone}${retailer_id ? ` → retailer ${retailer_id}` : ''}`);

    return res.status(200).json({
      success: true,
      event: data
    });
  } catch (err) {
    console.error('[track-referral] Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
