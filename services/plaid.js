/**
 * Request a Plaid Link token for the current user/entity.
 * @param {Object} payload - Payload forwarded to the API (user_id, retailer_id, etc.)
 */
export async function createLinkToken(payload) {
  const response = await fetch('/api/plaid-link-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Unable to create Plaid Link token');
  }

  return data;
}

/**
 * Complete the Plaid → Dwolla linking flow once Plaid Link returns a public token.
 * @param {Object} payload - `{ public_token, account_id, account_type, entity_id, name, email }`
 */
export async function completePlaidLink(payload) {
  const response = await fetch('/api/plaid-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Unable to link bank account');
  }

  return data;
}
