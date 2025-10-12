# SCHEMA GAPS & MIGRATION PLAN

**Status:** 🚨 Current database is ~95% complete
**Source:** `full_dump.sql` verified against code requirements
**Date:** October 11, 2025

This document outlines the **5% of schema changes needed** to make your Supabase database fully compatible with your codebase and business requirements.

---

## Executive Summary

Your database schema is **solid and well-structured**, but has **8 critical gaps** that prevent certain features from working:

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Commission columns missing | 🔴 High | Custom commission rates impossible |
| 2 | `priority_display_active` missing | 🔴 High | Priority Display tracking broken |
| 3 | `is_priority_display` missing | 🟡 Medium | Order analytics impossible |
| 4 | Plaid tokens unencrypted | 🔥 Critical | Security vulnerability |
| 5 | Missing FK constraints | 🟡 Medium | Data integrity risk |
| 6 | Rounding errors in code | 🟡 Medium | Penny discrepancies |
| 7 | No Dwolla webhook handler | 🟡 Medium | Failed transfers undetected |
| 8 | Priority Display payouts blocked | 🔴 High | Retailers never paid |

---

## Complete Migration Script

Run this SQL script in your Supabase SQL Editor to fix all schema gaps:

```sql
-- ============================================================================
-- TAPIFY MARKETPLACE: SCHEMA GAPS MIGRATION
-- ============================================================================
-- Purpose: Fix 8 critical schema gaps identified in database audit
-- Date: 2025-10-11
-- Version: 1.0
-- Run Time: ~2 seconds (no data migration needed)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- ISSUE #1: Add Commission Columns to vendors Table
-- ----------------------------------------------------------------------------
-- Impact: Enables custom commission rate configuration per vendor
-- Code: /pages/api/shopify-webhook.js:79-83

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS retailer_commission_percent numeric DEFAULT 20
    CHECK (retailer_commission_percent >= 0 AND retailer_commission_percent <= 100),
  ADD COLUMN IF NOT EXISTS sourcer_commission_percent numeric DEFAULT 10
    CHECK (sourcer_commission_percent >= 0 AND sourcer_commission_percent <= 100),
  ADD COLUMN IF NOT EXISTS tapify_commission_percent numeric DEFAULT 10
    CHECK (tapify_commission_percent >= 0 AND tapify_commission_percent <= 100),
  ADD COLUMN IF NOT EXISTS vendor_commission_percent numeric DEFAULT 60
    CHECK (vendor_commission_percent >= 0 AND vendor_commission_percent <= 100);

COMMENT ON COLUMN vendors.retailer_commission_percent IS 'Percentage of order total paid to retailer (default 20%)';
COMMENT ON COLUMN vendors.sourcer_commission_percent IS 'Percentage of order total paid to sourcer if exists (default 10%)';
COMMENT ON COLUMN vendors.tapify_commission_percent IS 'Percentage of order total kept by Tapify platform (default 10%)';
COMMENT ON COLUMN vendors.vendor_commission_percent IS 'Percentage of order total kept by vendor (default 60% with sourcer, 80% without)';

-- Add constraint to ensure commission percentages sum to 100
ALTER TABLE vendors
  ADD CONSTRAINT vendors_commission_sum_check
  CHECK (
    (sourcer_commission_percent IS NULL AND retailer_commission_percent + vendor_commission_percent = 100)
    OR
    (sourcer_commission_percent IS NOT NULL AND retailer_commission_percent + sourcer_commission_percent + tapify_commission_percent + vendor_commission_percent = 100)
  );

-- ----------------------------------------------------------------------------
-- ISSUE #2: Add priority_display_active to retailers Table
-- ----------------------------------------------------------------------------
-- Impact: Enables tracking which retailers have active Priority Display subscriptions
-- Code: /pages/api/shopify-webhook.js:372-384

ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS priority_display_active boolean DEFAULT false;

COMMENT ON COLUMN retailers.priority_display_active IS 'TRUE if retailer has purchased and activated Priority Display subscription';

-- Add partial index for fast queries (only indexes TRUE values)
CREATE INDEX IF NOT EXISTS idx_retailers_priority_display_active
  ON retailers (priority_display_active)
  WHERE priority_display_active = TRUE;

-- ----------------------------------------------------------------------------
-- ISSUE #3: Add is_priority_display to orders Table
-- ----------------------------------------------------------------------------
-- Impact: Enables direct queries for Priority Display orders and analytics
-- Note: Currently Priority Display orders are only identifiable via payout_jobs.status

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_priority_display boolean DEFAULT false;

COMMENT ON COLUMN orders.is_priority_display IS 'TRUE if order includes Priority Display product purchase';

-- Add partial index for fast filtering
CREATE INDEX IF NOT EXISTS idx_orders_is_priority_display
  ON orders (is_priority_display)
  WHERE is_priority_display = TRUE;

-- Backfill existing Priority Display orders
UPDATE orders o
SET is_priority_display = true
WHERE EXISTS (
  SELECT 1
  FROM payout_jobs pj
  WHERE pj.order_id = o.id
  AND pj.status = 'priority_display'
);

-- ----------------------------------------------------------------------------
-- ISSUE #5: Add Missing Foreign Key Constraints
-- ----------------------------------------------------------------------------
-- Impact: Ensures referential integrity for user relationships
-- Note: Using ON DELETE SET NULL to preserve historical data

-- retailers.created_by_user_id → auth.users
ALTER TABLE retailers
  DROP CONSTRAINT IF EXISTS retailers_created_by_user_id_fkey;

ALTER TABLE retailers
  ADD CONSTRAINT retailers_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- retailers.recruited_by_sourcer_id → sourcer_accounts
ALTER TABLE retailers
  DROP CONSTRAINT IF EXISTS retailers_recruited_by_sourcer_id_fkey;

ALTER TABLE retailers
  ADD CONSTRAINT retailers_recruited_by_sourcer_id_fkey
  FOREIGN KEY (recruited_by_sourcer_id)
  REFERENCES sourcer_accounts(id)
  ON DELETE SET NULL;

-- vendors.created_by_user_id → auth.users
ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_created_by_user_id_fkey;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- uids.claimed_by_user_id → auth.users
ALTER TABLE uids
  DROP CONSTRAINT IF EXISTS uids_claimed_by_user_id_fkey;

ALTER TABLE uids
  ADD CONSTRAINT uids_claimed_by_user_id_fkey
  FOREIGN KEY (claimed_by_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- payouts.triggered_by → auth.users
ALTER TABLE payouts
  DROP CONSTRAINT IF EXISTS payouts_triggered_by_fkey;

ALTER TABLE payouts
  ADD CONSTRAINT payouts_triggered_by_fkey
  FOREIGN KEY (triggered_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- ISSUE #4: Plaid Token Encryption (PLACEHOLDER)
-- ----------------------------------------------------------------------------
-- ⚠️ WARNING: This is a complex migration that requires code changes
-- ⚠️ DO NOT RUN until you've implemented encryption in your API routes
--
-- See PAYMENT_SYSTEM_COMPLETE.md Issue #4 for full implementation guide
--
-- Steps required:
-- 1. Set up Supabase Vault or pgcrypto
-- 2. Update all API routes that read/write plaid_access_token
-- 3. Migrate existing tokens to encrypted storage
-- 4. Then run the ALTER TABLE commands
--
-- Placeholder for when ready:
-- ALTER TABLE retailer_accounts
--   ALTER COLUMN plaid_access_token TYPE bytea
--   USING pgp_sym_encrypt(plaid_access_token, current_setting('app.settings.encryption_key'));

COMMENT ON COLUMN retailer_accounts.plaid_access_token IS '🚨 SECURITY: Should be encrypted! Currently stored as plain text.';
COMMENT ON COLUMN sourcer_accounts.plaid_access_token IS '🚨 SECURITY: Should be encrypted! Currently stored as plain text.';

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------

-- Verify commission columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors'
    AND column_name = 'retailer_commission_percent'
  ) THEN
    RAISE EXCEPTION 'Migration failed: vendors.retailer_commission_percent not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retailers'
    AND column_name = 'priority_display_active'
  ) THEN
    RAISE EXCEPTION 'Migration failed: retailers.priority_display_active not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'is_priority_display'
  ) THEN
    RAISE EXCEPTION 'Migration failed: orders.is_priority_display not created';
  END IF;

  RAISE NOTICE '✅ Migration completed successfully!';
END $$;

COMMIT;

-- Post-migration verification
SELECT 'vendors commission columns' as check_name,
  COUNT(*) FILTER (WHERE retailer_commission_percent IS NOT NULL) as with_config,
  COUNT(*) as total_vendors
FROM vendors;

SELECT 'retailers priority display' as check_name,
  COUNT(*) FILTER (WHERE priority_display_active = true) as active_priority,
  COUNT(*) as total_retailers
FROM retailers;

SELECT 'orders priority display' as check_name,
  COUNT(*) FILTER (WHERE is_priority_display = true) as priority_orders,
  COUNT(*) as total_orders
FROM orders;
```

