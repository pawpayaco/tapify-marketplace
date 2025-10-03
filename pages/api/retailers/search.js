// pages/api/retailers/search.js
// GET autocomplete search for retailers

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = (req.query.query || '').trim();
  
  console.log('[retailers/search] Query:', q);
  
  if (!q) {
    return res.status(200).json({ results: [] });
  }

  try {
    // Search retailers with LEFT JOIN to retailer_owners to get owner info added by admin
    const { data, error } = await supabase
      .from('retailers')
      .select(`
        id, 
        name, 
        address, 
        location, 
        email, 
        phone, 
        store_phone,
        converted,
        converted_at,
        retailer_owners!left (
          owner_name,
          owner_email,
          owner_phone
        )
      `)
      .or(`name.ilike.%${q}%,address.ilike.%${q}%,location.ilike.%${q}%,email.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('[retailers/search] Supabase error:', error);
      return res.status(500).json({ error: 'Search failed', details: error.message });
    }
    
    // Flatten the owner data from the join (take first owner if multiple)
    const results = (data || []).map(retailer => {
      const ownerData = retailer.retailer_owners?.[0] || {};
      return {
        id: retailer.id,
        name: retailer.name,
        address: retailer.address,
        location: retailer.location,
        email: ownerData.owner_email || retailer.email || '',
        phone: ownerData.owner_phone || retailer.phone || retailer.store_phone || '',
        store_phone: retailer.store_phone,
        owner_name: ownerData.owner_name || '',
        // Include both for backward compatibility
        owner_email: ownerData.owner_email || '',
        owner_phone: ownerData.owner_phone || '',
        // Add conversion status
        converted: retailer.converted || false,
        converted_at: retailer.converted_at
      };
    });
    
    console.log('[retailers/search] Found', results.length, 'results with owner data');
    
    return res.status(200).json({ results });
  } catch (err) {
    console.error('[retailers/search] Error:', err);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
}

