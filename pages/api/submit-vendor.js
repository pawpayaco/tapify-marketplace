// pages/api/submit-vendor.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    email,
    storeType,
    websiteUrl,
    platformUrl,
    fulfillmentSpeed,
    inventoryCap,
    productPhotoUrl,
    collectionName,
    sourcedBy,
  } = req.body;

  if (!name || !platformUrl || !collectionName) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.from('vendors').insert([
      {
        name,
        email,
        store_type: storeType,
        website_url: websiteUrl,
        platform_url: platformUrl,
        fulfillment_speed: fulfillmentSpeed,
        inventory_cap: inventoryCap,
        product_photo_url: productPhotoUrl,
        collection_name: collectionName,
        onboarded_by: sourcedBy || null,
      },
    ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to submit vendor.' });
    }

    return res.status(200).json({ success: true, vendor: data[0] });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
