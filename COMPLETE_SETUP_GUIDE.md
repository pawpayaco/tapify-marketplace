# Complete Dashboard Setup Guide

This guide covers both features implemented:
1. **Order Another Display** - Allows retailers to order additional displays
2. **Priority Display Webhook** - Shopify integration for $50 upgrade

---

## Feature 1: Order Another Display

### What It Does
Retailers can order additional displays from their dashboard, incrementing their owned display count.

### How It Works
1. User sees "Displays Owned: 1" in Display Confirmation card
2. Clicks "Order Another Display" button
3. Modal opens with store search & address form
4. Submits form
5. Counter increments (e.g., "Displays Owned: 2")
6. Redirects to Shopify Connect page (upsell opportunity)

### Database Migration Required
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add displays_ordered tracking to retailers table
BEGIN;

ALTER TABLE retailers
  ADD COLUMN IF NOT EXISTS displays_ordered integer DEFAULT 1;

UPDATE retailers
SET displays_ordered = 1
WHERE displays_ordered IS NULL OR displays_ordered = 0;

COMMIT;
```

### Files Changed
- **API**: `/pages/api/order-display.js` - Handles display orders
- **Modal**: `/components/OrderDisplayModal.js` - Order form UI
- **Dashboard**: `/pages/onboard/dashboard.js` - Integrated modal
- **Migration**: `/context/supabase/migrations/2025-10-add-displays-ordered.sql`

---

## Feature 2: Shopify Priority Display Webhook

### What It Does
Automatically updates retailer dashboard when they purchase the $50 Priority Display upgrade on Shopify.

### How It Works
1. Retailer registers → Email stored in database
2. Dashboard shows "Standard Display" with upgrade link
3. Customer clicks link → Redirected to Shopify
4. Purchases Priority Display product ($50)
5. Shopify sends webhook to your app
6. Webhook matches by email → Updates `priority_display_active = true`
7. Dashboard updates to show "Priority Display Active" 💎

### Setup Steps

#### 1. Create Shopify Product
- **Title**: Must include "Priority Display" or "Priority Placement"
- **Price**: $50.00
- **Product URL**: `https://pawpayaco.com/products/display-setup-for-affiliate`

#### 2. Configure Webhook
**Shopify Admin → Settings → Notifications → Webhooks**
- Event: `Order creation`
- Format: `JSON`
- URL: `https://yourdomain.com/api/shopify-webhook`

#### 3. Add Secret to Environment
```bash
# .env.local
SHOPIFY_WEBHOOK_SECRET=your_secret_from_shopify
```

### Dashboard Display States

**Before Purchase**:
```
┌─────────────────────────────────────┐
│ Displays Owned: 1                    │
│                                      │
│ 📦 Standard Display                  │
│    Upgrade to Priority Display       │
│                                      │
│ 🚚 Standard Shipping                 │
│    Free delivery (3-5 weeks)         │
│                                      │
│ [Order Another Display] Button       │
└─────────────────────────────────────┘
```

**After Purchase**:
```
┌─────────────────────────────────────┐
│ Displays Owned: 1                    │
│                                      │
│ 💎 Priority Display Active           │
│    Premium placement enabled         │
│                                      │
│ ⚡ Priority Shipping                 │
│    Priority delivery enabled         │
│                                      │
│ [Order Another Display] Button       │
└─────────────────────────────────────┘
```

### Important Requirements

1. **Email Matching**:
   - Shopify customer email MUST match `retailers.email`
   - This is how the webhook knows which retailer to update

2. **Product Title**:
   - Must include "Priority Display" OR "Priority Placement"
   - Case-insensitive matching

3. **One-Time Purchase**:
   - Once purchased, `priority_display_active` stays true
   - All future displays ship with priority

### Files Changed
- **Webhook**: `/pages/api/shopify-webhook.js` - Already existed, no changes needed
- **Dashboard**: `/pages/onboard/dashboard.js` - Updated UI to show status
- **Removed**: "Display Shipping Preferences" card (old toggle system)

---

## Testing Checklist

### Order Another Display
- [ ] Apply SQL migration for `displays_ordered` column
- [ ] Log into retailer account
- [ ] Go to dashboard
- [ ] See "Displays Owned: 1"
- [ ] Click "Order Another Display"
- [ ] Fill out form and submit
- [ ] See counter increment to "2"
- [ ] Verify redirect to Shopify Connect page

### Priority Display Webhook
- [ ] Shopify webhook configured
- [ ] `SHOPIFY_WEBHOOK_SECRET` set in environment
- [ ] Restart application
- [ ] Register test account with `test@example.com`
- [ ] Dashboard shows "Standard Display"
- [ ] Purchase on Shopify with SAME email
- [ ] Wait ~30 seconds
- [ ] Refresh dashboard
- [ ] See "Priority Display Active" 💎

---

## Troubleshooting

### Issue: Counter not incrementing
- **Check**: SQL migration applied?
- **Fix**: Run migration in Supabase SQL Editor

### Issue: Modal not opening
- **Check**: Browser console for errors
- **Fix**: Hard refresh (Cmd+Shift+R)

### Issue: Purchase not updating dashboard
- **Check 1**: Does Shopify email match `retailers.email`?
- **Check 2**: Does product title include "Priority Display"?
- **Check 3**: Is webhook configured correctly?
- **Check 4**: Is `SHOPIFY_WEBHOOK_SECRET` set?
- **Fix**: See `SHOPIFY_WEBHOOK_SETUP.md` for detailed troubleshooting

### Issue: Webhook failing
- **Check**: Shopify Admin → Webhooks → Recent deliveries
- **Error 401**: HMAC verification failed - check secret
- **Error 500**: Check application logs

---

## Manual Override (Admin Only)

If needed, manually enable Priority Display:

```sql
-- By email
UPDATE retailers
SET priority_display_active = true
WHERE email = 'customer@email.com';

-- By ID
UPDATE retailers
SET priority_display_active = true
WHERE id = 'retailer-uuid-here';
```

Or manually set displays_ordered:

```sql
UPDATE retailers
SET displays_ordered = 3
WHERE email = 'customer@email.com';
```

---

## Summary

### What's Live
✅ Order Another Display feature - fully functional
✅ Shopify webhook - already existed, just needed dashboard UI updates
✅ Dashboard UI - shows correct status based on purchase
✅ Email-based matching - automatic retailer identification

### What You Need To Do
1. **Apply SQL migration** for `displays_ordered` column
2. **Configure Shopify webhook** (if not already done)
3. **Add webhook secret** to environment variables
4. **Test both features** using checklist above
5. **Ensure product title** includes "Priority Display"

### Key Files
- `ORDER_DISPLAY_SETUP.md` - Detailed guide for Order Display feature
- `SHOPIFY_WEBHOOK_SETUP.md` - Detailed guide for webhook integration
- `pages/api/shopify-webhook.js` - Webhook handler (already existed)
- `pages/api/order-display.js` - Order display API
- `components/OrderDisplayModal.js` - Order form modal
- `pages/onboard/dashboard.js` - Main dashboard UI

---

## Support

For issues or questions:
1. Check application logs for webhook processing
2. Check Shopify webhook delivery status
3. Verify database values manually
4. Use `SHOPIFY_WEBHOOK_SETUP.md` troubleshooting section
