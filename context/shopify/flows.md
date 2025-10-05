# Shopify Transaction Flows

## Purpose
Documents the step-by-step sequences for customer transactions, order processing, and payout attribution within Tapify's Shopify integration. Each flow shows the complete journey from physical display interaction to completed payout.

---

## 🛒 Flow 1: Customer Purchase Journey (Phase 1)

### Overview
Complete sequence from NFC tap to order fulfillment in Pawpaya-only mode.

### Participants
- **Customer:** In-store shopper
- **Retailer:** Store hosting Tapify display
- **Shopify:** Commerce platform (pawpayaco.com)
- **Next.js API:** Routing and webhook handler
- **Supabase:** Data warehouse
- **Pawpaya:** Vendor/fulfillment (same as Tapify in Phase 1)

### Step-by-Step Flow

```
┌──────────────────────┐
│  CUSTOMER            │
│  (in store)          │
└──────────┬───────────┘
           │
           │ 1. Taps NFC display
           ▼
┌──────────────────────┐
│  NFC Tag (UID)       │
│  Encoded URL:        │
│  tapify.co/t?u=ABC   │
└──────────┬───────────┘
           │
           │ 2. Phone loads URL
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/uid-redirect       │
│  • Check UID claim status│
│  • Lookup affiliate_url  │
└──────────┬───────────────┘
           │
           │ 3. Query Supabase `uids` table
           ▼
┌──────────────────────────┐
│  Supabase                │
│  SELECT affiliate_url,   │
│    is_claimed,           │
│    retailer_id           │
│  FROM uids               │
│  WHERE uid = 'ABC'       │
└──────────┬───────────────┘
           │
           │ 4. If claimed → return affiliate URL
           │    If unclaimed → redirect to /claim
           ▼
┌──────────────────────────┐
│  HTTP 302 Redirect       │
│  Location:               │
│  pawpayaco.com/          │
│  collections/collars     │
│  ?ref=ABC                │
└──────────┬───────────────┘
           │
           │ 5. Customer lands on Shopify product page
           ▼
┌──────────────────────────┐
│  Shopify Storefront      │
│  • Shows product catalog │
│  • Captures ?ref=ABC     │
│    in session/cookies    │
└──────────┬───────────────┘
           │
           │ 6. Customer adds to cart, proceeds to checkout
           ▼
┌──────────────────────────┐
│  Shopify Checkout        │
│  • Customer enters info  │
│  • Completes payment     │
│  • Order created         │
│  • ref=ABC stored in     │
│    note_attributes       │
└──────────┬───────────────┘
           │
           │ 7. Shopify fires orders/create webhook
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/shopify-webhook    │
│  • Validate HMAC         │
│  • Extract order data    │
│  • Parse note_attributes │
└──────────┬───────────────┘
           │
           │ 8. Insert order + create payout job
           ▼
┌──────────────────────────┐
│  Supabase                │
│  INSERT INTO orders      │
│    (shopify_order_id,    │
│     customer_email,      │
│     total,               │
│     retailer_id)         │
│                          │
│  INSERT INTO payout_jobs │
│    (order_id,            │
│     retailer_cut,        │
│     vendor_cut,          │
│     status: 'pending')   │
└──────────┬───────────────┘
           │
           │ 9. Order fulfillment
           ▼
┌──────────────────────────┐
│  Pawpaya Fulfillment     │
│  • Pack and ship product │
│  • Update Shopify status │
│    to "fulfilled"        │
└──────────┬───────────────┘
           │
           │ 10. Customer receives product
           ▼
┌──────────────────────────┐
│  CUSTOMER                │
│  Order complete ✓        │
└──────────────────────────┘
```

### Data State Changes

**Before Tap:**
```sql
-- uids table
uid: 'ABC', is_claimed: true, retailer_id: 'retailer-123',
affiliate_url: 'pawpayaco.com/collections/collars?ref=ABC'

-- scans table
(no entry)
```

