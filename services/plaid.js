/**
 * Create a Plaid Link token
 * @returns {Promise<Object>} JSON response with link token
 */
export async function createLinkToken() {
  try {
    const response = await fetch('/api/plaid', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating link token:', error);
    throw error;
  }
}

/**
 * Exchange Plaid public token for access token
 * @param {string} publicToken - The public token from Plaid Link
 * @returns {Promise<Object>} JSON response with access token
 */
export async function exchangePublicToken(publicToken) {
  try {
    const response = await fetch('/api/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: publicToken }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}
