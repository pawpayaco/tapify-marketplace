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

    console.log('[PLAID LINK TOKEN] Request data:', { user_id, retailer_id, user_email: user?.email });

    if (!user_id || !retailer_id) {
      console.error('[PLAID LINK TOKEN] Missing required fields:', { user_id, retailer_id });
      return res.status(400).json({ error: 'Missing user ID or retailer ID' });
    }

    // Create Plaid Link token
    const plaidRequest = {
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
    };

    console.log('[PLAID LINK TOKEN] Request to Plaid:', {
      url: `${PLAID_BASE_URL}/link/token/create`,
      client_id: env.PLAID_CLIENT_ID,
      environment: env.PLAID_ENV,
      has_secret: !!env.PLAID_SECRET,
      webhook: plaidRequest.webhook
    });

    const response = await fetch(`${PLAID_BASE_URL}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plaidRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[PLAID LINK TOKEN] Plaid API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.error_message || `Plaid API error: ${response.status} ${response.statusText}`);
    }

    console.log('[PLAID LINK TOKEN] Successfully created link token');
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