**After Tap (NFC redirect):**
```sql
-- scans table
INSERT: {
  uid: 'ABC',
  retailer_id: 'retailer-123',
  clicked: true,
  converted: false,
  timestamp: '2025-01-15 10:30:00'
}
```

**After Checkout (webhook received):**
```sql
-- orders table
INSERT: {
  shopify_order_id: '123456789',
  customer_email: 'john@example.com',
  total: 59.99,
  retailer_id: 'retailer-123',
  vendor_id: 'pawpaya-id',
  created_at: '2025-01-15 10:35:00'
}

-- payout_jobs table
INSERT: {
  order_id: 'order-uuid',
  retailer_id: 'retailer-123',
  vendor_id: 'pawpaya-id',
  retailer_cut: 11.99,  -- 20% of $59.99
  vendor_cut: 47.99,    -- 80% of $59.99
  tapify_cut: 0.00,     -- 0% in Phase 1
  status: 'pending'
}

-- scans table
UPDATE: {
  converted: true,
  revenue: 59.99
}
WHERE uid = 'ABC' AND converted = false
ORDER BY created_at DESC
LIMIT 1;
```

---

## 💰 Flow 2: Payout Processing (Admin-Triggered)

### Overview
Admin approves pending payout, triggering Dwolla ACH transfers to retailer and vendor bank accounts.

### Participants
- **Admin:** Tapify staff using admin dashboard
- **Supabase:** Data warehouse
- **Dwolla:** ACH payment processor
- **Retailer Bank:** Receiving account
- **Vendor Bank:** Receiving account (Pawpaya in Phase 1)

### Step-by-Step Flow

```
┌──────────────────────────┐
│  Admin Dashboard         │
│  /admin                  │
│  • Views pending payouts │
│  • Clicks "Process Payout│
└──────────┬───────────────┘
           │
           │ 1. POST to /api/payout
           │    { payoutJobId: 'job-uuid' }
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/payout             │
│  • Validate admin auth   │
│  • Fetch payout_job      │
└──────────┬───────────────┘
           │
           │ 2. Query payout details
           ▼
┌──────────────────────────┐
│  Supabase                │
│  SELECT * FROM           │
│    payout_jobs           │
│  WHERE id = 'job-uuid'   │
│                          │
│  Returns:                │
│  • retailer_id           │
│  • vendor_id             │
│  • retailer_cut: $11.99  │
│  • vendor_cut: $47.99    │
└──────────┬───────────────┘
           │
           │ 3. Fetch bank account details
           ▼
┌──────────────────────────┐
│  Supabase                │
│  SELECT                  │
│    dwolla_funding_source │
│  FROM retailer_accounts  │
│  WHERE retailer_id = ... │
│                          │
│  SELECT                  │
│    dwolla_funding_source │
│  FROM vendor_accounts    │
│  WHERE vendor_id = ...   │
└──────────┬───────────────┘
           │
           │ 4. Authenticate with Dwolla
           ▼
┌──────────────────────────┐
│  Dwolla API              │
│  POST /token             │
│  • client_credentials    │
│                          │
│  Returns: access_token   │
└──────────┬───────────────┘
           │
           │ 5. Create transfer to retailer
           ▼
┌──────────────────────────┐
│  Dwolla API              │
│  POST /transfers         │
│  {                       │
│    _links: {             │
│      source: {           │
│        href: "master-    │
│          funding-source" │
│      },                  │
│      destination: {      │
│        href: "retailer-  │
│          funding-source" │
│      }                   │
│    },                    │
│    amount: {             │
│      value: "11.99",     │
│      currency: "USD"     │
│    }                     │
│  }                       │
│                          │
│  Returns: transfer_id    │
└──────────┬───────────────┘
           │
           │ 6. Create transfer to vendor
           ▼
┌──────────────────────────┐
│  Dwolla API              │
│  POST /transfers         │
│  (same structure,        │
│   amount: $47.99)        │
│                          │
│  Returns: transfer_id    │
└──────────┬───────────────┘
           │
           │ 7. Update payout status
           ▼
┌──────────────────────────┐
│  Supabase                │
│  UPDATE payout_jobs      │
│  SET                     │
│    status = 'paid',      │
│    date_paid = NOW(),    │
│    retailer_transfer_id, │
│    vendor_transfer_id    │
│  WHERE id = 'job-uuid'   │
└──────────┬───────────────┘
           │
           │ 8. Dwolla processes ACH (1-3 business days)
           ▼
┌──────────────────────────┐
│  Bank Accounts           │
│  • Retailer receives     │
│    $11.99                │
│  • Vendor receives       │
│    $47.99                │
└──────────────────────────┘
```

