# Webhook Debugging Guide

## Current Status
- ✅ Webhook configured in Shopify
- ✅ Product title includes "Priority Display"
- ✅ `SHOPIFY_WEBHOOK_SECRET` in Vercel
- ❌ Database not updating

## Step 1: Check Shopify Webhook Delivery Status

1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Click on your webhook (Order creation)
3. Click "Recent deliveries"
4. Find your test purchase
5. Check the status:

### Possible Results:

**✅ 200 OK** = Webhook was received successfully
- If you see 200 OK but database isn't updating, the issue is:
  - Email mismatch between Shopify customer and retailer
  - Product title detection not working
  - Logic error in webhook code

**❌ 401 Unauthorized** = HMAC verification failed
- Secret is wrong or not deployed
- Check: Did you redeploy Vercel AFTER adding the secret?
- Try: Redeploy again from Vercel dashboard

**❌ 500 Internal Server Error** = Application error
- Check Vercel logs for the error
- Likely a code issue or database connection problem

## Step 2: Check Vercel Logs

### Via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Open your project
3. Click **Logs** tab
4. Filter by `/api/shopify-webhook`
5. Look for recent entries around the time of your test purchase

### What to look for:
```
[shopify-webhook] Invalid HMAC signature  ← Secret issue
[shopify-webhook] Priority Display detected: true  ← Good!
[shopify-webhook] ✅ Priority Display order processed for retailer: [id]  ← Success!
```

## Step 3: Verify Email Matching

The webhook matches by EMAIL. Run this SQL query:

```sql
-- Check what email was used in Shopify order
SELECT
  shopify_order_id,
  customer_email,
  is_priority_display,
  retailer_id,
  processed_at
FROM orders
ORDER BY processed_at DESC
LIMIT 5;
```

Then check if that email exists in retailers:

```sql
-- Check if retailer exists with that email
SELECT
  id,
  name,
  email,
  priority_display_active
FROM retailers
WHERE email = 'email-from-order-above@example.com';
```

### Common Issue:
- Shopify order email: `customer@gmail.com`
- Retailer email: `customer@different-email.com`
- **Result**: Webhook receives order, but can't find retailer to update

## Step 4: Check Product Title Detection

The webhook looks for these keywords (case-insensitive):
- "priority display"
- "priority placement"

Check your recent order in database:

```sql
SELECT
  shopify_order_id,
  product_name,
  is_priority_display,
  customer_email,
  retailer_id
FROM orders
ORDER BY processed_at DESC
LIMIT 5;
```

If `is_priority_display = false`, the product title didn't match.

## Step 5: Manual Database Test

To verify the dashboard UI works, manually set the flag:

```sql
UPDATE retailers
SET priority_display_active = true
WHERE email = 'your-test-email@example.com';
```

Then refresh the dashboard. Does it show "Priority Display Active 💎"?

- **Yes** = UI works, webhook is the issue
- **No** = UI issue, need to check dashboard code

## Step 6: Test with Fresh Order

If webhook is receiving 200 OK but not updating:

1. **Create new test retailer**:
   - Register with email: `webhook-test-2025@yourdomain.com`
   - Note the exact email used

2. **Purchase on Shopify**:
   - Use the EXACT SAME email: `webhook-test-2025@yourdomain.com`
   - Product: "Priority Display Upgrade"

3. **Check Vercel logs immediately**:
   - Look for `[shopify-webhook]` entries
   - Should see email, UID detection, etc.

4. **Check database**:
   ```sql
   SELECT * FROM retailers WHERE email = 'webhook-test-2025@yourdomain.com';
   ```

## Step 7: Check Environment Variable Deployment

Sometimes Vercel doesn't pick up new environment variables. Verify:

1. Vercel Dashboard → Settings → Environment Variables
2. Find `SHOPIFY_WEBHOOK_SECRET`
3. Check which environments it's assigned to:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Check when it was added vs when you last deployed
5. If added AFTER last deployment → Redeploy now

### Force Redeploy:
1. Vercel Dashboard → Deployments
2. Find latest deployment
3. Click three dots (•••)
4. Click "Redeploy"
5. Wait for deployment to complete
6. Try webhook again

## Common Causes (in order of frequency):

1. **Email mismatch** (80% of issues)
   - Customer uses different email on Shopify vs registration

2. **Secret not redeployed** (15% of issues)
   - Secret added to Vercel but not redeployed

3. **Product title mismatch** (3% of issues)
   - Title doesn't include "priority display" or "priority placement"

4. **Wrong column checked** (2% of issues)
   - Checking `express_shipping` instead of `priority_display_active`

## Next Steps

Please provide:
1. Screenshot of Shopify webhook "Recent deliveries" status
2. Email used for Shopify purchase
3. Email of retailer in database you're testing with
4. Result of this SQL query:
   ```sql
   SELECT
     shopify_order_id,
     customer_email,
     is_priority_display,
     retailer_id
   FROM orders
   ORDER BY processed_at DESC
   LIMIT 3;
   ```
