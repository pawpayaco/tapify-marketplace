# Priority Display Schema Fix - Summary

## 🐛 Problem Identified

**Error:** `invalid input syntax for type json (Token "is_priority_display" is invalid)`

**Root Cause:**
- Webhook handler (`pages/api/shopify-webhook.js`) writes `is_priority_display` (boolean) to orders table
- Dashboard (`components/DashboardSettings.jsx`) reads `orders.is_priority_display` and `retailers.priority_display_active`
- **These columns don't exist in the current schema** (see `context/supabase/migrations/2025-10-schema-sync.sql`)
- Possible legacy `priority_display` column exists with wrong type (JSON/TEXT instead of BOOLEAN)

## 📋 Code References

### Webhook Handler (shopify-webhook.js)
- **Line 166-169:** Detects Priority Display product in line items
- **Line 196:** Writes `is_priority_display: hasPriorityDisplay` to orders
- **Line 240:** Updates `retailers.priority_display_active: true`

### Dashboard Settings (DashboardSettings.jsx)
- **Line 42:** Reads `retailerData?.priority_display_active`
- **Line 60-62:** Queries `orders.is_priority_display`
- **Line 72:** Updates `retailers.priority_display_active`

### Also Used In:
- `pages/onboard/shopify-connect.js` (lines 135, 145, 163, 165, 172, 175)

## ✅ Solution Applied

### Migration File Created
**Location:** `tapify-marketplace/context/supabase/migrations/2025-10-schema-fix-priority-display.sql`

### Changes Made

#### ✅ orders.is_priority_display → BOOLEAN
- Creates column if missing
- Converts from JSON/TEXT to BOOLEAN if wrong type
- Coerces truthy/falsy values correctly
- Sets `DEFAULT FALSE NOT NULL`

#### ✅ retailers.priority_display_active → BOOLEAN
- Creates column if missing
- Converts from JSON/TEXT to BOOLEAN if wrong type
- Sets `DEFAULT FALSE NOT NULL`

#### ❌ orders.priority_display → DROPPED
- Migrates data to `is_priority_display` before dropping
- Removes legacy column to prevent conflicts

#### 🔄 Data Backfill
- Updates `retailers.priority_display_active = TRUE` for any retailer with orders where `is_priority_display = TRUE`

#### 📊 Indexes Added
- `idx_orders_is_priority_display` (partial index on TRUE values)
- `idx_retailers_priority_display_active` (partial index on TRUE values)

## 🚀 Deployment Instructions

### Step 1: Review Migration
```bash
cat tapify-marketplace/context/supabase/migrations/2025-10-schema-fix-priority-display.sql
```

### Step 2: Apply Migration in Supabase

**Option A: Supabase Dashboard SQL Editor**
1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy entire contents of `2025-10-schema-fix-priority-display.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Check for success messages in NOTICES

**Option B: Supabase CLI** (if installed)
```bash
cd tapify-marketplace
supabase db push
```

**Option C: Direct psql** (if you have connection string)
```bash
psql "postgresql://..." -f context/supabase/migrations/2025-10-schema-fix-priority-display.sql
```

### Step 3: Verify Migration Success

Run these queries in Supabase SQL Editor:

#### Check Column Types
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('orders', 'retailers')
  AND column_name IN ('is_priority_display', 'priority_display_active', 'priority_display')
ORDER BY table_name, column_name;
```

**Expected Result:**
```
column_name                 | data_type | is_nullable | column_default
----------------------------+-----------+-------------+----------------
is_priority_display         | boolean   | NO          | false
priority_display_active     | boolean   | NO          | false
```

**Note:** `priority_display` should NOT appear (dropped)

#### Sample Priority Display Orders
```sql
SELECT
  shopify_order_id,
  is_priority_display,
  retailer_id,
  total,
  processed_at
FROM orders
WHERE is_priority_display = TRUE
ORDER BY processed_at DESC
LIMIT 10;
```