### Database State Changes

**Before Payout:**
```sql
-- payout_jobs table
{
  id: 'job-uuid',
  order_id: 'order-uuid',
  retailer_id: 'retailer-123',
  vendor_id: 'pawpaya-id',
  retailer_cut: 11.99,
  vendor_cut: 47.99,
  status: 'pending',
  date_paid: null
}
```

**After Payout:**
```sql
-- payout_jobs table
{
  id: 'job-uuid',
  order_id: 'order-uuid',
  retailer_id: 'retailer-123',
  vendor_id: 'pawpaya-id',
  retailer_cut: 11.99,
  vendor_cut: 47.99,
  status: 'paid',
  date_paid: '2025-01-16 14:00:00',
  retailer_transfer_id: 'dwolla-transfer-123',
  vendor_transfer_id: 'dwolla-transfer-456'
}
```

---

## 🏪 Flow 3: UID Claim (Retailer Onboarding)

### Overview
Retailer receives unclaimed display, taps NFC for first time, registers store to claim the UID.

### Step-by-Step Flow

```
┌──────────────────────────┐
│  Retailer                │
│  • Receives display      │
│  • Taps NFC tag          │
└──────────┬───────────────┘
           │
           │ 1. Phone loads /t?u=NEWUID
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/uid-redirect       │
│  • Query uids table      │
└──────────┬───────────────┘
           │
           │ 2. Check claim status
           ▼
┌──────────────────────────┐
│  Supabase                │
│  SELECT * FROM uids      │
│  WHERE uid = 'NEWUID'    │
│                          │
│  Returns:                │
│  { is_claimed: false }   │
└──────────┬───────────────┘
           │
           │ 3. Redirect to claim page
           ▼
┌──────────────────────────┐
│  HTTP 302 Redirect       │
│  Location:               │
│  tapify.co/claim?u=NEWUID│
└──────────┬───────────────┘
           │
           │ 4. Retailer fills registration form
           ▼
┌──────────────────────────┐
│  Next.js Page            │
│  /claim                  │
│  • Store name            │
│  • Address               │
│  • Contact info          │
│  • Select business       │
│    (Pet Supplies Plus)   │
└──────────┬───────────────┘
           │
           │ 5. Submit form
           │    POST /api/register-store
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/register-store     │
│  • Validate input        │
│  • Create retailer       │
│  • Link UID to retailer  │
└──────────┬───────────────┘
           │
           │ 6. Database updates
           ▼
┌──────────────────────────┐
│  Supabase                │
│  INSERT INTO retailers   │
│    (name, address,       │
│     business_id)         │
│  Returns: retailer_id    │
│                          │
│  UPDATE uids             │
│  SET                     │
│    is_claimed = true,    │
│    retailer_id = ...,    │
│    affiliate_url = ...   │
│  WHERE uid = 'NEWUID'    │
└──────────┬───────────────┘
           │
           │ 7. Redirect to retailer dashboard
           ▼
┌──────────────────────────┐
│  Retailer Dashboard      │
│  /onboard/dashboard      │
│  • Welcome message       │
│  • UID now active        │
│  • Setup bank account    │
└──────────────────────────┘
```

### Data State Changes

**Before Claim:**
```sql
-- uids table
{
  uid: 'NEWUID',
  is_claimed: false,
  retailer_id: null,
  business_id: null,
  affiliate_url: null
}

-- retailers table
(no entry for this store)
```

