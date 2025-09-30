import { Client } from 'dwolla-v2';

// Initialize Dwolla client
const dwolla = new Client({
  key: process.env.DWOLLA_KEY,
  secret: process.env.DWOLLA_SECRET,
  environment: 'sandbox', // Change to 'production' when ready
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!process.env.DWOLLA_KEY || !process.env.DWOLLA_SECRET) {
      throw new Error('Missing Dwolla credentials in environment variables');
    }

    const { 
      sourceFundingSource, 
      destinationFundingSource, 
      amount, 
      currency = 'USD',
      metadata = {} 
    } = req.body;

    // Validate required fields
    if (!sourceFundingSource || !destinationFundingSource || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: sourceFundingSource, destinationFundingSource, amount' 
      });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Create transfer payload
    const transferPayload = {
      _links: {
        source: {
          href: sourceFundingSource,
        },
        destination: {
          href: destinationFundingSource,
        },
      },
      amount: {
        currency,
        value: amount.toString(),
      },
      metadata,
    };

    // Initiate transfer in Dwolla
    const transfer = await dwolla.post('transfers', transferPayload);

    return res.status(201).json({
      success: true,
      transferId: transfer.headers.get('location'),
      message: 'Payout initiated successfully',
    });
  } catch (error) {
    console.error('Error initiating Dwolla payout:', error);

    return res.status(500).json({
      error: 'Failed to initiate Dwolla payout',
      message: error.message,
      details: error.body || null,
    });
  }
}