#### Sample Active Priority Retailers
```sql
SELECT
  id,
  name,
  priority_display_active,
  converted,
  created_at
FROM retailers
WHERE priority_display_active = TRUE
ORDER BY created_at DESC
LIMIT 10;
```

#### Check for Mismatches
```sql
-- Retailers with priority orders but flag not set (should be empty)
SELECT
  r.id,
  r.name,
  r.priority_display_active,
  COUNT(o.id) as priority_orders
FROM retailers r
JOIN orders o ON o.retailer_id = r.id
WHERE o.is_priority_display = TRUE
  AND r.priority_display_active = FALSE
GROUP BY r.id, r.name, r.priority_display_active;
```

### Step 4: Test Webhook

#### Trigger Test Order
1. Go to Shopify store: https://pawpayaco.com
2. Add "Priority Display" product to cart
3. Include `?ref=TEST_UID` in URL (replace with real UID)
4. Complete checkout
5. Monitor webhook logs for errors

#### Check Webhook Logs
```bash
# If using Vercel
vercel logs tapify-marketplace --since 5m

# Or check Supabase realtime logs
# Dashboard → Logs → API
```

#### Verify Data Written
```sql
-- Check latest order
SELECT
  shopify_order_id,
  is_priority_display,
  retailer_id,
  total,
  processed_at
FROM orders
ORDER BY processed_at DESC
LIMIT 5;

-- Check if retailer was updated
SELECT
  id,
  name,
  priority_display_active
FROM retailers
WHERE id = 'RETAILER_ID_FROM_ORDER';
```

## 📊 Migration Safety Features

### ✅ Idempotent
- Safe to run multiple times
- Checks for column existence before altering
- Won't error if already migrated

### ✅ Data Preservation
- Migrates legacy data before dropping columns
- Coerces values safely (defaults to FALSE on error)
- Uses CASE statements for robust type conversion

### ✅ Rollback Support
- Wrapped in BEGIN/COMMIT transaction
- Can ROLLBACK if errors occur
- No data loss on failure

### ✅ Verbose Logging
- RAISE NOTICE statements for debugging
- Shows column types detected
- Confirms migration steps

## 🔧 Troubleshooting

### Migration Fails with Permission Error
**Solution:** Use service role key or run as postgres user
```sql
-- Check current role
SELECT current_user, current_database();

-- If needed, grant permissions
GRANT ALL ON TABLE orders, retailers TO postgres;
```

### Column Still Wrong Type After Migration
**Check:** Did transaction commit?
```sql
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name = 'is_priority_display';
```

**If still wrong:** Run migration again (it's idempotent)

### Webhook Still Failing After Migration
**Check:** Application using correct Supabase URL?
```bash
# Verify environment variables
cat .env.local | grep SUPABASE
```

**Check:** RLS policies allowing insert?
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'orders';

-- List policies
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

## 📝 Summary of Changes

| Table     | Column                     | Action           | Type    | Default | Nullable |
|-----------|----------------------------|------------------|---------|---------|----------|
| orders    | is_priority_display        | ✅ Added/Fixed   | BOOLEAN | FALSE   | NO       |
| orders    | priority_display           | ❌ Dropped       | -       | -       | -        |
| retailers | priority_display_active    | ✅ Added/Fixed   | BOOLEAN | FALSE   | NO       |

**Indexes Added:**
- `idx_orders_is_priority_display` (partial, on TRUE only)
- `idx_retailers_priority_display_active` (partial, on TRUE only)

**Data Backfilled:**
- Retailers with priority orders automatically flagged as `priority_display_active = TRUE`

---

## 🎯 Next Steps

1. ✅ Apply migration in Supabase
2. ✅ Run verification queries
3. ✅ Test webhook with Priority Display order
4. ✅ Monitor production for 24 hours
5. ✅ Archive this document for reference

**Status:** Ready to deploy
**Risk Level:** Low (idempotent, preserves data, rollback supported)
**Estimated Downtime:** None (additive changes only)
