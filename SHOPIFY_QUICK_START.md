# ⚡ SHOPIFY INTEGRATION - QUICK START GUIDE

> **TL;DR:** Fix the Shopify ↔ Next.js ↔ Supabase integration so orders sync correctly and retailer attribution works.

---

## 🎯 THE PROBLEM

Right now, when a customer:
1. Taps an NFC display in a retail store → Redirects to Shopify ✅
2. Buys something on Shopify → Order completes ✅
3. **Shopify should send order to Next.js API** → ❌ BROKEN or MISSING
4. **Next.js should log order in Supabase** → ❌ NOT HAPPENING
5. **Payout job should be created** → ❌ NO PAYOUTS

**Result:** Retailers can't get paid, system is useless.

---

## 🔥 YOUR MISSION (PRIORITY ORDER)

### Phase 1: Make It Work (CRITICAL - Do This First)

#### Task 1: Implement Webhook Handler
**File:** `pages/api/shopify-webhook.js`

**Status:** Verify if exists, likely broken or incomplete

**Requirements:**
```javascript
✅ HMAC signature validation
✅ Extract order data from webhook payload
✅ Extract ref attribute (retailer UID)
✅ Lookup retailer from uids table
✅ Insert into orders table
✅ Create payout_job record
✅ Update scans table (analytics)
✅ Return 200 OK always
```

**Use the implementation from `SHOPIFY_AI_BRIEF.md` Integration Point 2**

---

#### Task 2: Fix Attribution Capture
**File:** Shopify theme (theme.liquid or relevant template)

**Status:** Likely broken - ref parameter not being captured

**Requirements:**
```javascript
✅ Detect ?ref=UID parameter from URL
✅ Store in cart attributes via /cart/update.js
✅ Persist through checkout
✅ Appear in webhook as note_attributes.ref
```

**Implementation:**
Add this to Shopify theme (before `</body>` tag):

```html
{% if request.GET.ref %}
<script>
(function() {
  const ref = '{{ request.GET.ref }}';
  fetch('/cart/update.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attributes: { 'ref': ref } })
  });
})();
</script>
{% endif %}
```

---

#### Task 3: Configure Shopify Webhook
**Location:** Shopify Admin → Settings → Notifications → Webhooks

**Create webhook:**
- Event: `orders/create`
- Format: `JSON`
- URL: `https://tapify.co/api/shopify-webhook` (or your production URL)
- API Version: `2024-01`

**Get webhook secret:**
- Copy the webhook signing secret
- Add to Next.js `.env.local` as `SHOPIFY_WEBHOOK_SECRET`

---

### Phase 2: Test Everything

#### Test 1: Attribution Flow
```bash
# 1. Add test UID to Supabase
INSERT INTO uids (uid, is_claimed, affiliate_url)
VALUES ('TEST999', true, 'https://pawpayaco.com/collections/all?ref=TEST999');

# 2. Visit NFC redirect
curl -i http://localhost:3000/t?u=TEST999

# Expected: 302 redirect to Shopify with ?ref=TEST999
```

#### Test 2: Attribution Capture
```
1. Visit Shopify URL: pawpayaco.com/collections/all?ref=TEST999
2. Open browser console
3. Add item to cart
4. Visit /cart.json in browser
5. Verify: "attributes": { "ref": "TEST999" }
```

#### Test 3: Webhook Flow (Local)
```bash
# 1. Start Next.js dev server
npm run dev

# 2. Start ngrok
ngrok http 3000

# 3. Update Shopify webhook URL to ngrok URL
# https://abc123.ngrok.io/api/shopify-webhook

# 4. Trigger test webhook
shopify webhook trigger orders/create --address https://abc123.ngrok.io/api/shopify-webhook

# 5. Check Supabase for new order
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

#### Test 4: End-to-End (Production-like)
```
1. Create real test UID in Supabase
2. Tap NFC tag (or visit /t?u=UID on phone)
3. Add product to cart on Shopify
4. Complete checkout (use Shopify test mode)
5. Verify in Supabase:
   - orders table has new row
   - payout_jobs table has new row
   - scans table shows converted = true
