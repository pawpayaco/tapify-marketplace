import { Client } from 'dwolla-v2';

// Initialize Dwolla client
const dwolla = new Client({
  key: process.env.DWOLLA_KEY,
  secret: process.env.DWOLLA_SECRET,
  environment: 'sandbox', // Change to 'production' when ready
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!process.env.DWOLLA_KEY || !process.env.DWOLLA_SECRET) {
      throw new Error('Missing Dwolla credentials in environment variables');
    }

    const { id } = req.query;

    // Validate transfer ID
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: id' 
      });
    }

    // Get transfer status from Dwolla
    const transfer = await dwolla.get(id);

    return res.status(200).json({
      success: true,
      status: transfer.body.status,
      amount: transfer.body.amount,
      created: transfer.body.created,
      data: transfer.body,
    });
  } catch (error) {
    console.error('Error getting Dwolla payout status:', error);

    return res.status(500).json({
      error: 'Failed to get Dwolla payout status',
      message: error.message,
      details: error.body || null,
    });
  }
}
