-- ================================================================
-- PRIORITY DISPLAY SCHEMA FIX MIGRATION
-- ================================================================
-- Created: 2025-10-06
-- Purpose: Fix orders.is_priority_display and retailers.priority_display_active
--          column mismatches causing webhook failures
--
-- Error fixed: "invalid input syntax for type json (Token 'is_priority_display' is invalid)"
--
-- This migration:
-- 1. Adds orders.is_priority_display as BOOLEAN (if missing)
-- 2. Adds retailers.priority_display_active as BOOLEAN (if missing)
-- 3. Removes legacy priority_display columns (if they exist and are wrong type)
-- 4. Preserves existing data with proper type coercion
-- 5. Is idempotent and safe to run multiple times
-- ================================================================

BEGIN;

-- ================================================================
-- ORDERS TABLE: is_priority_display column
-- ================================================================

DO $$
DECLARE
  col_exists boolean;
  col_type text;
BEGIN
  -- Check if column exists and get its type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'is_priority_display'
  ) INTO col_exists;

  IF col_exists THEN
    -- Get the column type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'is_priority_display';

    RAISE NOTICE 'orders.is_priority_display exists with type: %', col_type;

    -- If it's not boolean, alter it
    IF col_type != 'boolean' THEN
      RAISE NOTICE 'Converting orders.is_priority_display from % to boolean', col_type;

      -- Try to coerce existing values to boolean
      -- JSON/TEXT values: true/false/"true"/"false" → boolean
      -- NULL → false
      ALTER TABLE orders
        ALTER COLUMN is_priority_display TYPE BOOLEAN
        USING (
          CASE
            WHEN is_priority_display IS NULL THEN FALSE
            WHEN is_priority_display::text IN ('true', 't', 'TRUE', 'T', '1', 'yes', 'y') THEN TRUE
            ELSE FALSE
          END
        ),
        ALTER COLUMN is_priority_display SET DEFAULT FALSE,
        ALTER COLUMN is_priority_display SET NOT NULL;
    ELSE
      -- Already boolean, just ensure defaults
      ALTER TABLE orders
        ALTER COLUMN is_priority_display SET DEFAULT FALSE;
    END IF;
  ELSE
    -- Column doesn't exist, create it
    RAISE NOTICE 'Creating orders.is_priority_display as boolean';
    ALTER TABLE orders
      ADD COLUMN is_priority_display BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- ================================================================
-- ORDERS TABLE: Remove legacy priority_display column (if exists)
-- ================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'priority_display'
  ) THEN
    RAISE NOTICE 'Dropping legacy orders.priority_display column';

    -- If is_priority_display doesn't have data, try to migrate from priority_display first
    UPDATE orders
    SET is_priority_display = (
      CASE
        WHEN priority_display IS NULL THEN FALSE
        WHEN priority_display::text IN ('true', 't', 'TRUE', 'T', '1', 'yes', 'y') THEN TRUE
        ELSE FALSE
      END
    )
    WHERE is_priority_display = FALSE
      AND priority_display IS NOT NULL;

    -- Now drop the legacy column
    ALTER TABLE orders DROP COLUMN priority_display;
  END IF;
END $$;

-- ================================================================
-- RETAILERS TABLE: priority_display_active column
-- ================================================================

DO $$
DECLARE
  col_exists boolean;
  col_type text;
BEGIN
  -- Check if column exists and get its type
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'retailers'
      AND column_name = 'priority_display_active'
  ) INTO col_exists;

  IF col_exists THEN
    -- Get the column type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'retailers'
      AND column_name = 'priority_display_active';

    RAISE NOTICE 'retailers.priority_display_active exists with type: %', col_type;

    -- If it's not boolean, alter it
    IF col_type != 'boolean' THEN
      RAISE NOTICE 'Converting retailers.priority_display_active from % to boolean', col_type;

      ALTER TABLE retailers
        ALTER COLUMN priority_display_active TYPE BOOLEAN
        USING (
          CASE
            WHEN priority_display_active IS NULL THEN FALSE
            WHEN priority_display_active::text IN ('true', 't', 'TRUE', 'T', '1', 'yes', 'y') THEN TRUE
            ELSE FALSE
          END
        ),
        ALTER COLUMN priority_display_active SET DEFAULT FALSE,
        ALTER COLUMN priority_display_active SET NOT NULL;
    ELSE
      -- Already boolean, just ensure defaults
      ALTER TABLE retailers
        ALTER COLUMN priority_display_active SET DEFAULT FALSE;
    END IF;
  ELSE
    -- Column doesn't exist, create it
    RAISE NOTICE 'Creating retailers.priority_display_active as boolean';
    ALTER TABLE retailers
      ADD COLUMN priority_display_active BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- ================================================================
-- RETAILERS TABLE: Backfill priority_display_active from orders
-- ================================================================

-- If any retailer has orders with is_priority_display = true,
-- update their priority_display_active flag
UPDATE retailers r
SET priority_display_active = TRUE
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.retailer_id = r.id
    AND o.is_priority_display = TRUE
)
AND priority_display_active = FALSE;

-- ================================================================
-- INDEXES for performance
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_orders_is_priority_display
  ON orders (is_priority_display)
  WHERE is_priority_display = TRUE;

CREATE INDEX IF NOT EXISTS idx_retailers_priority_display_active
  ON retailers (priority_display_active)
  WHERE priority_display_active = TRUE;

-- ================================================================
-- VERIFICATION QUERY (logged to console)
-- ================================================================

DO $$
DECLARE
  orders_col_type text;
  retailers_col_type text;
  orders_priority_count int;
  retailers_priority_count int;
BEGIN
  -- Get column types
  SELECT data_type INTO orders_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'is_priority_display';

  SELECT data_type INTO retailers_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'retailers'
    AND column_name = 'priority_display_active';

  -- Count priority display records
  SELECT COUNT(*) INTO orders_priority_count
  FROM orders
  WHERE is_priority_display = TRUE;

  SELECT COUNT(*) INTO retailers_priority_count
  FROM retailers
  WHERE priority_display_active = TRUE;

  -- Log results
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '   orders.is_priority_display → % (% records with TRUE)', orders_col_type, orders_priority_count;
  RAISE NOTICE '   retailers.priority_display_active → % (% records with TRUE)', retailers_col_type, retailers_priority_count;
END $$;

COMMIT;

-- ================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ================================================================
-- Run these after migration to verify data integrity:
--
-- 1. Check column types:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name IN ('orders', 'retailers')
--   AND column_name IN ('is_priority_display', 'priority_display_active')
-- ORDER BY table_name, column_name;
--
-- 2. Sample orders with priority display:
-- SELECT id, shopify_order_id, retailer_id, is_priority_display, total, processed_at
-- FROM orders
-- WHERE is_priority_display = TRUE
-- ORDER BY processed_at DESC
-- LIMIT 10;
--
-- 3. Sample retailers with priority display active:
-- SELECT id, name, priority_display_active, converted, created_at
-- FROM retailers
-- WHERE priority_display_active = TRUE
-- ORDER BY created_at DESC
-- LIMIT 10;
--
-- 4. Check for mismatches (retailers with priority orders but flag not set):
-- SELECT r.id, r.name, r.priority_display_active, COUNT(o.id) as priority_orders
-- FROM retailers r
-- JOIN orders o ON o.retailer_id = r.id
-- WHERE o.is_priority_display = TRUE
--   AND r.priority_display_active = FALSE
-- GROUP BY r.id, r.name, r.priority_display_active;
-- ================================================================
