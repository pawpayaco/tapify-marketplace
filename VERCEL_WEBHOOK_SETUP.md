# Adding Webhook Secret to Vercel

## The Problem

Your Shopify webhook is configured to send to:
```
https://tapify-marketplace.vercel.app/api/shopify-webhook
```

This is your **production Vercel deployment**, but the `SHOPIFY_WEBHOOK_SECRET` is only in your local `.env.local` file. Production Vercel doesn't have access to it, so HMAC verification fails.

## The Solution

Add the webhook secret to Vercel's environment variables.

### Step 1: Go to Vercel Dashboard

1. Open https://vercel.com/dashboard
2. Find your project: **tapify-marketplace**
3. Click on it

### Step 2: Add Environment Variable

1. Click **Settings** tab
2. Click **Environment Variables** in left sidebar
3. Click **Add New** button
4. Fill in:
   - **Key**: `SHOPIFY_WEBHOOK_SECRET`
   - **Value**: `e649af7f3ce7cd3715d513da7aca05485ef9fe39aac728be2ab1a9eb88c70145`
   - **Environments**: Check all three (Production, Preview, Development)
5. Click **Save**

### Step 3: Redeploy

**Option A - Automatic (Recommended)**:
- Vercel will automatically redeploy when you commit/push changes
- Or just make any small change to trigger a redeploy

**Option B - Manual**:
1. Go to **Deployments** tab in Vercel
2. Find latest deployment
3. Click three dots (•••)
4. Click **Redeploy**

### Step 4: Test

1. Go to Shopify and make a test purchase with "Priority Display Upgrade"
2. Use the SAME email as a retailer in your database
3. Wait 10-30 seconds
4. Check database:
   ```sql
   SELECT id, name, email, priority_display_active
   FROM retailers
   WHERE email = 'your-test-email@example.com';
   ```
5. Should now show `priority_display_active = true`

## Verification

### Check if Secret is Added
1. Go to Vercel → Settings → Environment Variables
2. Look for `SHOPIFY_WEBHOOK_SECRET`
3. Should show "Hidden" (encrypted value)

### Check Webhook Logs in Shopify
1. Shopify Admin → Settings → Notifications → Webhooks
2. Click on your webhook
3. View "Recent deliveries"
4. Should see:
   - ✅ **200 OK** = Working!
   - ❌ **401 Unauthorized** = Secret still not in Vercel (or wrong)
   - ❌ **500 Error** = Application error (check logs)

## Important Notes

- `.env.local` is for LOCAL development only (npm run dev)
- Vercel production doesn't see your local `.env.local` file
- You must add secrets to Vercel's dashboard for production
- After adding secrets, Vercel needs to redeploy to pick them up

## Testing with Local Development

If you want to test webhooks locally:

1. Use ngrok to expose localhost:
   ```bash
   ngrok http 3000
   ```

2. Update Shopify webhook URL to ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/shopify-webhook
   ```

3. The local `.env.local` will be used
4. Remember to change webhook back to production URL after testing!

## Alternative: Check Vercel Logs

You can check if the webhook is reaching Vercel and what error it's getting:

1. Vercel Dashboard → Your Project
2. Click **Logs** tab
3. Filter by `/api/shopify-webhook`
4. Look for:
   - `[shopify-webhook] Invalid HMAC signature` = Secret not set or wrong
   - `[shopify-webhook] ✅ Webhook processed successfully` = Working!
