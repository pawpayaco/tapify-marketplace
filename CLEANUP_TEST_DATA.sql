-- ================================================================
-- CLEANUP TEST DATA SCRIPT
-- ================================================================
-- Purpose: Delete all test retailers and auth accounts
--          EXCEPT admin account oscarmullikin@icloud.com
--
-- Run this BEFORE importing the CSV prospects
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: Identify your admin user ID (for safety)
-- ================================================================

-- This will show your admin user info - verify it's correct
SELECT id, email, created_at
FROM auth.users
WHERE email = 'oscarmullikin@icloud.com';

-- Store the admin user ID in a temp variable
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'oscarmullikin@icloud.com';

  -- Verify we found it
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found! Check email address.';
  END IF;

  RAISE NOTICE 'Admin user ID: %', admin_user_id;
END $$;

-- ================================================================
-- STEP 2: Delete all related data for test retailers
-- ================================================================

-- Delete payout_jobs for test retailers
DELETE FROM payout_jobs
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- Delete scans for test retailers
DELETE FROM scans
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- Delete displays for test retailers
DELETE FROM displays
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- Delete retailer_outreach records
DELETE FROM retailer_outreach
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- Delete retailer_owners records
DELETE FROM retailer_owners
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- Delete retailer_accounts (bank/payout info)
DELETE FROM retailer_accounts
WHERE retailer_id IN (
  SELECT id FROM retailers
  WHERE email != 'oscarmullikin@icloud.com'
    OR email IS NULL
);

-- ================================================================
-- STEP 3: Delete test retailers (keep admin if they have one)
-- ================================================================

DELETE FROM retailers
WHERE email != 'oscarmullikin@icloud.com'
  OR email IS NULL;

-- ================================================================
-- STEP 4: Delete test auth.users accounts
-- ================================================================

-- IMPORTANT: This deletes auth accounts that aren't the admin
-- and aren't linked to any remaining retailers

DELETE FROM auth.users
WHERE email != 'oscarmullikin@icloud.com'
  AND email NOT IN (
    SELECT email FROM retailers WHERE email IS NOT NULL
  )
  AND email NOT IN (
    SELECT email FROM vendors WHERE email IS NOT NULL
  );

-- ================================================================
-- STEP 5: Verify cleanup
-- ================================================================

-- Show what's left
SELECT
  'auth.users' as table_name,
  COUNT(*) as remaining_count,
  string_agg(email, ', ') as emails
FROM auth.users
UNION ALL
SELECT
  'retailers',
  COUNT(*),
  string_agg(email, ', ')
FROM retailers
UNION ALL
SELECT
  'retailer_outreach',
  COUNT(*),
  NULL
FROM retailer_outreach
UNION ALL
SELECT
  'retailer_owners',
  COUNT(*),
  NULL
FROM retailer_owners
UNION ALL
SELECT
  'scans',
  COUNT(*),
  NULL
FROM scans
UNION ALL
SELECT
  'payout_jobs',
  COUNT(*),
  NULL
FROM payout_jobs;

-- ================================================================
-- COMMIT (or ROLLBACK if something looks wrong above)
-- ================================================================

-- If verification looks good, commit:
COMMIT;

-- If something looks wrong, run: ROLLBACK;
