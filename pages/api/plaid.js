import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Change to 'development' or 'production' as needed
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      throw new Error('Missing Plaid credentials in environment variables');
    }

    // Create link token
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: 'user-id', // Replace with actual user ID from session/auth
      },
      client_name: 'Tapify Marketplace',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL || '',
    });

    const linkToken = response.data.link_token;

    return res.status(200).json({
      link_token: linkToken,
      expiration: response.data.expiration,
    });
  } catch (error) {
    console.error('Error creating link token:', error);
    
    return res.status(500).json({
      error: 'Failed to create link token',
      message: error.message,
    });
  }
}
