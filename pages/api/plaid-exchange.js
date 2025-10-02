// API endpoint to exchange Plaid public token and store bank account info
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { public_token, metadata, retailerId } = req.body;

    if (!public_token || !retailerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Exchange public token for access token with Plaid
    const response = await fetch('https://sandbox.plaid.com/item/public_token/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        public_token: public_token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to exchange token');
    }

    const { access_token, item_id } = data;

    // Get account details
    const accountsResponse = await fetch('https://sandbox.plaid.com/accounts/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: access_token,
      }),
    });

    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok) {
      throw new Error(accountsData.error_message || 'Failed to get account details');
    }

    const account = accountsData.accounts[0]; // Use first account
    const institutionName = metadata.institution?.name || 'Bank Account';

    // Get Dwolla customer ID or create one
    // (You'll need to implement Dwolla customer creation separately)
    // For now, just store the Plaid tokens
    
    // Store in retailer_accounts table
    const { data: existingAccount } = await supabase
      .from('retailer_accounts')
      .select('*')
      .eq('retailer_id', retailerId)
      .single();

    let accountData;
    if (existingAccount) {
      // Update existing account
      const { data, error } = await supabase
        .from('retailer_accounts')
        .update({
          plaid_access_token: access_token,
        })
        .eq('retailer_id', retailerId)
        .select()
        .single();
      
      if (error) throw error;
      accountData = data;
    } else {
      // Create new account
      const { data, error } = await supabase
        .from('retailer_accounts')
        .insert({
          retailer_id: retailerId,
          plaid_access_token: access_token,
          dwolla_customer_id: null, // Will be set when Dwolla customer is created
        })
        .select()
        .single();
      
      if (error) throw error;
      accountData = data;
    }

    return res.status(200).json({
      success: true,
      accountData,
      bankName: institutionName,
      accountMask: account.mask,
    });
  } catch (error) {
    console.error('[PLAID EXCHANGE ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}

