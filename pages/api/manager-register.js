// pages/api/manager-register.js
// POST - Register a manager's phone number for rewards

import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Missing phone' });
    }

    const { error } = await supabaseAdmin
      .from('managers')
      .upsert({ phone, reward_sent: false }, { onConflict: 'phone' });

    if (error) {
      console.error('[ManagerRegister] Error:', error);
      throw error;
    }

    console.log(`[ManagerRegister] Saved phone ${phone}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[ManagerRegister] Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