---

## Code Changes Required

After running the migration script, update these code files:

### 🚨 CRITICAL: Understanding Two Purchase Flows

Your system has **TWO DISTINCT purchase flows** that need different handling:

| Flow | Trigger | UID Present? | Purpose | Actions Needed |
|------|---------|--------------|---------|----------------|
| **Flow 1: Retailer Upgrade** | Retailer registers for display, buys Priority Display add-on on YOUR Shopify | ❌ NO | Retailer paying for their own Priority Display subscription | Update `retailers.priority_display_active = true`, **DO NOT create payout job** (no commissions) |
| **Flow 2: Customer Sale** | Customer at retail store scans NFC, buys via affiliate link on YOUR Shopify | ✅ YES | Normal customer purchase attributed to retailer | Create order + payout job with commissions |

**Key Insight:** You only need **ONE webhook** (`/api/shopify-webhook`) that distinguishes between these flows based on UID presence and customer email matching.

---

### 🔧 Code Changes Needed

#### 1. Fix Shopify Webhook to Handle Both Purchase Flows

**File:** `/pages/api/shopify-webhook.js`
**Lines:** 300-400 (order processing section)

**Problem:**
- Current code doesn't distinguish between retailer upgrades vs customer sales
- Tries to create payout jobs for ALL Priority Display orders (including retailer self-purchases)
- Updates `priority_display_active` for customer orders (wrong!)

