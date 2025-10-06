// pages/api/send-reward.js
// POST - Send reward SMS to manager when their referred retailer converts

import { supabaseAdmin } from '../../lib/supabase';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('[SendReward] Missing Twilio credentials');
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  try {
    const { retailer_id } = req.body;

    if (!retailer_id) {
      return res.status(400).json({ error: 'Missing retailer_id' });
    }

    // Get retailer and manager phone
    const { data: retailer, error: retailerError } = await supabaseAdmin
      .from('retailers')
      .select('manager_phone')
      .eq('id', retailer_id)
      .single();

    if (retailerError || !retailer?.manager_phone) {
      console.error('[SendReward] Manager not found:', retailerError);
      return res.status(404).json({ error: 'Manager not found' });
    }

    const phone = retailer.manager_phone;

    // Send SMS via Twilio
    await client.messages.create({
      body: '🎉 Congrats! Your franchise owner just joined Pawpaya — your reward is on the way!',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    // Update manager record
    await supabaseAdmin
      .from('managers')
      .update({ reward_sent: true })
      .eq('phone', phone);

    console.log(`[SendReward] Reward sent to ${phone}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[SendReward] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
