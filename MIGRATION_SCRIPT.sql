-- ================================================================
-- TAPIFY DATABASE CONSOLIDATION MIGRATION
-- ================================================================
-- Created: 2025-01-15
-- Purpose: Consolidate fragmented data, add sourcer tracking,
--          import CSV prospects, and optimize schema
--
-- IMPORTANT: Run this in a single transaction in Supabase SQL Editor
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: BACKUP EXISTING DATA (for safety)
-- ================================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS retailers_backup_migration AS SELECT * FROM retailers;
CREATE TABLE IF NOT EXISTS retailer_owners_backup AS SELECT * FROM retailer_owners;
CREATE TABLE IF NOT EXISTS retailer_outreach_backup AS SELECT * FROM retailer_outreach;

-- ================================================================
-- STEP 2: ADD NEW COLUMNS (all additive, no data loss)
-- ================================================================

-- Add sourcer attribution
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS recruited_by_sourcer_id UUID REFERENCES sourcer_accounts(id);

-- Add user ID links for proper auth
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

-- Add place_id for Google Maps integration (from CSV)
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add lat/lng for mapping
ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS lat NUMERIC;

ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS lng NUMERIC;

-- ================================================================
-- STEP 3: CONSOLIDATE RETAILER CONTACT DATA
-- ================================================================

-- Backfill missing phone/email from retailer_owners → retailers
UPDATE retailers r
SET
  phone = COALESCE(r.phone, ro.owner_phone),
  email = COALESCE(r.email, ro.owner_email),
  owner_name = COALESCE(r.owner_name, ro.owner_name)
FROM (
  SELECT DISTINCT ON (retailer_id)
    retailer_id,
    owner_phone,
    owner_email,
    owner_name
  FROM retailer_owners
  ORDER BY retailer_id, collected_at DESC
) ro
WHERE r.id = ro.retailer_id;

-- Backfill created_by_user_id from email matches
UPDATE retailers r
SET created_by_user_id = (
  SELECT id FROM auth.users WHERE email = r.email LIMIT 1
)
WHERE created_by_user_id IS NULL AND r.email IS NOT NULL;

UPDATE vendors v
SET created_by_user_id = (
  SELECT id FROM auth.users WHERE email = v.email LIMIT 1
)
WHERE created_by_user_id IS NULL AND v.email IS NOT NULL;

-- ================================================================
-- STEP 4: CONSOLIDATE CONVERSION TRACKING
-- ================================================================

-- Backfill converted status from retailer_outreach
UPDATE retailers r
SET
  converted = TRUE,
  converted_at = ro.registered_at
FROM retailer_outreach ro
WHERE r.id = ro.retailer_id
  AND ro.registered = TRUE
  AND (r.converted = FALSE OR r.converted IS NULL);

-- Sync onboarding_completed with converted (before we drop it)
UPDATE retailers
SET onboarding_completed = converted
WHERE onboarding_completed IS NULL OR onboarding_completed != converted;

-- ================================================================
-- STEP 5: CONSOLIDATE OUTREACH TRACKING
-- ================================================================

-- Move cold_email_sent from retailers → retailer_outreach
INSERT INTO retailer_outreach (retailer_id, campaign, channel, email_sent, email_sent_at, created_at)
SELECT
  id as retailer_id,
  'admin-cold-call' as campaign,
  'email' as channel,
  TRUE as email_sent,
  cold_email_sent_at as email_sent_at,
  COALESCE(cold_email_sent_at, created_at) as created_at
FROM retailers
WHERE cold_email_sent = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM retailer_outreach WHERE retailer_id = retailers.id
  )
ON CONFLICT DO NOTHING;

-- ================================================================
-- STEP 6: CLEAR OLD TEST/DEMO DATA (IMPORTANT!)
-- ================================================================

-- Based on user confirmation: current 735 retailers are old/test data
-- CSV contains the real 750 prospects to import
-- We'll archive existing data but clear the main table

-- Move existing retailers to archive
CREATE TABLE IF NOT EXISTS retailers_archived_demo AS
SELECT * FROM retailers WHERE converted = false;

-- Keep only converted retailers (real customers who registered)
-- Delete unconverted prospects (these will be replaced by CSV import)
DELETE FROM retailer_outreach WHERE retailer_id IN (
  SELECT id FROM retailers WHERE converted = false
);

DELETE FROM retailer_owners WHERE retailer_id IN (
  SELECT id FROM retailers WHERE converted = false
);

DELETE FROM retailers WHERE converted = false;

-- ================================================================
-- STEP 7: IMPORT CSV PROSPECTS (750 Pet Supplies Plus locations)
-- ================================================================

-- Note: This will be done via a separate script since CSV import
-- requires file handling. See import_prospects.js

-- For now, create the table structure to receive CSV data
-- The actual import will happen after this migration completes

-- Verify retailers table is ready for CSV import with all required columns

-- ================================================================
-- STEP 8: ADD MISSING FOREIGN KEYS
-- ================================================================

-- Add FK constraint for scans → uids
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_scans_uid'
  ) THEN
    ALTER TABLE scans
      ADD CONSTRAINT fk_scans_uid
      FOREIGN KEY (uid) REFERENCES uids(uid) ON DELETE CASCADE;
  END IF;
END $$;

-- ================================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_retailers_sourcer ON retailers(recruited_by_sourcer_id);
CREATE INDEX IF NOT EXISTS idx_retailers_user_id ON retailers(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_retailers_place_id ON retailers(place_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_retailers_converted ON retailers(converted);
CREATE INDEX IF NOT EXISTS idx_retailer_outreach_retailer_id ON retailer_outreach(retailer_id);

-- ================================================================
-- STEP 10: DROP STAGING TABLES (no longer needed)
-- ================================================================

DROP TABLE IF EXISTS staging_stores;
DROP TABLE IF EXISTS staging_stores_imported_20251002_1656;
DROP TABLE IF EXISTS staging_stores_imported_20251002_1658;

-- ================================================================
-- STEP 11: DROP REDUNDANT COLUMNS (OPTIONAL - commented out for safety)
-- ================================================================

-- Uncomment these ONLY after verifying app works perfectly for 1-2 weeks:

-- ALTER TABLE retailers DROP COLUMN IF EXISTS location;
-- ALTER TABLE retailers DROP COLUMN IF EXISTS store_phone;
-- ALTER TABLE retailers DROP COLUMN IF EXISTS onboarding_completed;
-- ALTER TABLE retailers DROP COLUMN IF EXISTS cold_email_sent;
-- ALTER TABLE retailers DROP COLUMN IF EXISTS cold_email_sent_at;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check consolidated data
SELECT
  'Total retailers' as metric,
  COUNT(*) as count
FROM retailers
UNION ALL
SELECT
  'Converted retailers',
  COUNT(*) FILTER (WHERE converted = true)
FROM retailers
UNION ALL
SELECT
  'Retailers with phone',
  COUNT(*) FILTER (WHERE phone IS NOT NULL)
FROM retailers
UNION ALL
SELECT
  'Retailers with email',
  COUNT(*) FILTER (WHERE email IS NOT NULL)
FROM retailers
UNION ALL
SELECT
  'Retailers with sourcer_id',
  COUNT(*) FILTER (WHERE recruited_by_sourcer_id IS NOT NULL)
FROM retailers
UNION ALL
SELECT
  'Retailers with user_id',
  COUNT(*) FILTER (WHERE created_by_user_id IS NOT NULL)
FROM retailers;

-- ================================================================
-- COMMIT TRANSACTION
-- ================================================================

-- If everything looks good above, commit:
COMMIT;

-- If anything looks wrong, run: ROLLBACK;