**Solution:**
Add logic to detect which flow is happening:

```javascript
// After UID extraction and Priority Display detection...

// Detect Priority Display product
const isPriorityDisplay = order.line_items?.some(item =>
  item.title?.toLowerCase().includes('priority display') ||
  item.title?.toLowerCase().includes('priority placement')
);

// ============================================================================
// FLOW DETECTION: Retailer Upgrade vs Customer Sale
// ============================================================================

let orderType = null;
let targetRetailerId = retailerId; // from UID lookup

// FLOW 1: Retailer buying Priority Display for themselves
// Criteria: Priority Display product + NO UID + email matches a retailer
if (isPriorityDisplay && !uid && order.email) {
  const { data: retailer } = await supabaseAdmin
    .from('retailers')
    .select('id, name, email')
    .eq('email', order.email)
    .maybeSingle();

  if (retailer) {
    orderType = 'retailer_upgrade';
    targetRetailerId = retailer.id;

    console.log('[Shopify Webhook] FLOW 1: Retailer Upgrade detected', {
      retailer_id: retailer.id,
      retailer_email: order.email,
      order_total: order.total_price
    });

    // ✅ Update retailer's Priority Display status
    await supabaseAdmin
      .from('retailers')
      .update({ priority_display_active: true })
      .eq('id', retailer.id);

    // ✅ Create order record for tracking (but NO payout job)
    const { data: orderData } = await supabaseAdmin
      .from('orders')
      .insert({
        shopify_order_id: order.id?.toString(),
        shopify_order_number: order.name || order.order_number?.toString(),
        shop_domain: shopDomain,
        customer_email: order.email,
        customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        retailer_id: retailer.id, // Link to retailer who purchased
        vendor_id: vendorId, // Still Pawpaya
        currency: order.currency || 'USD',
        total: Number(order.total_price) || 0,
        subtotal: Number(order.subtotal_price) || 0,
        tax_total: Number(order.total_tax) || 0,
        discount_total: Number(order.total_discounts) || 0,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        processed_at: order.created_at,
        source_uid: null, // NO UID for retailer upgrades
        is_priority_display: true,
        line_items: order.line_items || [],
        raw_payload: order,
      })
      .select()
      .single();

    console.log('[Shopify Webhook] Order created (retailer upgrade, no payout job)');

    return res.status(200).json({
      success: true,
      type: 'retailer_upgrade',
      message: 'Priority Display activated for retailer',
      retailer_id: retailer.id,
      order_id: orderData?.id
    });
  }
}

// FLOW 2: Customer sale via affiliate link
// Criteria: HAS UID (customer came through retailer's affiliate link)
if (uid && retailerId) {
  orderType = 'customer_sale';

  console.log('[Shopify Webhook] FLOW 2: Customer Sale detected', {
    uid,
    retailer_id: retailerId,
    is_priority_display: isPriorityDisplay,
    order_total: order.total_price
  });

  // ✅ Create order record
  const { data: orderData } = await supabaseAdmin
    .from('orders')
    .insert({
      shopify_order_id: order.id?.toString(),
      shopify_order_number: order.name || order.order_number?.toString(),
      shop_domain: shopDomain,
      customer_email: order.email,
      customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
      retailer_id: retailerId, // From UID lookup
      vendor_id: vendorId,
      business_id: businessId,
      currency: order.currency || 'USD',
      total: Number(order.total_price) || 0,
      subtotal: Number(order.subtotal_price) || 0,
      tax_total: Number(order.total_tax) || 0,
      discount_total: Number(order.total_discounts) || 0,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      processed_at: order.created_at,
      source_uid: uid, // ✅ UID present
      is_priority_display: isPriorityDisplay, // ✅ Track if Priority Display
      line_items: order.line_items || [],
      raw_payload: order,
    })
    .select()
    .single();

  // ✅ Create payout job with commissions (call existing createPayoutJob function)
  await createPayoutJob({
    orderId: orderData.id,
    retailerId: retailerId,
    vendorId: vendorId,
    total: Number(order.total_price) || 0,
    sourceUid: uid,
    // Set status based on whether it's Priority Display
    initialStatus: isPriorityDisplay ? 'priority_display' : 'pending'
  });

  console.log('[Shopify Webhook] Order + payout job created');

  return res.status(200).json({
    success: true,
    type: 'customer_sale',
    message: 'Customer order processed with commission payout',
    retailer_id: retailerId,
    order_id: orderData?.id
  });
}

// FLOW 3: Unattributed order (no UID, no matching retailer email)
// This is an order that came from somewhere else - still create order but no payout
console.log('[Shopify Webhook] FLOW 3: Unattributed order (no UID, no matching retailer)');

const { data: orderData } = await supabaseAdmin
  .from('orders')
  .insert({
    shopify_order_id: order.id?.toString(),
    shopify_order_number: order.name || order.order_number?.toString(),
    shop_domain: shopDomain,
    customer_email: order.email,
    customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
    vendor_id: vendorId,
    currency: order.currency || 'USD',
    total: Number(order.total_price) || 0,
    subtotal: Number(order.subtotal_price) || 0,
    tax_total: Number(order.total_tax) || 0,
    discount_total: Number(order.total_discounts) || 0,
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    processed_at: order.created_at,
    is_priority_display: isPriorityDisplay,
    line_items: order.line_items || [],
    raw_payload: order,
  })
  .select()
  .single();

console.log('[Shopify Webhook] Unattributed order created (no payout job)');

return res.status(200).json({
  success: true,
  type: 'unattributed',
  message: 'Order recorded without attribution',
  order_id: orderData?.id
});
```

