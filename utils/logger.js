import { supabase, supabaseAdmin } from '../lib/supabase';

const getClient = (clientOverride) => {
  if (clientOverride) return clientOverride;
  if (supabaseAdmin) return supabaseAdmin;
  return supabase;
};

/**
 * Log an event to the Supabase logs table
 * @param {string} userId - The ID of the user performing the action
 * @param {string} action - The action being performed (e.g., 'user_login', 'payout_initiated')
 * @param {Object} metadata - Additional metadata about the event
 * @returns {Promise<Object>} Result object with data or error
 */
export async function logEvent(userId, action, metadata = {}, clientOverride) {
  try {
    // Validate required parameters
    if (!userId || !action) {
      console.error('logEvent: userId and action are required');
      return { data: null, error: 'Missing required parameters' };
    }

    const client = getClient(clientOverride);

    if (!client) {
      console.warn('logEvent: Supabase client unavailable');
      return { data: null, error: 'Supabase client unavailable' };
    }

    // Create log entry
    const logEntry = {
      user_id: userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
    };

    // Insert into logs table
    const { data, error } = await client
      .from('logs')
      .insert([logEntry])
      .select();

    if (error) {
      console.error('Error logging event:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in logEvent:', error);
    return { data: null, error: error.message };
  }
}

export default logEvent;
