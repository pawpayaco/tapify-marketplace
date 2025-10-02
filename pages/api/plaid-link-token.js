// API endpoint to create Plaid Link token for retailers
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { retailerId } = req.body;

    if (!retailerId) {
      return res.status(400).json({ error: 'Missing retailer ID' });
    }

    // Create Plaid Link token
    const response = await fetch('https://sandbox.plaid.com/link/token/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        client_name: 'Tapify Marketplace',
        user: {
          client_user_id: retailerId,
        },
        products: ['auth', 'transactions'],
        country_codes: ['US'],
        language: 'en',
        webhook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/plaid-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_message || 'Failed to create link token');
    }

    return res.status(200).json({
      link_token: data.link_token,
    });
  } catch (error) {
    console.error('[PLAID LINK TOKEN ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}

