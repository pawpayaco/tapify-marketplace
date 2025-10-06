// pages/api/track-share.js
// POST - Track when a manager shares their referral link

import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    console.error('[TrackShare] Supabase admin client not configured');
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { phone, method, url } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Share method is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Insert share event into referral_events table
    const { error: eventError } = await supabaseAdmin
      .from('referral_events')
      .insert({
        manager_phone: cleanPhone,
        event_type: 'share',
        metadata: {
          method: method,
          referral_url: url || `https://tapify-marketplace.vercel.app/onboard?ref=${encodeURIComponent(cleanPhone)}`,
          shared_at: new Date().toISOString()
        }
      });

    if (eventError) {
      console.error('[TrackShare] Error inserting referral event:', eventError);
      // Don't fail the request if tracking fails
    }

    // Update manager's total_referrals count
    const { error: updateError } = await supabaseAdmin
      .from('managers')
      .update({
        total_referrals: supabaseAdmin.raw('total_referrals + 1')
      })
      .eq('phone', cleanPhone);

    if (updateError) {
      console.error('[TrackShare] Error updating manager referrals:', updateError);
      // Don't fail the request if update fails
    }

    console.log(`[TrackShare] Tracked share for manager ${cleanPhone} via ${method}`);

    return res.status(200).json({
      success: true,
      message: 'Share tracked successfully'
    });
  } catch (err) {
    console.error('[TrackShare] Unexpected error:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
