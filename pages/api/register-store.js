// pages/api/register-store.js
// Server-side API endpoint to register a store owner via Supabase RPC
// 
// This endpoint calls the register_store_transaction() PostgreSQL function
// which handles all DB operations atomically (retailers, retailer_owners, retailer_outreach)
//
// Security: Uses SUPABASE_SERVICE_ROLE_KEY (server-side only, never exposed to client)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables at module load time
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[register-store] Missing required environment variables');
  console.error('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
}

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

/**
 * POST /api/register-store
 * 
 * Registers a store owner and marks retailer as converted via database transaction
 * 
 * Request body:
 * {
 *   retailer_id: string (required) - UUID of the retailer
 *   owner_name: string - Owner's full name
 *   owner_phone: string - Owner's phone number
 *   owner_email: string - Owner's email (used for deduplication)
 *   campaign: string - Campaign identifier (default: "cold-email-YYYY-MM")
 *   collected_by: string - Source of registration (e.g., "admin-ui", "public-registration")
 *   notes: string - Additional notes
 * }
 * 
 * Response:
 * {
 *   ok: boolean,
 *   result: {
 *     ok: boolean,
 *     retailer: object,
 *     owner_id: uuid,
 *     outreach_id: uuid
 *   }
 * }
 * 
 * Error response:
 * {
 *   ok: false,
 *   error: string
 * }
 */
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Check if admin client is initialized
  if (!supabaseAdmin) {
    console.error('[register-store] Supabase admin client not initialized');
    return res.status(500).json({ 
      ok: false, 
      error: 'Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' 
    });
  }

  // Extract and validate request body
  const {
    retailer_id,
    owner_name,
    owner_phone,
    owner_email,
    campaign = `cold-email-${new Date().toISOString().slice(0, 7)}`,
    collected_by = 'public-registration',
    notes = ''
  } = req.body || {};

  // Validate required fields
  if (!retailer_id) {
    return res.status(400).json({ ok: false, error: 'Missing required field: retailer_id' });
  }

  // At least one owner contact field is required
  if (!owner_name && !owner_phone && !owner_email) {
    return res.status(400).json({ 
      ok: false, 
      error: 'At least one owner field (name, phone, or email) is required' 
    });
  }

  try {
    // Call the PostgreSQL RPC function
    // This function handles the entire transaction atomically
    const { data, error } = await supabaseAdmin.rpc('register_store_transaction', {
      p_retailer_id: retailer_id,
      p_owner_name: owner_name || null,
      p_owner_phone: owner_phone || null,
      p_owner_email: owner_email || null,
      p_campaign: campaign,
      p_collected_by: collected_by,
      p_notes: notes || null,
    });

    if (error) {
      console.error('[register-store] RPC error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error.toString() 
      });
    }

    // Log success for debugging
    console.log('[register-store] Success:', {
      retailer_id,
      owner_email: owner_email || 'none',
      campaign,
      collected_by
    });

    return res.status(200).json({ 
      ok: true, 
      result: data 
    });

  } catch (err) {
    console.error('[register-store] Handler error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message || 'Unknown error occurred' 
    });
  }
}

/**
 * Unit test examples (for development):
 * 
 * 1. Test with all fields:
 *    POST /api/register-store
 *    {
 *      "retailer_id": "uuid-here",
 *      "owner_name": "John Doe",
 *      "owner_phone": "555-1234",
 *      "owner_email": "john@example.com",
 *      "campaign": "cold-email-2025-10",
 *      "collected_by": "admin-ui"
 *    }
 * 
 * 2. Test with minimal fields (name only):
 *    {
 *      "retailer_id": "uuid-here",
 *      "owner_name": "Jane Smith"
 *    }
 * 
 * 3. Test duplicate email (should update existing owner):
 *    {
 *      "retailer_id": "uuid-here",
 *      "owner_name": "Updated Name",
 *      "owner_email": "existing@example.com"
 *    }
 * 
 * 4. Test error handling (invalid retailer_id):
 *    {
 *      "retailer_id": "00000000-0000-0000-0000-000000000000",
 *      "owner_name": "Test"
 *    }
 *    Expected: 500 error with "Retailer not found"
 */
