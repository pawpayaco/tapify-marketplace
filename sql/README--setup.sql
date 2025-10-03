-- ================================================================
-- ONBOARDING INTEGRATION - SQL SETUP
-- ================================================================
-- Run these commands in Supabase SQL Editor to optimize the onboarding flow
-- ================================================================

-- 1. Index for fast retailer name search (autocomplete)
CREATE INDEX IF NOT EXISTS idx_retailers_name_lower 
ON public.retailers (LOWER(name));

-- 2. Index for address search
CREATE INDEX IF NOT EXISTS idx_retailers_address_lower 
ON public.retailers (LOWER(address));

-- 3. Index for email search
CREATE INDEX IF NOT EXISTS idx_retailers_email_lower 
ON public.retailers (LOWER(email));

-- 4. Unique constraint on retailer_owners (retailer_id + owner_email)
-- This enables upsert behavior and prevents duplicate owners per store
CREATE UNIQUE INDEX IF NOT EXISTS retailer_owners_retailer_email_uniq
ON public.retailer_owners (retailer_id, owner_email);

-- ================================================================
-- OPTIONAL: Single outreach row per retailer constraint
-- ================================================================
-- Only add this if you want to enforce one outreach record per retailer.
-- WARNING: This may fail if you have existing duplicate outreach rows.
-- If you have duplicates, clean them up first before adding this constraint.
--
-- To check for duplicates:
-- SELECT retailer_id, COUNT(*) 
-- FROM public.retailer_outreach 
-- GROUP BY retailer_id 
-- HAVING COUNT(*) > 1;
--
-- Uncomment the line below only if you want this constraint:
-- ALTER TABLE public.retailer_outreach
--   ADD CONSTRAINT single_outreach_per_retailer UNIQUE (retailer_id);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- Run these to verify the indexes were created:

-- Check indexes on retailers
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'retailers' 
AND schemaname = 'public'
AND indexname LIKE 'idx_retailers%';

-- Check unique constraint on retailer_owners
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'retailer_owners' 
AND schemaname = 'public'
AND indexname = 'retailer_owners_retailer_email_uniq';

-- ================================================================
-- END OF SETUP
-- ================================================================