```

---

### Phase 3: Optimize & Harden

#### Security Hardening
- [ ] HMAC validation uses `crypto.timingSafeEqual()`
- [ ] Webhook secret in env vars (not hardcoded)
- [ ] API route catches all errors (no crashes)
- [ ] Returns 200 OK even if business logic fails

#### Performance
- [ ] Webhook responds in <1 second
- [ ] Shopify theme loads in <2 seconds on mobile
- [ ] Images optimized (<200KB each)
- [ ] JavaScript minified

#### Error Handling
- [ ] Add error logging (console.error at minimum)
- [ ] Log failed HMAC validations
- [ ] Log missing ref attributes
- [ ] Log database insert failures

#### Database
- [ ] Add unique constraint on `orders.shopify_order_id`
- [ ] Use upsert logic to prevent duplicate orders
- [ ] Test duplicate webhook scenario

---

## 📋 VERIFICATION CHECKLIST

**Before calling this "done":**

- [ ] Customer can tap NFC, land on Shopify with ref parameter
- [ ] Ref parameter is captured in cart attributes
- [ ] Checkout completes successfully
- [ ] Webhook fires to Next.js API
- [ ] HMAC validates successfully
- [ ] Order inserts into Supabase orders table
- [ ] Payout job created with retailer_id + commission splits
- [ ] Scans table updated (converted = true)
- [ ] All above works on mobile device
- [ ] All above works in production environment

---

## 🚨 CRITICAL FILES TO MODIFY

```
Your Shopify Repo:
├── theme.liquid                    # Add attribution JS here
├── (or relevant collection/product template)

Next.js Repo (tapify-marketplace):
├── pages/api/shopify-webhook.js    # CREATE OR FIX THIS
├── .env.local                      # Add SHOPIFY_WEBHOOK_SECRET
└── lib/supabase.js                 # Should already exist
```

---

## 🧪 TESTING COMMANDS CHEATSHEET

```bash
# Start dev environment
npm run dev

# Expose local server to internet (for webhook testing)
ngrok http 3000

# Trigger test webhook
shopify webhook trigger orders/create --address https://YOUR-NGROK-URL/api/shopify-webhook

# Check Supabase orders
# (Use Supabase dashboard or SQL editor)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

# Check Supabase payout jobs
SELECT * FROM payout_jobs ORDER BY created_at DESC LIMIT 5;

# Check attribution tracking
SELECT * FROM scans WHERE converted = true ORDER BY timestamp DESC LIMIT 5;
```

---

## 🆘 TROUBLESHOOTING

### Webhook returns 401 Unauthorized
**Cause:** HMAC validation failing

**Fix:**
1. Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify admin
2. Ensure you're using `JSON.stringify(req.body)` not raw body string
3. Check encoding is `utf8`

### Order inserted but no payout job
**Cause:** retailer_id is null

**Fix:**
1. Check if ref parameter exists in webhook payload
2. Verify UID exists in uids table
3. Check if UID is claimed (is_claimed = true)

### Attribution not captured
**Cause:** JavaScript not running in Shopify theme

**Fix:**
1. Verify script is in theme.liquid before `</body>`
2. Check browser console for errors
3. Test with `?ref=TEST` in URL manually

### Webhook not firing
**Cause:** Webhook not configured in Shopify

**Fix:**
1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Verify webhook exists for `orders/create`
3. Check "Recent deliveries" for error messages

---

## 📚 WHERE TO FIND ANSWERS

| Question | Document |
|----------|----------|
| How does the business work? | `context/GAME_PLAN_2.0.md` |
| What's the full integration architecture? | `SHOPIFY_AI_BRIEF.md` |
| What's the database schema? | `context/supabase/tables_and_columns.md` |
| How do transaction flows work? | `context/shopify/flows.md` |
| What are all the API routes? | `context/nextjs/pages_api_summary.md` |
| How does Shopify connect to Next.js? | `context/shopify/integration_points.md` |
| What do webhook payloads look like? | `context/shopify/webhooks.md` |

---

## ✅ DONE CRITERIA

**You're done when:**

1. Place a real test order on Shopify (using test payment)
2. Order appears in Supabase `orders` table within 5 seconds
3. Payout job appears in `payout_jobs` table
4. `retailer_id` is correctly populated (not null)
5. Commission amounts are correct (20% retailer, 80% vendor)
6. Can repeat this 5 times without errors

**Then:**
- Document any issues you found
- Document any fixes you made
- Note any optimizations for Phase 2 (multi-vendor)

---

## 🎯 SUCCESS = MONEY FLOWING

When this works:
- Retailers tap NFC displays to activate them
- Customers buy products
- Money automatically splits between retailer + Pawpaya
- Everyone gets paid via Dwolla
- **The entire Tapify business model works**

**No pressure, but this is the revenue engine. Make it bulletproof.**

---

*Quick Start Version: 1.0*
*Companion to: SHOPIFY_AI_BRIEF.md*