**After Claim:**
```sql
-- retailers table
INSERT: {
  id: 'retailer-456',
  name: 'Pet Supplies Plus - Austin',
  address: '123 Main St, Austin TX',
  business_id: 'psp-franchise',
  status: 'active'
}

-- uids table
UPDATE: {
  uid: 'NEWUID',
  is_claimed: true,
  retailer_id: 'retailer-456',
  business_id: 'psp-franchise',
  affiliate_url: 'pawpayaco.com/collections/collars?ref=NEWUID'
}
```

---

## 🛍️ Flow 4: Multi-Vendor Order (Phase 2)

### Overview
Customer purchases items from multiple vendors in single cart, requiring per-item attribution.

### Key Differences from Phase 1
- Line item properties include `_vendor_id` per product
- Payout jobs created per vendor per order
- 4-party splits: Vendor + Retailer + Sourcing Agent + Tapify

### Step-by-Step Flow

```
┌──────────────────────────┐
│  Customer                │
│  • Taps display at store │
│  • Lands on multi-vendor │
│    collection page       │
└──────────┬───────────────┘
           │
           │ 1. Adds items from 2 vendors to cart
           ▼
┌──────────────────────────────────────┐
│  Shopify Cart                        │
│  Line Items:                         │
│  • Vendor A: Dog Collar ($30)        │
│    properties: {                     │
│      _vendor_id: 'vendor-a',         │
│      _retailer_uid: 'ABC'            │
│    }                                 │
│  • Vendor B: Pet Tag ($15)           │
│    properties: {                     │
│      _vendor_id: 'vendor-b',         │
│      _retailer_uid: 'ABC'            │
│    }                                 │
└──────────┬───────────────────────────┘
           │
           │ 2. Checkout complete
           ▼
┌──────────────────────────┐
│  Shopify Webhook         │
│  orders/create           │
│  • total: $45            │
│  • line_items: [2]       │
│  • each has properties   │
└──────────┬───────────────┘
           │
           │ 3. Parse line items for attribution
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/shopify-webhook    │
│  • Extract vendor_id     │
│    from each line item   │
│  • Create separate       │
│    payout_jobs per vendor│
└──────────┬───────────────┘
           │
           │ 4. Insert order + multiple payout jobs
           ▼
┌────────────────────────────────────────┐
│  Supabase                              │
│  INSERT INTO orders (total: $45, ...)  │
│                                        │
│  INSERT INTO payout_jobs               │
│  -- Job 1 (Vendor A)                   │
│  {                                     │
│    order_id,                           │
│    vendor_id: 'vendor-a',              │
│    retailer_id: 'retailer-123',        │
│    sourcer_id: 'sourcer-xyz',          │
│    vendor_cut: $18 (60% of $30),       │
│    retailer_cut: $6 (20% of $30),      │
│    sourcer_cut: $3 (10% of $30),       │
│    tapify_cut: $3 (10% of $30)         │
│  }                                     │
│                                        │
│  -- Job 2 (Vendor B)                   │
│  {                                     │
│    order_id,                           │
│    vendor_id: 'vendor-b',              │
│    retailer_id: 'retailer-123',        │
│    sourcer_id: 'sourcer-xyz',          │
│    vendor_cut: $9 (60% of $15),        │
│    retailer_cut: $3 (20% of $15),      │
│    sourcer_cut: $1.50 (10% of $15),    │
│    tapify_cut: $1.50 (10% of $15)      │
│  }                                     │
└────────────────────────────────────────┘
```

### Payout Calculation Logic

**Per Line Item:**
```js
// Extract vendor from line item
const vendorId = lineItem.properties._vendor_id;
const itemTotal = parseFloat(lineItem.price) * lineItem.quantity;

// Apply commission splits (configurable per vendor)
const payoutJob = {
  order_id,
  vendor_id: vendorId,
  retailer_id,
  sourcer_id,  // from retailers.sourcer_id (who recruited this retailer)
  vendor_cut: itemTotal * 0.60,    // 60%
  retailer_cut: itemTotal * 0.20,  // 20%
  sourcer_cut: itemTotal * 0.10,   // 10%
  tapify_cut: itemTotal * 0.10,    // 10%
  status: 'pending'
};
```

