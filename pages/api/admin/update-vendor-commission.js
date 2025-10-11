import { supabaseAdmin } from '../../../lib/supabase';
import { requireAdmin } from '../../../lib/api-auth';

/**
 * Update vendor commission percentages
 * POST /api/admin/update-vendor-commission
 * Body: { vendorId, retailerPercent, sourcerPercent, tapifyPercent }
 */
export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);

    const { vendorId, retailerPercent, sourcerPercent, tapifyPercent } = req.body;

    if (!vendorId) {
      return res.status(400).json({ error: 'Missing vendorId' });
    }

    // Validate percentages
    const retailer = parseFloat(retailerPercent || 0);
    const sourcer = parseFloat(sourcerPercent || 0);
    const tapify = parseFloat(tapifyPercent || 0);

    if (retailer < 0 || retailer > 100) {
      return res.status(400).json({ error: 'Retailer percent must be between 0 and 100' });
    }

    if (sourcer < 0 || sourcer > 100) {
      return res.status(400).json({ error: 'Sourcer percent must be between 0 and 100' });
    }

    if (tapify < 0 || tapify > 100) {
      return res.status(400).json({ error: 'Tapify percent must be between 0 and 100' });
    }

    // Calculate vendor percent (what's left)
    const total = retailer + sourcer + tapify;
    if (total > 100) {
      return res.status(400).json({
        error: `Total percentages (${total}%) exceed 100%`,
        breakdown: { retailer, sourcer, tapify, total }
      });
    }

    const vendor = 100 - total;

    // Update vendor record
    const { data, error } = await supabaseAdmin
      .from('vendors')
      .update({
        retailer_commission_percent: retailer,
        sourcer_commission_percent: sourcer,
        tapify_commission_percent: tapify,
        vendor_commission_percent: vendor,
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (error) {
      console.error('[update-vendor-commission] Error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      vendor: data,
      breakdown: {
        retailer: `${retailer}%`,
        sourcer: `${sourcer}%`,
        tapify: `${tapify}%`,
        vendor: `${vendor}%`,
      }
    });
  } catch (error) {
    console.error('[update-vendor-commission] Unexpected error:', error);
    return res.status(500).json({ error: error.message });
  }
}
