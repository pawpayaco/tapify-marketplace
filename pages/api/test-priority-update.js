import { supabaseAdmin } from '../../lib/supabase';

/**
 * Test endpoint to verify priority display update logic
 * Usage: POST /api/test-priority-update
 * Body: { "email": "customer@email.com" }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, adminSecret } = req.body;

  // Simple auth check
  if (adminSecret !== '123abc123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    console.log('[test-priority-update] Testing for email:', email);

    // Step 1: Check if retailer exists
    const { data: retailer, error: retailerError } = await supabaseAdmin
      .from('retailers')
      .select('id, name, email, priority_display_active')
      .eq('email', email)
      .maybeSingle();

    if (retailerError) {
      console.error('[test-priority-update] Error fetching retailer:', retailerError);
      return res.status(500).json({
        error: 'Database error',
        details: retailerError.message
      });
    }

    if (!retailer) {
      console.log('[test-priority-update] No retailer found with email:', email);
      return res.status(404).json({
        error: 'Retailer not found',
        email: email,
        suggestion: 'Check if email matches exactly (case-sensitive)'
      });
    }

    console.log('[test-priority-update] Retailer found:', {
      id: retailer.id,
      name: retailer.name,
      current_priority_status: retailer.priority_display_active
    });

    // Step 2: Update priority_display_active flag
    const { error: updateError } = await supabaseAdmin
      .from('retailers')
      .update({ priority_display_active: true })
      .eq('id', retailer.id);

    if (updateError) {
      console.error('[test-priority-update] Error updating retailer:', updateError);
      return res.status(500).json({
        error: 'Failed to update',
        details: updateError.message
      });
    }

    console.log('[test-priority-update] ✅ Successfully updated retailer:', retailer.id);

    // Step 3: Verify update
    const { data: updated, error: verifyError } = await supabaseAdmin
      .from('retailers')
      .select('id, name, email, priority_display_active')
      .eq('id', retailer.id)
      .single();

    if (verifyError) {
      console.error('[test-priority-update] Error verifying update:', verifyError);
    }

    return res.status(200).json({
      success: true,
      message: 'Priority display activated',
      retailer: {
        id: retailer.id,
        name: retailer.name,
        email: retailer.email,
        before: retailer.priority_display_active,
        after: updated?.priority_display_active
      }
    });

  } catch (error) {
    console.error('[test-priority-update] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