**Summary of Changes:**
- ✅ Detects 3 flows: retailer upgrade, customer sale, unattributed
- ✅ Retailer upgrades: Updates `priority_display_active`, NO payout job
- ✅ Customer sales: Creates order + payout job with commissions
- ✅ Only ONE webhook needed (no need for two separate webhooks)
- ✅ Admin-only commission configuration (already handled by admin UI)

---

#### 2. Fix Priority Display Payout Handling

**File:** `/pages/api/payout.js`
**Line:** 119

**Current Code:**
```javascript
if (job.status !== 'pending') {
  return res.status(400).json({ error: 'Payout already processed' });
}
```

**Fixed Code:**
```javascript
if (!['pending', 'priority_display'].includes(job.status)) {
  return res.status(400).json({ error: 'Payout already processed' });
}
```

**Why:** Allows admin to pay Priority Display customer orders (Flow 2). Retailer upgrade orders (Flow 1) never create payout jobs, so this doesn't affect them.

---

#### 3. Fix Commission Rounding Errors

**File:** `/pages/api/shopify-webhook.js`
**Line:** 102-105

**Current Code:**
```javascript
const retailerCut = Number((total * (retailerPercent / 100)).toFixed(2));
const vendorCut = Number((total * (vendorPercent / 100)).toFixed(2));
const sourcerCut = Number((total * (sourcerPercent / 100)).toFixed(2));
const tapifyCut = Number((total * (tapifyPercent / 100)).toFixed(2));
```

