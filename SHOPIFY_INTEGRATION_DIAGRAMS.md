# 🔄 SHOPIFY INTEGRATION - VISUAL WORKFLOWS & SCENARIOS

> **Purpose:** Visual diagrams and scenario walkthroughs to understand the complete integration

---

## 📊 COMPLETE SYSTEM DIAGRAM

```
╔═══════════════════════════════════════════════════════════════════════╗
║                       TAPIFY ECOSYSTEM                                ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────┐
│  Retail Store   │
│  (Pet Supplies  │
│   Plus, etc.)   │
└────────┬────────┘
         │
         │ 1. Displays Tapify product stand
         │    with NFC tag/QR code
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PHYSICAL DISPLAY                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  [Product Sample: Pawpaya Friendship Collar]                 │  │
│  │                                                               │  │
│  │  📱 Tap here or scan QR code to shop                         │  │
│  │  [NFC Chip: UID = "ABC123"]                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 2. Customer taps phone on NFC tag
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER PHONE                                 │
│  Browser loads: https://tapify.co/t?u=ABC123                       │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ 3. Next.js API handles redirect
         ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                       NEXT.JS API LAYER                               ║
║  File: pages/api/uid-redirect.js                                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  const { data: uid } = await supabase                                ║
║    .from('uids')                                                     ║
║    .select('is_claimed, affiliate_url, retailer_id')                ║
║    .eq('uid', 'ABC123')                                              ║
║    .single();                                                        ║
║                                                                       ║
║  if (!uid.is_claimed) {                                              ║
║    return redirect('/claim?u=ABC123');  // Retailer setup            ║
║  }                                                                    ║
║                                                                       ║
║  return redirect(uid.affiliate_url);                                 ║
║  // https://pawpayaco.com/collections/collars?ref=ABC123             ║
╚═══════════════════════════════════════════════════════════════════════╝
         │
         │ 4. Redirect to Shopify with ref parameter
         ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                       SHOPIFY STOREFRONT                              ║
║  URL: pawpayaco.com/collections/collars?ref=ABC123                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  📜 theme.liquid captures ref parameter:                             ║
║                                                                       ║
║  <script>                                                             ║
║    fetch('/cart/update.js', {                                        ║
║      method: 'POST',                                                 ║
║      body: JSON.stringify({                                          ║
║        attributes: { 'ref': 'ABC123' }                               ║
║      })                                                              ║
║    });                                                               ║
║  </script>                                                            ║
║                                                                       ║
║  ✅ Attribution stored in cart                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
         │
         │ 5. Customer browses, adds to cart, checks out
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SHOPIFY CHECKOUT                               │
│  Customer completes payment                                         │
│  Order #1001 created                                                │
│  Total: $59.99                                                      │
│  note_attributes: { "ref": "ABC123" }  ← Critical for attribution   │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ 6. Shopify fires orders/create webhook
         │    POST https://tapify.co/api/shopify-webhook
         ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                    WEBHOOK HANDLER                                    ║
║  File: pages/api/shopify-webhook.js                                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  1️⃣ VALIDATE HMAC (security)                                         ║
║     const hmac = req.headers['x-shopify-hmac-sha256'];               ║
║     if (!validHmac) return 401;                                      ║
║                                                                       ║
║  2️⃣ EXTRACT DATA                                                      ║
║     const ref = order.note_attributes.find(a => a.name === 'ref');   ║
║     → ref.value = "ABC123"                                           ║
║                                                                       ║
║  3️⃣ LOOKUP RETAILER                                                   ║
║     SELECT retailer_id FROM uids WHERE uid = 'ABC123'                ║
║     → retailer_id = "retailer-uuid-456"                              ║
║                                                                       ║
║  4️⃣ INSERT ORDER                                                      ║
║     INSERT INTO orders (shopify_order_id, total, retailer_id, ...)   ║
║                                                                       ║
║  5️⃣ CREATE PAYOUT JOB                                                 ║
║     INSERT INTO payout_jobs (                                        ║
║       retailer_cut: $59.99 * 0.20 = $11.99,                          ║
║       vendor_cut: $59.99 * 0.80 = $47.99                             ║
║     )                                                                 ║
║                                                                       ║
║  6️⃣ UPDATE ANALYTICS                                                  ║
║     UPDATE scans SET converted = true, revenue = 59.99               ║
║     WHERE uid = 'ABC123'                                             ║
║                                                                       ║
║  7️⃣ RETURN 200 OK                                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
         │
         │ 7. Data synced to database
         ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                       SUPABASE DATABASE                               ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  📊 orders table:                                                     ║
║  ┌────────────────────────────────────────────────────────────────┐ ║
║  │ id: order-uuid-789                                             │ ║
║  │ shopify_order_id: "123456789"                                  │ ║
║  │ customer_email: "customer@example.com"                         │ ║
║  │ total: 59.99                                                   │ ║
║  │ retailer_id: "retailer-uuid-456"  ← Linked to Pet Supplies+   │ ║
║  │ vendor_id: "pawpaya-vendor-id"                                 │ ║
║  └────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  💰 payout_jobs table:                                                ║
║  ┌────────────────────────────────────────────────────────────────┐ ║
║  │ order_id: "order-uuid-789"                                     │ ║
║  │ retailer_id: "retailer-uuid-456"                               │ ║
║  │ retailer_cut: 11.99  ← Pet Supplies Plus earns this           │ ║
║  │ vendor_cut: 47.99    ← Pawpaya earns this                      │ ║
║  │ status: "pending"                                              │ ║
║  └────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  📈 scans table (analytics):                                          ║
║  ┌────────────────────────────────────────────────────────────────┐ ║
║  │ uid: "ABC123"                                                  │ ║
║  │ clicked: true                                                  │ ║
║  │ converted: true  ← Customer completed purchase!                │ ║
║  │ revenue: 59.99                                                 │ ║
║  └────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════╝
         │
         │ 8. Admin approves payout (manual for now)
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD                                │
│  URL: tapify.co/admin                                               │
│  Views pending payout: $11.99 to retailer, $47.99 to Pawpaya       │
│  Clicks "Process Payout"                                            │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ 9. Dwolla ACH transfers
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BANK ACCOUNTS                                  │
│  Retailer receives: $11.99 (2-3 business days)                     │
│  Pawpaya receives: $47.99                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 SCENARIO WALKTHROUGHS

### Scenario 1: Happy Path (Everything Works)

```
STEP | SYSTEM        | ACTION                                | RESULT
-----|---------------|---------------------------------------|------------------
1    | Customer      | Taps NFC tag                         | Phone loads tapify.co/t?u=ABC123
2    | Next.js       | Queries uids table                   | UID is claimed → redirect to Shopify
3    | Shopify       | Page loads with ?ref=ABC123          | JavaScript captures ref in cart
4    | Customer      | Adds product, checks out             | Order created with note_attributes.ref
5    | Shopify       | Fires webhook                        | POST to /api/shopify-webhook
6    | Next.js       | Validates HMAC                       | ✅ Valid signature
7    | Next.js       | Extracts ref="ABC123"                | ✅ Found in note_attributes
8    | Next.js       | Looks up retailer                    | ✅ Found retailer_id
9    | Next.js       | Inserts order                        | ✅ Row created in orders table
10   | Next.js       | Creates payout job                   | ✅ Row created in payout_jobs
11   | Next.js       | Returns 200 OK                       | ✅ Webhook successful
12   | Admin         | Reviews pending payout               | ✅ Sees $11.99 to retailer
13   | Admin         | Approves payout                      | ✅ Dwolla transfers money
```

---

### Scenario 2: Unclaimed UID (First-Time Retailer Setup)

```
STEP | SYSTEM        | ACTION                                | RESULT
-----|---------------|---------------------------------------|------------------
1    | Retailer      | Receives Tapify display in mail      | Display has UID sticker
2    | Retailer      | Taps NFC tag for first time          | Phone loads tapify.co/t?u=NEW123
3    | Next.js       | Queries uids table                   | is_claimed = false
4    | Next.js       | Redirects to claim page              | tapify.co/claim?u=NEW123
5    | Retailer      | Fills registration form              | Store name, address, contact
6    | Next.js       | Creates retailer record              | INSERT INTO retailers
7    | Next.js       | Updates UID record                   | SET is_claimed = true, retailer_id = ...
8    | Next.js       | Generates affiliate URL              | pawpayaco.com/collections/all?ref=NEW123
9    | Retailer      | Redirected to dashboard              | Setup complete message
10   | Future        | Customer taps same UID               | Now goes directly to Shopify
```

---

### Scenario 3: Missing Attribution (BROKEN - Needs Fix)

```
STEP | SYSTEM        | ACTION                                | RESULT
-----|---------------|---------------------------------------|------------------
1    | Customer      | Taps NFC tag                         | Redirects to Shopify with ?ref=ABC123
2    | Shopify       | Page loads                           | ❌ JavaScript not capturing ref
3    | Customer      | Adds to cart                         | Cart attributes = {}  (empty!)
4    | Customer      | Checks out                           | Order created WITHOUT ref
5    | Shopify       | Fires webhook                        | POST to /api/shopify-webhook
6    | Next.js       | Looks for ref in note_attributes     | ❌ Not found!
7    | Next.js       | retailer_id = null                   | ❌ Can't link to retailer
8    | Next.js       | Inserts order                        | ✅ Order saved but no retailer_id
9    | Next.js       | Skips payout job creation            | ❌ No payout = broken business model
10   | Admin         | Views orders                         | ❌ Order exists but no commission
11   | Retailer      | Never gets paid                      | ❌ BUSINESS FAILURE
```

**FIX:** Add attribution JavaScript to Shopify theme (see Quick Start guide)

---

### Scenario 4: Webhook HMAC Failure (Security Issue)

```
STEP | SYSTEM        | ACTION                                | RESULT
-----|---------------|---------------------------------------|------------------
1    | Attacker      | Sends fake webhook                   | POST to /api/shopify-webhook
2    | Attacker      | Fake order data                      | total: $999999.99
3    | Next.js       | Validates HMAC signature             | ❌ INVALID (attacker doesn't have secret)
4    | Next.js       | Returns 401 Unauthorized             | ✅ Request blocked
5    | Attacker      | Tries again                          | ❌ Still fails
6    | Database      | No fake order inserted               | ✅ System protected
```

**WHY THIS MATTERS:** Without HMAC validation, attackers could create fake payout jobs.

---

### Scenario 5: Duplicate Webhook (Shopify Retry)

```
STEP | SYSTEM        | ACTION                                | RESULT
-----|---------------|---------------------------------------|------------------
1    | Shopify       | Fires webhook (order #1001)          | POST to /api/shopify-webhook
2    | Next.js       | Processes successfully               | Order inserted, returns 200 OK
3    | Network       | Response lost (timeout)              | Shopify doesn't receive 200
4    | Shopify       | Retries same webhook                 | POST same payload again
5    | Next.js       | Tries to insert order #1001          | ❌ Duplicate key error (if constraint exists)
6    | Next.js       | Uses UPSERT logic                    | ✅ Updates existing row instead
7    | Next.js       | Returns 200 OK                       | ✅ No duplicate payout job
```

**FIX:** Add unique constraint on `orders.shopify_order_id`, use upsert logic

---

## 🛠️ DEBUGGING FLOWCHARTS

### Debugging: Order Not Syncing to Supabase

```
START: Customer completed checkout but order not in database

    ↓

Is webhook configured in Shopify?
    ├─ NO → Configure webhook in Shopify Admin
    │       Settings → Notifications → Webhooks → Create webhook
    │       Event: orders/create
    │       URL: https://tapify.co/api/shopify-webhook
    │
    └─ YES → Continue

    ↓

Check Shopify webhook delivery logs
(Shopify Admin → Webhooks → Recent deliveries)

    ↓

What's the response code?
    ├─ 401 Unauthorized
    │   → HMAC validation failing
    │   → Check SHOPIFY_WEBHOOK_SECRET matches Shopify admin
    │   → Verify crypto.timingSafeEqual() usage
    │
    ├─ 404 Not Found
    │   → Webhook endpoint doesn't exist
    │   → Create pages/api/shopify-webhook.js
    │
    ├─ 500 Internal Server Error
    │   → Check Next.js server logs
    │   → Likely database connection issue or query error
    │   → Verify Supabase credentials
    │
    └─ 200 OK but order still not in database
        → Webhook processed but business logic failed
        → Check Next.js console logs
        → Verify database insert query
        → Check if retailer_id lookup failed
```

---

### Debugging: Attribution Not Working

```
START: Orders syncing but retailer_id is always null

    ↓

Visit Shopify with test ref:
pawpayaco.com/collections/all?ref=TEST123

    ↓

Open browser console (F12)

    ↓

Do you see "Retailer attribution captured: TEST123" log?
    ├─ NO → Attribution JavaScript not running
    │   ├─ Is script in theme.liquid?
    │   ├─ Is it before </body> tag?
    │   ├─ Check for JavaScript errors in console
    │   └─ Verify ?ref parameter is in URL
    │
    └─ YES → Continue

    ↓

Add item to cart, then visit:
pawpayaco.com/cart.json

    ↓

Check response JSON for "attributes"

    ↓

Is "ref": "TEST123" in attributes?
    ├─ NO → Cart update failed
    │   ├─ Check network tab for /cart/update.js request
    │   ├─ Verify response is 200 OK
    │   └─ Check if Shopify theme has conflicting JavaScript
    │
    └─ YES → Continue

    ↓

Complete test checkout

    ↓

Check webhook payload in Next.js logs

    ↓

Does note_attributes contain ref?
    ├─ NO → Shopify checkout not passing cart attributes
    │   → This is a Shopify configuration issue
    │   → Check checkout settings
    │
    └─ YES → ref is captured correctly!

        ↓

        Check if UID exists in database:
        SELECT * FROM uids WHERE uid = 'TEST123'

        ↓

        Does UID exist and is_claimed = true?
        ├─ NO → Create test UID in database
        │
        └─ YES → Attribution should work now
```

---

## 📦 DATA STRUCTURE REFERENCE

### Supabase Tables Involved in Integration

**⚠️ OCTOBER 2025 MIGRATION NOTE:**
- `retailers.created_by_user_id` and `recruited_by_sourcer_id` added
- Phone/email consolidated from `retailer_owners` → `retailers`
- `retailer_owners` table DEPRECATED (still exists, don't use)

```sql
-- UIDs: NFC tag identifiers (UPDATED SCHEMA)
┌───────────────────────────────────────────────────────────────┐
│ uids                                                          │
├───────────────────────────────────────────────────────────────┤
│ uid                  TEXT PRIMARY KEY     "ABC123"            │
│ is_claimed           BOOLEAN              true                │
│ claimed_at           TIMESTAMPTZ          "2025-01-15..."     │
│ claimed_by_user_id   UUID                 "user-123"          │
│ retailer_id          UUID → retailers     "retailer-456"      │
│ business_id          UUID → businesses    "psp-franchise"     │
│ affiliate_url        TEXT                 "pawpayaco.com/..." │
│ scan_count           INTEGER              42                  │
│ last_scan_at         TIMESTAMPTZ          "2025-01-15..."     │
│ last_order_at        TIMESTAMPTZ          "2025-01-14..."     │
│ last_order_total     NUMERIC              59.99               │
└───────────────────────────────────────────────────────────────┘
                                            │
                                            │ Foreign Key
                                            ▼
-- Retailers: Store information (UPDATED SCHEMA)
┌───────────────────────────────────────────────────────────────┐
│ retailers                                                     │
├───────────────────────────────────────────────────────────────┤
│ id                   UUID PRIMARY KEY     "retailer-456"      │
│ name                 TEXT                 "Pet Supplies Plus" │
│ address              TEXT                 "123 Main St..."    │
│ email                TEXT                 "store@example.com" │
│ phone                TEXT                 "+15125551234"      │
│ owner_name           TEXT                 "John Smith"        │
│ manager_name         TEXT                 "Jane Doe"          │
│ business_id          UUID → businesses    "psp-franchise"     │
│ converted            BOOLEAN              true                │
│ created_by_user_id   UUID → auth.users    "user-123" ⭐ NEW  │
│ recruited_by_        UUID → sourcers      null ⭐ Phase 2     │
│   sourcer_id                                                  │
│ created_at           TIMESTAMPTZ          "2025-01-10..."     │
└───────────────────────────────────────────────────────────────┘
                                            │
                                            │ Referenced by
                                            ▼
-- Orders: Shopify order data (FULL SCHEMA)
┌───────────────────────────────────────────────────────────────┐
│ orders                                                        │
├───────────────────────────────────────────────────────────────┤
│ id                   UUID PRIMARY KEY     "order-789"         │
│ shopify_order_id     TEXT                 "123456789"         │
│ shopify_order_number TEXT                 "1001"              │
│ shop_domain          TEXT                 "pawpayaco...."     │
│ customer_email       TEXT                 "cust@example.com"  │
│ customer_name        TEXT                 "John Doe"          │
│ total                NUMERIC              59.99               │
│ subtotal             NUMERIC              54.99               │
│ tax_total            NUMERIC              5.00                │
│ discount_total       NUMERIC              0.00                │
│ financial_status     TEXT                 "paid"              │
│ fulfillment_status   TEXT                 "unfulfilled"       │
│ retailer_id          UUID → retailers     "retailer-456"      │
│ vendor_id            UUID → vendors       "pawpaya-vendor"    │
│ business_id          UUID → businesses    "psp-franchise"     │
│ source_uid           TEXT                 "ABC123"            │
│ line_items           JSONB                [{...}, {...}]      │
│ raw_payload          JSONB                {full webhook}      │
│ created_at           TIMESTAMPTZ          "2025-01-15..."     │
└───────────────────────────────────────────────────────────────┘
                                            │
                                            │ Referenced by
                                            ▼
-- Payout Jobs: Commission tracking (FULL SCHEMA)
┌───────────────────────────────────────────────────────────────┐
│ payout_jobs                                                   │
├───────────────────────────────────────────────────────────────┤
│ id                UUID PRIMARY KEY     "payout-999"           │
│ order_id          UUID → orders        "order-789"            │
│ retailer_id       UUID → retailers     "retailer-456"         │
│ vendor_id         UUID → vendors       "pawpaya-vendor"       │
│ sourcer_id        UUID → sourcers      null ⭐ Phase 2        │
│ total_amount      NUMERIC              59.99                  │
│ retailer_cut      NUMERIC              11.99 (20%)            │
│ vendor_cut        NUMERIC              47.99 (80%)            │
│ sourcer_cut       NUMERIC              0.00 (0% Phase 1)      │
│ tapify_cut        NUMERIC              0.00 (0% Phase 1)      │
│ source_uid        TEXT                 "ABC123"               │
│ transfer_ids      JSONB                [] (Dwolla IDs)        │
│ status            TEXT                 "pending"              │
│ date_paid         TIMESTAMPTZ          null                   │
│ created_at        TIMESTAMPTZ          "2025-01-15..."        │
└───────────────────────────────────────────────────────────────┘
```

**⚠️ DEPRECATED COLUMNS (still exist, but DON'T USE):**
- `retailers.location` → use `address`
- `retailers.store_phone` → use `phone`
- `retailers.onboarding_completed` → use `converted`

---

## 🎯 INTEGRATION HEALTH CHECKLIST

### Green Flags (System Healthy) ✅

- [ ] NFC redirect returns 302 to Shopify with ref parameter
- [ ] Cart attributes contain ref after adding product
- [ ] Webhook endpoint returns 200 OK
- [ ] Orders table receives new rows within 5 seconds of checkout
- [ ] Payout jobs created with non-null retailer_id
- [ ] Commission calculations are correct (20%/80%)
- [ ] Scans table shows converted = true
- [ ] No HMAC validation errors in logs
- [ ] No duplicate orders in database

### Red Flags (System Broken) ❌

- [ ] NFC redirect returns 404 or 500
- [ ] Cart attributes empty or missing ref
- [ ] Webhook endpoint returns 401 (HMAC failure)
- [ ] Orders table not updating
- [ ] Payout jobs have null retailer_id
- [ ] Commission amounts wrong
- [ ] Duplicate order rows in database
- [ ] JavaScript errors on Shopify pages

---

## 📞 QUICK REFERENCE

### Critical Environment Variables
```env
SHOPIFY_WEBHOOK_SECRET=shpss_xxxxx
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Critical File Locations
```
pages/api/uid-redirect.js       ← NFC tap handler
pages/api/shopify-webhook.js    ← Order sync (CREATE THIS!)
lib/supabase.js                  ← Database client
.env.local                       ← Secrets (add webhook secret)
```

### Testing URLs
```
Local NFC redirect:  http://localhost:3000/t?u=TEST123
Shopify with ref:    https://pawpayaco.com?ref=TEST123
Cart JSON:           https://pawpayaco.com/cart.json
Webhook deliveries:  Shopify Admin → Settings → Notifications → Webhooks
```

---

*Diagrams Version: 1.0*
*Companion documents: SHOPIFY_AI_BRIEF.md, SHOPIFY_QUICK_START.md*
