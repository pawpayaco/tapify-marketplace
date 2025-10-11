# Shopify Priority Display Webhook Setup Guide

This guide explains how the $50 Priority Display upgrade integrates with your retailer dashboard through Shopify webhooks.

## How It Works

### 1. **Customer Journey**
   1. Retailer registers on your platform → Creates account
   2. Registration form stores their email in `retailers` table
   3. Dashboard shows "Standard Display" with link to upgrade
   4. Customer clicks "Upgrade to Priority Display" link
   5. Redirected to Shopify product page: `https://pawpayaco.com/products/display-setup-for-affiliate`
   6. Customer completes purchase on Shopify
   7. Shopify sends webhook to your app
   8. Webhook matches purchase to retailer by email
   9. Updates `priority_display_active = true` in database
   10. Dashboard automatically updates to show "Priority Display Active"

### 2. **Email Matching**
The webhook matches Shopify customers to retailers using **email addresses**:

```javascript
// From webhook (line 266):
customer_email: order.email ?? order.customer?.email

// Matches to retailers table:
WHERE email = customer_email
```

**Important**: The email used on Shopify MUST match the email in the `retailers` table.

### 3. **Product Detection**
The webhook automatically detects Priority Display products by title:

```javascript
// From webhook (lines 254-258):
const hasPriorityDisplay = order.line_items?.some(item =>
  item.title?.toLowerCase().includes('priority display') ||
  item.title?.toLowerCase().includes('priority placement')
);
```

**Your Shopify product title must include**:
- "Priority Display" OR
- "Priority Placement"

