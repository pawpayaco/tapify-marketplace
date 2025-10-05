// pages/api/stores/bulk-update.js
// Bulk operations for stores (mark cold email sent, etc.)

import { supabaseAdmin } from '../../../lib/supabase';
import { requireAdmin, AuthError } from '../../../lib/api-auth';
import { logEvent } from '../../../utils/logger';

/**
 * POST /api/stores/bulk-update
 * 
 * Bulk update retailers (e.g., mark cold_email_sent for multiple stores)
 * 
 * Request body:
 * {
 *   retailer_ids: string[] (required),
 *   action: 'mark_cold_email_sent' | 'mark_converted' (required),
 *   campaign: string (optional, for tracking)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[bulk-update] Admin auth error:', error);
    return res.status(500).json({ error: 'Failed to verify admin session' });
  }

  const { retailer_ids, action, campaign } = req.body;

  // Validate required fields
  if (!retailer_ids || !Array.isArray(retailer_ids) || retailer_ids.length === 0) {
    return res.status(400).json({ 
      error: 'retailer_ids must be a non-empty array',
      ok: false 
    });
  }

  if (!action) {
    return res.status(400).json({ 
      error: 'action is required',
      ok: false 
    });
  }

  // Check if admin client is available
  if (!supabaseAdmin) {
    return res.status(500).json({
      error: 'Admin client not configured',
      ok: false,
    });
  }

  try {
    let updateData = {};
    
    // Determine what to update based on action
    switch (action) {
      case 'mark_cold_email_sent':
        updateData = {
          cold_email_sent: true,
          cold_email_sent_at: new Date().toISOString(),
        };
        break;
        
      case 'mark_converted':
        updateData = {
          converted: true,
          converted_at: new Date().toISOString(),
        };
        break;
        
      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          ok: false,
        });
    }

    // Perform bulk update
    const { data, error, count } = await supabaseAdmin
      .from('retailers')
      .update(updateData)
      .in('id', retailer_ids)
      .select();

    if (error) {
      throw error;
    }

    // If campaign is provided and action is mark_cold_email_sent, 
    // create outreach records
    if (campaign && action === 'mark_cold_email_sent') {
      const outreachRecords = retailer_ids.map(id => ({
        retailer_id: id,
        campaign,
        channel: 'email',
        registered: false,
        notes: `Cold email sent via bulk action`,
      }));

      const { error: outreachError } = await supabaseAdmin
        .from('retailer_outreach')
        .insert(outreachRecords);

      if (outreachError) {
        console.error('[bulk-update] Failed to create outreach records:', outreachError);
        // Don't fail the whole operation, just log the error
      }
    }

    await logEvent('admin', 'stores_bulk_update', {
      action,
      retailer_ids: retailer_ids.length,
    });

    return res.status(200).json({
      ok: true,
      message: `Successfully updated ${count || retailer_ids.length} retailers`,
      count: count || retailer_ids.length,
      data,
    });

  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[bulk-update] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to update retailers',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
