-- ================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Priority Display Schema Fix
-- ================================================================
-- Run these in Supabase SQL Editor after applying migration
-- ================================================================

-- ================================================================
-- 1️⃣ VERIFY COLUMN TYPES & DEFAULTS
-- ================================================================
-- Expected: is_priority_display and priority_display_active should both be boolean, NOT NULL, default FALSE
-- Expected: priority_display should NOT appear (dropped)

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'retailers')
  AND column_name IN ('is_priority_display', 'priority_display_active', 'priority_display')
ORDER BY table_name, column_name;

-- Expected Output:
-- table_name | column_name              | data_type | is_nullable | column_default
-- -----------+--------------------------+-----------+-------------+----------------
-- orders     | is_priority_display      | boolean   | NO          | false
-- retailers  | priority_display_active  | boolean   | NO          | false


-- ================================================================
-- 2️⃣ COUNT PRIORITY DISPLAY RECORDS
-- ================================================================
-- Shows how many orders/retailers have priority display enabled

SELECT
  'Orders with Priority Display' as metric,
  COUNT(*) as count
FROM orders
WHERE is_priority_display = TRUE
UNION ALL
SELECT
  'Retailers with Priority Active',
  COUNT(*)
FROM retailers
WHERE priority_display_active = TRUE
UNION ALL
SELECT
  'Total Orders',
  COUNT(*)
FROM orders
UNION ALL
SELECT
  'Total Retailers',
  COUNT(*)
FROM retailers;


-- ================================================================
-- 3️⃣ SAMPLE PRIORITY DISPLAY ORDERS
-- ================================================================
-- Shows most recent orders with priority display

SELECT
  id,
  shopify_order_id,
  shopify_order_number,
  retailer_id,
  is_priority_display,
  total,
  processed_at,
  created_at
FROM orders
WHERE is_priority_display = TRUE
ORDER BY processed_at DESC NULLS LAST
LIMIT 10;


-- ================================================================
-- 4️⃣ SAMPLE RETAILERS WITH PRIORITY ACTIVE
-- ================================================================
-- Shows retailers who have priority display active

SELECT
  id,
  name,
  priority_display_active,
  converted,
  email,
  phone,
  created_at
FROM retailers
WHERE priority_display_active = TRUE
ORDER BY created_at DESC
LIMIT 10;


-- ================================================================
-- 5️⃣ CHECK FOR MISMATCHES (Should be empty!)
-- ================================================================
-- Finds retailers with priority orders but flag not set
-- This should return 0 rows after migration

SELECT
  r.id as retailer_id,
  r.name as retailer_name,
  r.priority_display_active,
  COUNT(o.id) as priority_order_count,
  MAX(o.processed_at) as latest_priority_order
FROM retailers r
INNER JOIN orders o ON o.retailer_id = r.id
WHERE o.is_priority_display = TRUE
  AND r.priority_display_active = FALSE
GROUP BY r.id, r.name, r.priority_display_active
ORDER BY priority_order_count DESC;


-- ================================================================
-- 6️⃣ VERIFY INDEXES EXIST
-- ================================================================
-- Confirms performance indexes were created

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'retailers')
  AND indexname IN (
    'idx_orders_is_priority_display',
    'idx_retailers_priority_display_active'
  )
ORDER BY tablename, indexname;


-- ================================================================
-- 7️⃣ FULL ORDERS SAMPLE (Last 5 orders, all columns)
-- ================================================================
-- Shows recent orders with all relevant priority display fields

SELECT
  shopify_order_id,
  shopify_order_number,
  customer_email,
  retailer_id,
  vendor_id,
  is_priority_display,  -- Should be boolean
  total,
  financial_status,
  processed_at
FROM orders
ORDER BY processed_at DESC NULLS LAST
LIMIT 5;


-- ================================================================
-- 8️⃣ RETAILER PRIORITY STATUS SUMMARY
-- ================================================================
-- Groups retailers by priority display status

SELECT
  priority_display_active,
  COUNT(*) as retailer_count,
  COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted_count
FROM retailers
GROUP BY priority_display_active
ORDER BY priority_display_active DESC;


-- ================================================================
-- 9️⃣ CROSS-CHECK: Orders → Retailers Consistency
-- ================================================================
-- Verifies that every retailer with priority_display_active=TRUE
-- actually has at least one order with is_priority_display=TRUE

SELECT
  r.id as retailer_id,
  r.name as retailer_name,
  r.priority_display_active,
  COUNT(o.id) FILTER (WHERE o.is_priority_display = TRUE) as priority_orders,
  COUNT(o.id) as total_orders
FROM retailers r
LEFT JOIN orders o ON o.retailer_id = r.id
WHERE r.priority_display_active = TRUE
GROUP BY r.id, r.name, r.priority_display_active
ORDER BY priority_orders DESC;


-- ================================================================
-- 🔟 TEST DATA INSERTION (Optional)
-- ================================================================
-- Uncomment to test that new records can be inserted with priority display
-- WARNING: Only run in development/staging, not production!

/*
-- Test inserting an order with priority display
INSERT INTO orders (
  shopify_order_id,
  shopify_order_number,
  customer_email,
  is_priority_display,
  total,
  processed_at
) VALUES (
  'test_priority_' || extract(epoch from now())::text,
  'TEST-' || (floor(random() * 10000))::text,
  'test@example.com',
  TRUE,  -- This should work now!
  50.00,
  now()
)
RETURNING id, shopify_order_id, is_priority_display;

-- Test updating a retailer's priority display flag
UPDATE retailers
SET priority_display_active = TRUE
WHERE name ILIKE '%test%'
  OR email ILIKE '%test%'
LIMIT 1
RETURNING id, name, priority_display_active;
*/


-- ================================================================
-- 🎯 QUICK HEALTH CHECK (Run this first!)
-- ================================================================
-- Single query that checks everything at once

SELECT
  'Column Type Check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders'
        AND column_name = 'is_priority_display'
        AND data_type = 'boolean'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  'orders.is_priority_display should be boolean' as details

UNION ALL

SELECT
  'Column Type Check',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'retailers'
        AND column_name = 'priority_display_active'
        AND data_type = 'boolean'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END,
  'retailers.priority_display_active should be boolean'

UNION ALL

SELECT
  'Legacy Column Check',
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'orders'
        AND column_name = 'priority_display'
    ) THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END,
  'orders.priority_display should be dropped'

UNION ALL

SELECT
  'Index Check',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = 'idx_orders_is_priority_display'
    ) THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END,
  'idx_orders_is_priority_display should exist'

UNION ALL

SELECT
  'Data Consistency Check',
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM retailers r
      INNER JOIN orders o ON o.retailer_id = r.id
      WHERE o.is_priority_display = TRUE
        AND r.priority_display_active = FALSE
    ) THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END,
  'No retailers with priority orders but flag=FALSE';


-- ================================================================
-- 📊 PRIORITY DISPLAY ANALYTICS (Bonus)
-- ================================================================
-- Business insights on priority display adoption

SELECT
  DATE_TRUNC('day', processed_at) as order_date,
  COUNT(*) FILTER (WHERE is_priority_display = TRUE) as priority_orders,
  COUNT(*) as total_orders,
  SUM(total) FILTER (WHERE is_priority_display = TRUE) as priority_revenue,
  SUM(total) as total_revenue,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE is_priority_display = TRUE) / NULLIF(COUNT(*), 0),
    2
  ) as priority_order_percentage
FROM orders
WHERE processed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', processed_at)
ORDER BY order_date DESC
LIMIT 30;
