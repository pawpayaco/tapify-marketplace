// pages/api/onboard/register.js
// POST - Final onboarding registration
// Creates Supabase auth user (server-side) and updates retailers + outreach + owners transactionally

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error('[onboard/register] Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in env');
}

if (!DATABASE_URL) {
  console.error('[onboard/register] Missing DATABASE_URL in env');
}

// Create Supabase admin client (server-side only)
const supabaseAdmin = SERVICE_ROLE_KEY && SUPABASE_URL
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureDisplayRecord(client, retailerId, location) {
  const displayUid = `disp-${randomUUID()}`;

  await client.query(
    `INSERT INTO public.displays (retailer_id, uid, location, status, created_at)
     SELECT $1, $2, $3, 'requested', now()
     WHERE NOT EXISTS (
       SELECT 1 FROM public.displays WHERE retailer_id = $1
     )`,
    [retailerId, displayUid, location || null]
  );
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
    additional_stores = [],
    manager_referral = null // Manager phone from ?ref= parameter
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

  if (!supabaseAdmin || !SERVICE_ROLE_KEY || !SUPABASE_URL || !DATABASE_URL) {
    console.error('[onboard/register] Configuration error', {
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SERVICE_ROLE_KEY),
      hasDatabaseUrl: Boolean(DATABASE_URL),
    });
    return res.status(500).json({
      error: 'Server configuration error. Please contact support.',
      missing: {
        supabaseUrl: !SUPABASE_URL,
        serviceRoleKey: !SERVICE_ROLE_KEY,
        databaseUrl: !DATABASE_URL,
      },
    });
  }

  let client;

  try {
    client = await getPool().connect();

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
          (name, address, place_id, email, owner_name, phone, source,
           created_by_user_id, created_at, converted, converted_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'onboard', $7, now(), true, now())
        RETURNING id, name, email
      `;

      const retailerResult = await client.query(insertRetailerSql, [
        store_name,
        address || null,
        place_id,
        owner_email,
        owner_name || null,
        owner_phone || null,
        user.id  // Link to auth user
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
             created_by_user_id = COALESCE(created_by_user_id, $5)
         WHERE id = $1`,
        [rId, owner_email, owner_name, owner_phone, user.id]
      );
      console.log('[onboard/register] Updated existing retailer:', rId);
    }

    await ensureDisplayRecord(client, rId, address || store_name);

    // Note: owner data is now stored directly in retailers table
    // No need for separate retailer_owners entry (deprecated)

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
                 created_by_user_id = COALESCE(created_by_user_id, $4)
             WHERE id = $5`,
            [owner_email, owner_name, store.managerName, user.id, store.retailer_id]
          );

          additionalRetailerId = store.retailer_id;
        } else {
          // NEW RETAILER: Create it
          console.log('[onboard/register] Creating new retailer:', store.storeName);

          const additionalRetailerSql = `
            INSERT INTO public.retailers
              (name, address, email, owner_name, manager_name, source,
               created_by_user_id, created_at, converted, converted_at)
            VALUES ($1, $2, $3, $4, $5, 'onboard-additional', $6, now(), true, now())
            RETURNING id
          `;

          const additionalResult = await client.query(additionalRetailerSql, [
            store.storeName,
            store.address || null,
            owner_email,
            owner_name || null,
            store.managerName || null,
            user.id  // Link to auth user
          ]);

          additionalRetailerId = additionalResult.rows[0].id;
        }

        console.log('[onboard/register] Processing retailer:', additionalRetailerId);

        // Note: owner data now stored directly in retailers table (consolidated)
        
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
        
        await ensureDisplayRecord(client, additionalRetailerId, store.address || store.storeName);
      }
    }

    await client.query('COMMIT');

    console.log('[onboard/register] Registration complete for retailer:', rId);

    // ✅ MARK MANAGER REFERRAL AS CONVERTED (outside transaction)
    if (manager_referral) {
      const cleanManagerPhone = manager_referral.replace(/\D/g, '');
      console.log('[onboard/register] Processing manager referral from:', cleanManagerPhone);

      try {
        // Insert conversion event
        await supabaseAdmin
          .from('referral_events')
          .insert({
            manager_phone: cleanManagerPhone,
            retailer_id: rId,
            event_type: 'register',
            metadata: {
              owner_email,
              store_name,
              registered_at: new Date().toISOString()
            }
          });

        // Update manager's successful_referrals count
        const { data: managerData } = await supabaseAdmin
          .from('managers')
          .select('successful_referrals')
          .eq('phone', cleanManagerPhone)
          .single();

        if (managerData) {
          await supabaseAdmin
            .from('managers')
            .update({
              successful_referrals: (managerData.successful_referrals || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('phone', cleanManagerPhone);

          console.log('[onboard/register] ✅ Manager referral marked as converted');
        }
      } catch (referralError) {
        console.error('[onboard/register] Failed to track manager referral:', referralError);
        // Don't fail the registration if referral tracking fails
      }
    }

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
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }

    const dbHost = (() => {
      try {
        return new URL(DATABASE_URL).hostname;
      } catch (e) {
        return 'unknown-host';
      }
    })();

    console.error('[onboard/register] Registration failed:', {
      message: err?.message,
      code: err?.code,
      dbHost,
    });
    
    // Provide user-friendly error messages
    let errorMessage = err.message;
    let errorCode = err.code || null;

    if (err.message?.includes('already registered')) {
      errorMessage = 'This email is already registered. Please log in instead.';
    } else if (err.message?.includes('auth user')) {
      errorMessage = 'Failed to create account. The email may already be in use.';
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = `Unable to reach the database host (${dbHost}). Double-check DATABASE_URL in your environment configuration.`;
      errorCode = 'DB_HOST_NOT_FOUND';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Database refused the connection. Verify DATABASE_URL credentials and that the pooler is enabled.';
      errorCode = 'DB_CONNECTION_REFUSED';
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
