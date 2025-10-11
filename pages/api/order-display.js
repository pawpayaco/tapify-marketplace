import { requireSession } from '../../lib/api-auth.js';
import { supabaseAdmin } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require authentication
    const session = await requireSession(req, res);
    const user = session.user;

    const { storeName, managerName, address } = req.body;

    // Validate required fields
    if (!storeName || !address) {
      return res.status(400).json({ error: 'Store name and address are required' });
    }

    // Find the retailer for this user
    const { data: retailer, error: retailerError } = await supabaseAdmin
      .from('retailers')
      .select('id, displays_ordered')
      .eq('created_by_user_id', user.id)
      .maybeSingle();

    if (retailerError || !retailer) {
      console.error('[order-display] Retailer lookup error:', retailerError);
      return res.status(404).json({ error: 'Retailer not found for this user' });
    }

    // Create a new retailer entry for the additional store location
    const { data: newStore, error: createError } = await supabaseAdmin
      .from('retailers')
      .insert({
        name: storeName,
        address: address,
        created_by_user_id: user.id,
        source: 'order_additional_display'
      })
      .select()
      .maybeSingle();

    if (createError) {
      console.error('[order-display] Failed to create store:', createError);
      return res.status(500).json({ error: 'Failed to create store', details: createError.message });
    }

    // Increment displays_ordered count for the main retailer
    const newCount = (retailer.displays_ordered || 1) + 1;
    const { error: updateError } = await supabaseAdmin
      .from('retailers')
      .update({ displays_ordered: newCount })
      .eq('id', retailer.id);

    if (updateError) {
      console.error('[order-display] Failed to update displays_ordered:', updateError);
      // Don't fail the request, the store was created successfully
    }

    console.log('[order-display] Display ordered successfully:', {
      userId: user.id,
      retailerId: retailer.id,
      newStoreId: newStore.id,
      newCount
    });

    return res.status(200).json({
      success: true,
      store: newStore,
      displays_ordered: newCount
    });

  } catch (error) {
    console.error('[order-display] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
