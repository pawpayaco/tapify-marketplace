# Priority Display Implementation Verification Guide

This document outlines how to verify that the Shopify → Supabase → UI loop is working correctly for the Priority Display feature.

## What Was Implemented

### 1. Toast Hook (`/context/ui/useToast.js`)
- Created a reusable toast notification hook
- Shows user feedback for 3 seconds
- Used across shopify-connect and DashboardSettings

### 2. Priority Display Verification Helper (`/lib/client/verifyPriorityDisplay.js`)
- Client-side helper to verify priority display status
- Queries `retailers` table for `priority_display_active` flag
- Includes console logging for debugging

### 3. Enhanced Webhook Handler (`/pages/api/shopify-webhook.js`)
- Already correctly detects Priority Display products
- Sets `is_priority_display` on orders
- Updates `priority_display_active` on retailers
- Enhanced logging: `[shopify-webhook] ✅ Priority Display order processed for retailer: <id>`

### 4. Updated Shopify Connect Page (`/pages/onboard/shopify-connect.js`)
- Integrated toast notifications
- Added verification using `verifyPriorityDisplay()`
- Detects successful checkout via `?success=1` URL parameter
- Shows success toast and redirects to dashboard
- Self-healing sync between orders and retailers tables

### 5. Updated Dashboard Settings (`/components/DashboardSettings.js`)
- Integrated toast notifications
- Uses `verifyPriorityDisplay()` for status checks
- Shows success toast when priority display becomes active
- Self-healing sync between orders and retailers tables

## Database Verification Queries

Run these queries in your Supabase SQL editor to verify the implementation:

### Check Recent Orders with Priority Display
```sql
SELECT
  shopify_order_id,
  is_priority_display,
  retailer_id,
  created_at
FROM orders
WHERE is_priority_display = true
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: Should show orders with `is_priority_display = true` and their associated `retailer_id`

### Check Retailers with Active Priority Display
```sql
SELECT
  id,
  name,
  priority_display_active,
  updated_at
FROM retailers
WHERE priority_display_active = true
ORDER BY updated_at DESC
LIMIT 5;
```

**Expected**: Should show retailers with `priority_display_active = true`

### Verify Data Consistency (Orders → Retailers)
```sql
SELECT
  o.shopify_order_id,
  o.is_priority_display as order_has_priority,
  o.retailer_id,
  r.priority_display_active as retailer_has_priority,
  r.name as retailer_name
FROM orders o
LEFT JOIN retailers r ON o.retailer_id = r.id
WHERE o.is_priority_display = true
ORDER BY o.created_at DESC
LIMIT 10;
```

**Expected**: For each order where `order_has_priority = true`, the corresponding retailer should have `retailer_has_priority = true`

## Testing the Full Flow

### Test 1: Shopify Purchase Flow
1. Navigate to `/onboard/shopify-connect`
2. Click "Upgrade & Register on Shopify"
3. Complete checkout on Shopify with Priority Display product
4. Get redirected back with `?success=1` parameter
5. **Expected Results:**
   - Toast notification: "🎉 Display ordered successfully!"
   - Auto-redirect to dashboard after 2 seconds
   - Webhook processes order in background
   - Database updated with `is_priority_display = true` and `priority_display_active = true`

### Test 2: Dashboard Real-Time Update
1. Complete a Priority Display purchase
2. Navigate to dashboard settings
3. **Expected Results:**
   - Component calls `verifyPriorityDisplay()`
   - If newly active, shows toast: "🎉 Your Priority Display is now active!"
   - Status card shows "Priority Display Active" with green badge
   - Console logs: `[verifyPriorityDisplay] Retailer <id> active: true`

### Test 3: Webhook Verification
1. Monitor server logs during a Shopify purchase
2. **Expected Console Logs:**
   ```
   [shopify-webhook] Priority Display detected: true
   [shopify-webhook] Priority Display detected, updating retailer flag for retailer: <id>
   [shopify-webhook] ✅ Priority Display order processed for retailer: <id>
   [shopify-webhook] ✅ Payout job created: <job-id>
   [shopify-webhook] ✅ Webhook processed successfully
   ```

### Test 4: Self-Healing Sync
1. Manually set a retailer's `priority_display_active = false` in database
2. Ensure an order exists with `is_priority_display = true` for that retailer
3. Visit dashboard settings or shopify-connect page
4. **Expected Results:**
   - Verification detects mismatch
   - Automatically updates retailer record
   - Toast shows activation message
   - Console logs sync activity

## Success Criteria

✅ Webhook correctly detects Priority Display product purchases
✅ Webhook updates both `orders.is_priority_display` and `retailers.priority_display_active`
✅ Toast notifications appear on successful purchase
✅ Dashboard reflects active status immediately
✅ Self-healing sync prevents data inconsistencies
✅ Console logs provide clear debugging information
✅ UI redirects properly after Shopify checkout

## Troubleshooting

### Toast Not Showing
- Check browser console for errors
- Verify `useToast` hook is properly imported
- Ensure `<Toast />` component is rendered in JSX

### Priority Display Not Activating
- Check Supabase logs for webhook errors
- Verify SHOPIFY_WEBHOOK_SECRET is correct
- Check product title includes "priority display" (case-insensitive)
- Run database verification queries above

### Redirect Not Working
- Ensure Shopify checkout returns with `?success=1` parameter
- Check if `router.push('/onboard/dashboard')` executes
- Verify no JavaScript errors in browser console

### Data Inconsistency
- Run the consistency verification query above
- Check webhook logs for error messages
- Verify self-healing logic runs on page load