Example titles that work:
- ✅ "Priority Display Setup"
- ✅ "Display Setup for Affiliate - Priority Placement"
- ✅ "Premium Priority Display Upgrade"
- ❌ "Express Shipping" (won't be detected)

### 4. **Database Updates**
When Priority Display is detected, the webhook:

1. **Creates order record** with `is_priority_display = true`
2. **Updates retailer** with `priority_display_active = true`
3. **Creates payout job** with status = `'priority_display'`

```javascript
// From webhook (lines 324-337):
if (hasPriorityDisplay && retailerId) {
  await supabaseAdmin
    .from('retailers')
    .update({ priority_display_active: true })
    .eq('id', retailerId);
}
```

## Shopify Setup Instructions

### Step 1: Create the Product

1. Go to Shopify Admin → Products
2. Create new product:
   - **Title**: "Priority Display Setup for Affiliates" (or similar with "Priority Display")
   - **Price**: $50.00
   - **SKU**: PRIORITY-DISPLAY-001 (optional but recommended)
   - **Description**: Explain the benefits (faster shipping, premium placement, etc.)

### Step 2: Configure Webhook in Shopify

1. Go to Shopify Admin → Settings → Notifications
2. Scroll to **Webhooks** section
3. Click **Create webhook**
4. Configure:
   - **Event**: `Order creation`
   - **Format**: `JSON`
   - **URL**: `https://yourdomain.com/api/shopify-webhook`
   - **Webhook API version**: `2024-01` (or latest)

### Step 3: Add Webhook Secret to Environment

The webhook uses HMAC verification for security. You need to add the secret:

1. In Shopify webhook settings, copy the **Webhook signing secret**
2. Add to your `.env.local`:
   ```
   SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### Step 4: Test the Integration

**Test Flow**:
1. Register a test retailer account with email: `test@example.com`
2. Check dashboard - should show "Standard Display"
3. Go to Shopify product page
4. Purchase with SAME email: `test@example.com`
5. Wait for webhook (usually instant, max 30 seconds)
6. Refresh dashboard - should now show "Priority Display Active" 💎

**Check Webhook Delivery**:
- Shopify Admin → Settings → Notifications → Webhooks
- Click on your webhook
- View "Recent deliveries" to see if it succeeded

## Dashboard Display

### Before Purchase (Standard Display)
```
┌─────────────────────────────────────────┐
│ 📦 Standard Display                      │
│ Upgrade to Priority Display for premium  │
│ placement                                │
│                                          │
│ 🚚 Standard Shipping                     │
│ Free standard delivery (3-5 weeks)       │
└─────────────────────────────────────────┘
```

### After Purchase (Priority Active)
```
┌─────────────────────────────────────────┐
│ 💎 Priority Display Active               │
│ Premium marketplace placement enabled    │
│                                          │
│ ⚡ Priority Shipping                     │
│ Your displays ship with priority         │
│ delivery                                 │
└─────────────────────────────────────────┘
```

## Technical Details

### Webhook Endpoint
**File**: `/pages/api/shopify-webhook.js`

**Security**:
- HMAC SHA256 verification
- Raw body parsing (no JSON middleware)
- Timing-safe comparison to prevent timing attacks

**Email Matching Query**:
```javascript
// Pseudo-code for matching logic
const customerEmail = order.email ?? order.customer?.email;

// Find retailer by email
const retailer = await db
  .from('retailers')
  .select('id, priority_display_active')
  .eq('email', customerEmail)
  .single();

// Update if Priority Display detected
if (hasPriorityDisplay && retailer) {
  await db
    .from('retailers')
    .update({ priority_display_active: true })
    .eq('id', retailer.id);
}
```

### Database Schema
```sql
-- retailers table
CREATE TABLE retailers (
  id UUID PRIMARY KEY,
  email TEXT,
  priority_display_active BOOLEAN DEFAULT FALSE,
  displays_ordered INTEGER DEFAULT 1,
  -- other fields...
);

-- orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  shopify_order_id TEXT,
  customer_email TEXT,
  is_priority_display BOOLEAN DEFAULT FALSE,
  retailer_id UUID REFERENCES retailers(id),
  -- other fields...
);
```

## Troubleshooting

### Issue: Purchase not updating dashboard

**Check 1**: Email Match
```sql
-- Check if emails match
SELECT id, email, priority_display_active
FROM retailers
WHERE email = 'customer@email.com';
```

**Check 2**: Webhook Delivery
- Go to Shopify Admin → Webhooks → Recent deliveries
- Check if webhook was delivered successfully
- If failed, check error message

**Check 3**: Product Title
- Product title must include "Priority Display" or "Priority Placement"
- Check case-insensitive match

**Check 4**: Webhook Logs
```bash
# Check your application logs for:
[shopify-webhook] Priority Display detected: true
[shopify-webhook] ✅ Priority Display order processed for retailer: [retailer-id]
```

### Issue: Webhook failing with 401 Unauthorized

**Cause**: HMAC verification failing

**Fix**:
1. Verify `SHOPIFY_WEBHOOK_SECRET` is set correctly in `.env.local`
2. Secret must match exactly from Shopify webhook settings
3. Restart your application after adding secret

### Issue: Customer email doesn't match

**Solution Options**:
1. **Best**: Update retailer email to match Shopify customer email
2. **Alternative**: Have customer create Shopify account with same email as registration

## Important Notes

1. **Email is the matching key** - Shopify customer email MUST match `retailers.email`
2. **Product title matters** - Must include "Priority Display" or "Priority Placement"
3. **Webhook is instant** - Dashboard updates should appear within seconds
4. **One-time purchase** - Once `priority_display_active = true`, it stays true
5. **No need to re-purchase** - Future displays will ship with priority
6. **Manual override**: Admins can manually set flag in database if needed

## Manual Database Update (Admin Only)

If needed, you can manually enable Priority Display for a retailer:

```sql
UPDATE retailers
SET priority_display_active = true
WHERE email = 'customer@email.com';
```

Or by retailer ID:
```sql
UPDATE retailers
SET priority_display_active = true
WHERE id = 'retailer-uuid-here';
```

## Support Checklist

When customer reports upgrade not working:

- [ ] Verify webhook is configured in Shopify
- [ ] Check webhook recent deliveries for errors
- [ ] Confirm `SHOPIFY_WEBHOOK_SECRET` is set
- [ ] Verify customer used same email for Shopify purchase
- [ ] Check product title includes "Priority Display"
- [ ] Check application logs for webhook processing
- [ ] Verify `priority_display_active` in database
- [ ] Have customer refresh dashboard (hard refresh: Cmd+Shift+R)
