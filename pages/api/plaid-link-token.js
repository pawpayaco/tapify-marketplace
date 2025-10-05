// API endpoint to create Plaid Link token for retailers
import { AuthError, requireSession } from '../../lib/api-auth';
import { env } from '../../lib/env';

const PLAID_BASE_URL =
  env.PLAID_ENV === 'production'
    ? 'https://production.plaid.com'
    : env.PLAID_ENV === 'development'
    ? 'https://development.plaid.com'
    : 'https://sandbox.plaid.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = await requireSession(req, res);
    const { user_id, retailer_id } = req.body || {};

    if (!user_id || !retailer_id) {
      return res.status(400).json({ error: 'Missing user ID or retailer ID' });
    }

    // Create Plaid Link token
    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.PLAID_CLIENT_ID,
        secret: env.PLAID_SECRET,
        client_name: 'Tapify Marketplace',
        user: {
          client_user_id: user_id,
        },
        products: ['auth', 'transactions'],
        country_codes: ['US'],
        language: 'en',
        webhook: env.NEXT_PUBLIC_BASE_URL
          ? `${env.NEXT_PUBLIC_BASE_URL}/api/plaid-webhook`
          : undefined,
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
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[PLAID LINK TOKEN ERROR]', error);
    return res.status(500).json({ error: error.message });
  }
}
