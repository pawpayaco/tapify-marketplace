// Legacy endpoint retained for compatibility with older front-end flows.
// Delegates to the unified Plaid → Dwolla onboarding helper used by /api/plaid-link.

import { AuthError, requireSession } from '../../lib/api-auth';
import { completePlaidDwollaLink } from './plaid-link';

const fallback = (value, ...alternatives) => {
  if (value !== undefined && value !== null && value !== '') return value;
  for (const alt of alternatives) {
    if (alt !== undefined && alt !== null && alt !== '') return alt;
  }
  return undefined;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    public_token,
    account_id,
    account_type,
    entity_id,
    metadata,
    retailer_id,
    name,
    email,
  } = req.body ?? {};

  const resolvedAccountId = fallback(account_id, metadata?.account_id, metadata?.accounts?.[0]?.id);
  const resolvedAccountType = (account_type || metadata?.account_type || 'retailer').toLowerCase();
  const resolvedEntityId = fallback(entity_id, retailer_id, metadata?.entity_id);
  const resolvedName = fallback(name, metadata?.account?.name, metadata?.legal_name);
  const resolvedEmail = fallback(email, metadata?.user?.email);

  if (!public_token || !resolvedAccountId || !resolvedEntityId) {
    return res.status(400).json({ error: 'Missing required Plaid parameters' });
  }

  try {
    const { user } = await requireSession(req, res);
    const result = await completePlaidDwollaLink({
      public_token,
      account_id: resolvedAccountId,
      account_type: resolvedAccountType,
      entity_id: resolvedEntityId,
      name: resolvedName,
      email: resolvedEmail,
      user,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('[plaid-exchange] Error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
