import { supabase } from '../supabase';

/**
 * Verify Priority Display Status
 *
 * Checks if a retailer has an active priority display by querying
 * the retailers table for the priority_display_active flag.
 *
 * This function is used to confirm webhook updates before showing UI changes.
 *
 * @param {string} retailerId - The retailer ID to verify
 * @returns {Promise<boolean>} - True if priority display is active, false otherwise
 */
export async function verifyPriorityDisplay(retailerId) {
  if (!retailerId) {
    console.error('[verifyPriorityDisplay] No retailerId provided');
    return false;
  }

  if (!supabase) {
    console.error('[verifyPriorityDisplay] Supabase client not available');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('retailers')
      .select('priority_display_active')
      .eq('id', retailerId)
      .maybeSingle();

    if (error) {
      console.error('[verifyPriorityDisplay] Error:', error.message);
      return false;
    }

    const isActive = data?.priority_display_active === true;
    console.log('[verifyPriorityDisplay] Retailer', retailerId, 'active:', isActive);
    return isActive;
  } catch (err) {
    console.error('[verifyPriorityDisplay] Unexpected error:', err);
    return false;
  }
}
