// pages/api/onboard/register.js
// POST - Final onboarding registration
// Creates Supabase auth user (server-side) and updates retailers + outreach + owners transactionally

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error('[onboard/register] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in env');
}

// Create Supabase admin client (server-side only)
const supabaseAdmin = SERVICE_ROLE_KEY && SUPABASE_URL
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { 
        autoRefreshToken: false,
        persistSession: false 
      }
    })
  : null;

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    });
  }
  return pool;
}

/**
 * Create Supabase auth user using admin API
 */
async function createSupabaseUser(email, password, metadata = {}) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: metadata,
    email_confirm: true // Auto-confirm email
  });

  if (error) {
    throw new Error(`Failed to create auth user: ${error.message}`);
  }

  return data.user;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    retailer_id, // existing retailer id OR null if creating a new retailer
    store_name,
    owner_name,
    owner_email,
    owner_phone,
    address,
    place_id = null,
    password,
    campaign = `onboard-${new Date().toISOString().slice(0, 7)}`,
    notes = '',
    additional_stores = []
  } = req.body;

  // Validate required fields
  if (!owner_email || !password || !store_name) {
    return res.status(400).json({ 
      error: 'store_name, owner_email, and password are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(owner_email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const client = await getPool().connect();
  
  try {
    console.log('[onboard/register] Starting registration for:', owner_email);

    // 1) Create Supabase auth user first
    const user = await createSupabaseUser(owner_email, password, { 
      owner_name, 
      store_name,
      role: 'retailer'
    });

    console.log('[onboard/register] Created auth user:', user.id);

    // 2) DB transaction: create/update retailer, create owner, mark as registered
    await client.query('BEGIN');

    let rId = retailer_id;
    
    if (!rId) {
      // Create new retailer
      const insertRetailerSql = `
        INSERT INTO public.retailers 
          (name, address, location, place_id, email, owner_name, phone, source, 
           created_at, converted, converted_at, onboarding_completed)
        VALUES ($1, $2, $2, $3, $4, $5, $6, 'onboard', now(), true, now(), true)
        RETURNING id, name, email
      `;
      
      const retailerResult = await client.query(insertRetailerSql, [
        store_name, 
        address || null, 
        place_id, 
        owner_email, 
        owner_name || null, 
        owner_phone || null
      ]);
      
      rId = retailerResult.rows[0].id;
      console.log('[onboard/register] Created new retailer:', rId);
      
    } else {
      // Update existing retailer
      await client.query(
        `UPDATE public.retailers 
         SET converted = true, 
             converted_at = now(), 
             email = COALESCE(email, $2), 
             owner_name = COALESCE(owner_name, $3), 
             phone = COALESCE(phone, $4),
             onboarding_completed = true
         WHERE id = $1`,
        [rId, owner_email, owner_name, owner_phone]
      );
      console.log('[onboard/register] Updated existing retailer:', rId);
    }

    // Insert/update owner record
    const ownerUpsert = `
      INSERT INTO public.retailer_owners 
        (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at)
      VALUES ($1, $2, $3, $4, 'onboard', now())
      ON CONFLICT (retailer_id, owner_email) 
      DO UPDATE SET
        owner_name = COALESCE(EXCLUDED.owner_name, retailer_owners.owner_name),
        owner_phone = COALESCE(EXCLUDED.owner_phone, retailer_owners.owner_phone),
        collected_at = now()
    `;
    
    await client.query(ownerUpsert, [
      rId, 
      owner_name || null, 
      owner_phone || null, 
      owner_email
    ]);

    // Mark/create outreach row as registered
    const outreachInsert = `
      INSERT INTO public.retailer_outreach 
        (retailer_id, campaign, channel, registered, registered_at, notes, created_at)
      VALUES ($1, $2, 'onboard', true, now(), $3, now())
    `;
    
    await client.query(outreachInsert, [
      rId, 
      campaign, 
      notes || `Registered via onboarding - ${owner_email}`
    ]);

    // Handle additional retailer locations for multi-location franchises
    if (additional_stores && additional_stores.length > 0) {
      console.log('[onboard/register] Processing', additional_stores.length, 'additional stores');
      
      for (const store of additional_stores) {
        let additionalRetailerId;

        if (store.retailer_id) {
          // EXISTING RETAILER: Update it to link to this owner
          console.log('[onboard/register] Linking existing retailer:', store.retailer_id);
          
          await client.query(
            `UPDATE public.retailers 
             SET converted = true, 
                 converted_at = now(), 
                 email = COALESCE(email, $1), 
                 owner_name = COALESCE(owner_name, $2), 
                 manager_name = COALESCE(manager_name, $3),
                 onboarding_completed = true
             WHERE id = $4`,
            [owner_email, owner_name, store.managerName, store.retailer_id]
          );
          
          additionalRetailerId = store.retailer_id;
        } else {
          // NEW RETAILER: Create it
          console.log('[onboard/register] Creating new retailer:', store.storeName);
          
          const additionalRetailerSql = `
            INSERT INTO public.retailers 
              (name, address, location, email, owner_name, manager_name, source, 
               created_at, converted, converted_at, onboarding_completed)
            VALUES ($1, $2, $2, $3, $4, $5, 'onboard-additional', now(), true, now(), true)
            RETURNING id
          `;
          
          const additionalResult = await client.query(additionalRetailerSql, [
            store.storeName,
            store.address || null,
            owner_email,
            owner_name || null,
            store.managerName || null
          ]);
          
          additionalRetailerId = additionalResult.rows[0].id;
        }
        
        console.log('[onboard/register] Processing retailer:', additionalRetailerId);
        
        // Link retailer to owner (for payout aggregation)
        await client.query(
          `INSERT INTO public.retailer_owners 
            (retailer_id, owner_name, owner_phone, owner_email, collected_by, collected_at)
          VALUES ($1, $2, $3, $4, 'onboard', now())
          ON CONFLICT (retailer_id, owner_email) 
          DO UPDATE SET
            owner_name = COALESCE(EXCLUDED.owner_name, retailer_owners.owner_name),
            owner_phone = COALESCE(EXCLUDED.owner_phone, retailer_owners.owner_phone),
            collected_at = now()`,
          [additionalRetailerId, owner_name, owner_phone, owner_email]
        );
        
        // Create outreach row for tracking
        await client.query(
          `INSERT INTO public.retailer_outreach 
            (retailer_id, campaign, channel, registered, registered_at, notes, created_at)
          VALUES ($1, $2, 'onboard-additional', true, now(), $3, now())`,
          [
            additionalRetailerId,
            campaign,
            `Additional location for ${owner_name} (${owner_email})`
          ]
        );
        
        // Create display request for this location
        await client.query(
          `INSERT INTO public.displays 
            (retailer_id, uid, location, status, created_at)
          VALUES ($1, $2, $3, 'requested', now())`,
          [
            additionalRetailerId,
            `disp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            store.address || store.storeName
          ]
        );
      }
    }

    await client.query('COMMIT');

    console.log('[onboard/register] Registration complete for retailer:', rId);

    return res.status(200).json({
      ok: true,
      message: 'Registration successful! Your account has been created.',
      user: {
        id: user.id,
        email: user.email
      },
      retailer_id: rId
    });
    
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[onboard/register] Registration failed:', err);
    
    // Provide user-friendly error messages
    let errorMessage = err.message;
    
    if (err.message.includes('already registered')) {
      errorMessage = 'This email is already registered. Please log in instead.';
    } else if (err.message.includes('auth user')) {
      errorMessage = 'Failed to create account. The email may already be in use.';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
}