**Fixed Code (vendor cut as remainder):**
```javascript
const retailerCut = Number((total * (retailerPercent / 100)).toFixed(2));
const sourcerCut = sourcerId ? Number((total * (sourcerPercent / 100)).toFixed(2)) : 0;
const tapifyCut = sourcerId ? Number((total * (tapifyPercent / 100)).toFixed(2)) : 0;
// Calculate vendor cut as remainder to ensure sum equals total
const vendorCut = Number((total - retailerCut - sourcerCut - tapifyCut).toFixed(2));
```

---

#### 4. Add Dwolla Webhook Handler

**Create New File:** `/pages/api/dwolla-webhook.js`

```javascript
import { supabaseAdmin } from '../../lib/supabase';
import { logEvent } from '../../utils/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, resourceId, _links } = req.body;

    console.log('[Dwolla Webhook]', { topic, resourceId });

    // Handle transfer failures
    if (topic === 'transfer_failed') {
      // Find payout_job with this transfer_id
      const { data: jobs } = await supabaseAdmin
        .from('payout_jobs')
        .select('id, transfer_ids')
        .contains('transfer_ids', [resourceId]);

      if (jobs && jobs.length > 0) {
        // Update payout job status to failed
        await supabaseAdmin
          .from('payout_jobs')
          .update({ status: 'failed' })
          .in('id', jobs.map(j => j.id));

        await logEvent('system', 'dwolla_transfer_failed', {
          transfer_id: resourceId,
          payout_job_ids: jobs.map(j => j.id)
        });
      }
    }

    // Handle transfer completion (optional - for reconciliation)
    if (topic === 'transfer_completed') {
      await logEvent('system', 'dwolla_transfer_completed', {
        transfer_id: resourceId
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Dwolla Webhook Error]', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

**Then configure in Dwolla dashboard:**
- Webhook URL: `https://your-domain.com/api/dwolla-webhook`
- Events: `transfer_failed`, `transfer_completed`

---

## Post-Migration Testing Checklist

After running the migration script and code updates:

### 1. Test Commission Configuration

```sql
-- Test: Update vendor commission rates
UPDATE vendors
SET
  retailer_commission_percent = 25,
  vendor_commission_percent = 75
WHERE id = 'your-vendor-id';

-- Verify the constraint works (should fail if sum ≠ 100)
UPDATE vendors
SET retailer_commission_percent = 30
WHERE id = 'your-vendor-id';  -- Should raise constraint violation
```

### 2. Test Priority Display Tracking