**Payout Execution:**
Admin triggers payout → creates 4 Dwolla transfers per payout job:
1. Master → Vendor A bank: $18
2. Master → Vendor B bank: $9
3. Master → Retailer bank: $9 ($6 + $3)
4. Master → Sourcer bank: $4.50 ($3 + $1.50)
5. Tapify keeps: $4.50 ($3 + $1.50)

---

## 🔗 Flow 5: Vendor OAuth Connection (Phase 2)

### Overview
External vendor connects their Shopify store to sync products into Tapify marketplace.

### Step-by-Step Flow

```
┌──────────────────────────┐
│  Vendor                  │
│  • Completes onboarding  │
│    form                  │
│  • Clicks "Connect       │
│    Shopify Store"        │
└──────────┬───────────────┘
           │
           │ 1. Redirect to Shopify OAuth
           ▼
┌────────────────────────────────────────┐
│  Shopify OAuth Consent Screen          │
│  https://{shop}.myshopify.com          │
│    /admin/oauth/authorize?             │
│    client_id={TAPIFY_APP_ID}&          │
│    scope=read_products,read_orders&    │
│    redirect_uri={TAPIFY}/              │
│      onboard/shopify-connect           │
└──────────┬─────────────────────────────┘
           │
           │ 2. Vendor approves access
           ▼
┌──────────────────────────┐
│  Shopify Redirect        │
│  GET /onboard/           │
│    shopify-connect?      │
│    code={OAUTH_CODE}&    │
│    shop={SHOP_URL}       │
└──────────┬───────────────┘
           │
           │ 3. Exchange code for access token
           ▼
┌──────────────────────────┐
│  Next.js Page            │
│  /onboard/shopify-connect│
│  • POST to Shopify       │
│    /admin/oauth/         │
│      access_token        │
└──────────┬───────────────┘
           │
           │ 4. Shopify returns access token
           ▼
┌──────────────────────────┐
│  Shopify API Response    │
│  {                       │
│    access_token: "...",  │
│    scope: "read_products"│
│  }                       │
└──────────┬───────────────┘
           │
           │ 5. Store token + fetch products
           ▼
┌──────────────────────────┐
│  Next.js Backend         │
│  • Save token to vendors │
│    table                 │
│  • Fetch products via    │
│    /admin/api/products   │
└──────────┬───────────────┘
           │
           │ 6. Database updates
           ▼
┌────────────────────────────────────────┐
│  Supabase                              │
│  UPDATE vendors                        │
│  SET                                   │
│    shopify_access_token = ...,         │
│    shopify_shop_url = ...,             │
│    oauth_completed_at = NOW()          │
│  WHERE id = vendor_id                  │
│                                        │
│  INSERT INTO products (bulk)           │
│    (vendor_id, shopify_product_id,     │
│     title, price, image_url)           │
│  VALUES ...                            │
└──────────┬─────────────────────────────┘
           │
           │ 7. Admin reviews products
           ▼
┌──────────────────────────┐
│  Admin Dashboard         │
│  • Approve products      │
│  • Generate display      │
│    previews              │
│  • Assign to retail      │
│    locations             │
└──────────────────────────┘
```

---

## 📊 Analytics Flow: Scan → Conversion Tracking

### Overview
How Tapify tracks the complete funnel from NFC tap to purchase.

### Step-by-Step Flow

