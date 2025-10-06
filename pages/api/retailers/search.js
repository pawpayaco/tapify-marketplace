// pages/api/retailers/search.js
// GET autocomplete search for retailers

import { supabaseAdmin, supabaseServerAnon } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Allow both admin-authenticated and public onboarding requests. If the
  // service role client is available we verify the caller; otherwise we fall
  // back to a read-only anon client and skip admin enforcement.
  const hasAdminClient = Boolean(supabaseAdmin);
  let AuthErrorClass = null;
  let requireAdminFn = null;

  if (hasAdminClient) {
    try {
      const authModule = await import('../../../lib/api-auth');
      AuthErrorClass = authModule.AuthError;
      requireAdminFn = authModule.requireAdmin;

      try {
        await requireAdminFn(req, res);
      } catch (error) {
        if (AuthErrorClass && error instanceof AuthErrorClass) {
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
    } catch (importError) {
      AuthErrorClass = null;
      requireAdminFn = null;
      console.warn('[retailers/search] Failed to load admin auth helpers, continuing without admin enforcement', importError?.message || importError);
    }
  }

  const q = (req.query.query || '').trim();
  
  console.log('[retailers/search] Query:', q);
  console.log('[retailers/search] Supabase config', {
    hasAdminClient,
    hasServerAnon: Boolean(supabaseServerAnon),
    hasPublicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceUrl: Boolean(process.env.SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
  
  if (!q) {
    return res.status(200).json({ results: [] });
  }

  try {
    const client = supabaseAdmin || supabaseServerAnon;

    if (!client) {
      console.error('[retailers/search] No Supabase client available. env.NEXT_PUBLIC_SUPABASE_URL present?', {
        hasPublicUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasServiceUrl: Boolean(process.env.SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      });
      return res.status(500).json({ error: 'Supabase client not configured' });
    }

    const selectingWithOwners = hasAdminClient;

    const selectColumns = selectingWithOwners
      ? `
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
      `
      : `
        id,
        name,
        address,
        location,
        email,
        phone,
        store_phone,
        converted,
        converted_at
      `;

    const { data, error } = await client
      .from('retailers')
      .select(selectColumns)
      .or(`name.ilike.%${q}%,address.ilike.%${q}%,location.ilike.%${q}%,email.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('[retailers/search] Supabase error:', error);
      return res.status(500).json({ error: 'Search failed', details: error.message });
    }
    
    // Flatten the owner data from the join (take first owner if multiple)
    const results = (data || []).map(retailer => {
      const ownerData = selectingWithOwners ? retailer.retailer_owners?.[0] || {} : {};
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
    if (AuthErrorClass && err instanceof AuthErrorClass) {
      return res.status(err.status).json({ error: err.message });
    }

    console.error('[retailers/search] Error:', err);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
}
