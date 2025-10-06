// pages/api/manager-register.js
// POST - Register a manager's phone number for rewards

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
    console.error('[ManagerRegister] Supabase admin client not configured');
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate phone number format (should be at least 10 digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Upsert manager record
    const { data, error } = await supabaseAdmin
      .from('managers')
      .upsert(
        {
          phone: cleanPhone,
          reward_sent: false,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'phone',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[ManagerRegister] Supabase error:', error);
      return res.status(500).json({
        error: 'Failed to register manager',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log(`[ManagerRegister] Registered manager ${cleanPhone}`);

    return res.status(200).json({
      success: true,
      manager: {
        phone: data.phone,
        referral_url: `https://tapify-marketplace.vercel.app/onboard?ref=${encodeURIComponent(cleanPhone)}`
      }
    });
  } catch (err) {
    console.error('[ManagerRegister] Unexpected error:', err);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