```
┌──────────────────────────┐
│  1. NFC Tap              │
│  /api/uid-redirect       │
│                          │
│  INSERT INTO scans:      │
│  {                       │
│    uid,                  │
│    retailer_id,          │
│    clicked: true,        │
│    converted: false,     │
│    revenue: null,        │
│    timestamp: NOW()      │
│  }                       │
└──────────┬───────────────┘
           │
           │ Customer browses Shopify
           ▼
┌──────────────────────────┐
│  2. Checkout Complete    │
│  /api/shopify-webhook    │
│                          │
│  UPDATE scans            │
│  SET                     │
│    converted = true,     │
│    revenue = order.total │
│  WHERE                   │
│    uid = ref AND         │
│    converted = false     │
│  ORDER BY timestamp DESC │
│  LIMIT 1                 │
└──────────┬───────────────┘
           │
           │ Analytics query
           ▼
┌────────────────────────────────────────┐
│  Retailer Dashboard                    │
│  SELECT                                │
│    COUNT(*) as total_scans,            │
│    SUM(CASE WHEN clicked THEN 1        │
│      ELSE 0 END) as clicks,            │
│    SUM(CASE WHEN converted THEN 1      │
│      ELSE 0 END) as conversions,       │
│    SUM(revenue) as total_revenue       │
│  FROM scans                            │
│  WHERE retailer_id = ...               │
│                                        │
│  Results:                              │
│  • Conversion Rate: 15%                │
│  • Avg Revenue Per Scan: $8.99         │
└────────────────────────────────────────┘
```

---

## 🔐 Security Flow: Webhook HMAC Validation

### Overview
How Tapify validates that webhooks genuinely come from Shopify.

### Step-by-Step Flow

```
┌──────────────────────────┐
│  Shopify Server          │
│  • Order created         │
│  • Generate HMAC         │
│    signature             │
└──────────┬───────────────┘
           │
           │ POST /api/shopify-webhook
           │ Headers:
           │   X-Shopify-Hmac-SHA256: {hash}
           │ Body: {order_data}
           ▼
┌──────────────────────────┐
│  Next.js API             │
│  /api/shopify-webhook    │
│                          │
│  1. Extract HMAC header  │
│  2. Read raw body        │
│  3. Generate local hash  │
└──────────┬───────────────┘
           │
           │ Hash generation
           ▼
┌────────────────────────────────────────┐
│  Crypto Module (Node.js)               │
│  const receivedHmac =                  │
│    req.headers['x-shopify-hmac-sha256']│
│                                        │
│  const hash = crypto                   │
│    .createHmac('sha256',               │
│      process.env.SHOPIFY_WEBHOOK_SECRET│
│    )                                   │
│    .update(JSON.stringify(req.body))   │
│    .digest('base64');                  │
└──────────┬─────────────────────────────┘
           │
           │ Timing-safe comparison
           ▼
┌──────────────────────────┐
│  Validation              │
│  if (crypto.             │
│    timingSafeEqual(      │
│      Buffer.from(        │
│        receivedHmac),    │
│      Buffer.from(hash)   │
│    )) {                  │
│    // Valid ✓            │
│    processOrder();       │
│  } else {                │
│    // Invalid ✗          │
│    return 401;           │
│  }                       │
└──────────────────────────┘
```

---

## 📋 Flow Summary Table

| Flow | Trigger | Key Systems | End State |
|------|---------|-------------|-----------|
| **Customer Purchase** | NFC tap | Next.js → Shopify → Supabase → Dwolla | Order fulfilled, payout pending |
| **Payout Processing** | Admin action | Supabase → Dwolla → Banks | Commissions transferred |
| **UID Claim** | First tap of unclaimed display | Next.js → Supabase | Retailer registered, UID active |
| **Multi-Vendor Order** | Cart with 2+ vendors | Shopify → Next.js → Supabase | Multiple payout jobs created |
| **Vendor OAuth** | Vendor connects store | Shopify OAuth → Supabase | Products synced, ready for displays |
| **Analytics Tracking** | Continuous | NFC taps + webhooks → Supabase | Real-time conversion metrics |
| **Webhook Validation** | Every Shopify event | HMAC signature check | Secure order processing |

---

## 🔗 Related Documentation

- **@context/shopify/overview.md** → Architecture and integration context
- **@context/shopify/webhooks.md** → Webhook payload specifications
- **@context/data_model.md** → Database schema and relationships
- **@context/nextjs/pages_api_summary.md** → API endpoint details