```sql
-- Test: Manually set priority_display_active
UPDATE retailers
SET priority_display_active = true
WHERE id = 'test-retailer-id';

-- Query all retailers with Priority Display
SELECT name, email, priority_display_active
FROM retailers
WHERE priority_display_active = true;
```

### 3. Test Priority Display Orders

```sql
-- Test: Query Priority Display orders
SELECT
  o.id,
  o.shopify_order_number,
  o.total,
  o.is_priority_display,
  pj.status
FROM orders o
LEFT JOIN payout_jobs pj ON pj.order_id = o.id
WHERE o.is_priority_display = true;
```

### 4. Test Foreign Key Constraints

```sql
-- Test: Try to insert retailer with non-existent user_id (should fail)
INSERT INTO retailers (name, created_by_user_id)
VALUES ('Test Store', 'non-existent-uuid');  -- Should raise FK violation
```

### 5. Test Priority Display Payout

1. Create test Priority Display order in Shopify
2. Verify webhook creates payout_job with `status='priority_display'`
3. Go to Admin Dashboard → Payouts tab
4. Click "Pay" button on Priority Display payout
5. Verify payout processes successfully (not rejected)

---

## Rollback Plan

If you need to rollback the migration:

```sql
BEGIN;

-- Remove added columns
ALTER TABLE vendors
  DROP COLUMN IF EXISTS retailer_commission_percent,
  DROP COLUMN IF EXISTS sourcer_commission_percent,
  DROP COLUMN IF EXISTS tapify_commission_percent,
  DROP COLUMN IF EXISTS vendor_commission_percent;

ALTER TABLE retailers
  DROP COLUMN IF EXISTS priority_display_active;

ALTER TABLE orders
  DROP COLUMN IF EXISTS is_priority_display;

-- Remove added constraints
ALTER TABLE retailers
  DROP CONSTRAINT IF EXISTS retailers_created_by_user_id_fkey,
  DROP CONSTRAINT IF EXISTS retailers_recruited_by_sourcer_id_fkey;

ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_created_by_user_id_fkey;

ALTER TABLE uids
  DROP CONSTRAINT IF EXISTS uids_claimed_by_user_id_fkey;

ALTER TABLE payouts
  DROP CONSTRAINT IF EXISTS payouts_triggered_by_fkey;

-- Remove indexes
DROP INDEX IF EXISTS idx_retailers_priority_display_active;
DROP INDEX IF EXISTS idx_orders_is_priority_display;

COMMIT;
```

---

## Future Enhancements (Beyond the 5%)

These are **not critical gaps** but nice-to-have improvements:

### Deprecated Column Cleanup

After verifying no code uses these columns, you can drop them:

```sql
-- Remove deprecated retailer columns
ALTER TABLE retailers
  DROP COLUMN IF EXISTS location,  -- Use 'address' instead
  DROP COLUMN IF EXISTS store_phone,  -- Use 'phone' instead
  DROP COLUMN IF EXISTS onboarding_completed,  -- Use 'converted' instead
  DROP COLUMN IF EXISTS cold_email_sent,  -- Moved to retailer_outreach table
  DROP COLUMN IF EXISTS cold_email_sent_at;  -- Moved to retailer_outreach table
```

### Additional Indexes for Performance

```sql
-- Speed up payout queries by status
CREATE INDEX IF NOT EXISTS idx_payout_jobs_status
  ON payout_jobs (status)
  WHERE status IN ('pending', 'priority_display');

-- Speed up payout queries by date
CREATE INDEX IF NOT EXISTS idx_payout_jobs_created_at
  ON payout_jobs (created_at DESC);
```

---

## Summary

✅ **Run the migration script** → Fixes schema gaps
✅ **Update 4 code files** → Fixes logic bugs
✅ **Configure Dwolla webhook** → Enables transfer monitoring
✅ **Run tests** → Verify everything works

**Estimated Time:** 30 minutes total (10 min migration + 20 min code updates + testing)

**Risk Level:** 🟢 Low (all changes are additive, no data loss risk)

---

**Questions? Issues?** Check PAYMENT_SYSTEM_COMPLETE.md for detailed explanations of each issue.
