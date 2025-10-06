// pages/api/retailers/search.js
// GET autocomplete search for retailers

import { requireAdmin, AuthError } from '../../../lib/api-auth';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not configured' });
  }

  // Allow both admin-authenticated and public onboarding requests.
  // Admin routes will succeed the check below; public onboarding callers
  // will hit the AuthError which we deliberately downgrade so the
  // autocomplete can still return results.
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401 || error.status === 403) {
        console.log('[retailers/search] No admin session detected, continuing in public mode');
      } else {
        return res.status(error.status).json({ error: error.message });
      }
    } else {
      console.error('[retailers/search] Admin auth error:', error);
      return res.status(500).json({ error: 'Failed to verify admin session' });
    }
  }

  const q = (req.query.query || '').trim();
  
  console.log('[retailers/search] Query:', q);
  
  if (!q) {
    return res.status(200).json({ results: [] });
  }

  try {
    // Search retailers with LEFT JOIN to retailer_owners to get owner info added by admin
    const { data, error } = await supabaseAdmin
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
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[retailers/search] Error:', err);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
}
