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

    const { firstName, lastName, email, type = 'receive-only', businessName } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      });
    }

    // Create customer payload
    const customerPayload = {
      firstName,
      lastName,
      email,
      type, // 'receive-only', 'unverified', or 'personal'
    };

    // Add business name if provided
    if (businessName) {
      customerPayload.businessName = businessName;
    }

    // Create customer in Dwolla
    const customer = await dwolla.post('customers', customerPayload);

    return res.status(201).json({
      success: true,
      customerId: customer.headers.get('location'),
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Error creating Dwolla customer:', error);

    return res.status(500).json({
      error: 'Failed to create Dwolla customer',
      message: error.message,
      details: error.body || null,
    });
  }
}
