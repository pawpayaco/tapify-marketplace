/**
 * Create a Dwolla customer
 * @param {Object} userData - Customer data (firstName, lastName, email, etc.)
 * @returns {Promise<Object>} JSON response with customer details
 */
export async function createCustomer(userData) {
  try {
    const response = await fetch('/api/dwolla-customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Dwolla customer:', error);
    throw error;
  }
}

/**
 * Initiate a payout via Dwolla
 * @param {Object} payoutData - Payout details (amount, destination, etc.)
 * @returns {Promise<Object>} JSON response with payout details
 */
export async function initiatePayout(payoutData) {
  try {
    const response = await fetch('/api/dwolla-payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payoutData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initiating Dwolla payout:', error);
    throw error;
  }
}

/**
 * Get the status of a Dwolla payout
 * @param {string} payoutId - The payout ID to check
 * @returns {Promise<Object>} JSON response with payout status
 */
export async function getPayoutStatus(payoutId) {
  try {
    const response = await fetch(`/api/dwolla-status?id=${encodeURIComponent(payoutId)}`, {
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
    console.error('Error getting Dwolla payout status:', error);
    throw error;
  }
}
