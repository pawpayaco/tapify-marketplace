# Shopify Integration Overview

## Purpose
Shopify serves as the **commerce engine** and **transaction backend** for Tapify's marketplace infrastructure. It handles checkout, payment processing, order management, and product catalog—bridging physical retail displays to digital fulfillment while enabling multi-party payout attribution.

---

## 🏗️ Architecture Position

Tapify operates on a **three-layer hybrid architecture**:

| Layer | Platform | Function |
|-------|----------|----------|
| **Frontend (Next.js)** | UI + Dashboards + NFC Routing | User-facing interfaces, claim flows, analytics dashboards |
| **Commerce (Shopify)** | Checkout + Orders + Payments | Transaction processing, cart management, order webhooks |
| **Backend (Supabase)** | Data Warehouse + Attribution | Links retailers to orders, tracks UIDs, automates payouts |

**Shopify's Role:**
The commerce layer that converts NFC display scans into completed purchases, syncing order data back to Supabase for commission attribution and payout processing.

**Key Principle:**
Shopify is the **merchant of record** for all transactions. Even as Tapify scales to a multi-vendor marketplace, all sales flow through Tapify's centralized Shopify backend (currently `pawpayaco.com`), ensuring unified payment infrastructure and simplified compliance.

---

## 📈 Phase Evolution

### Phase 1: Pawpaya-Only (Current)
**Model:** Internal proof-of-concept using Pawpaya pet products as the Trojan Horse.

**Shopify Usage:**
- Single Shopify store (`pawpayaco.com`) holds all products
- All sales are Pawpaya-branded items
- Payouts involve only **Retailer ↔ Pawpaya** (2-party split)
- NFC displays redirect to Pawpaya collections with retailer attribution via `?ref=<UID>` parameter

**Data Flow:**
1. Customer taps NFC display in store
2. Redirects to Shopify product page with retailer UID embedded
3. Customer completes checkout on Shopify
4. Shopify sends webhook to Tapify API
5. Tapify logs order and creates payout job for retailer

**Goal:** Validate in-store conversion mechanics, build retailer relationships, test affiliate infrastructure.

---

### Phase 2: Multi-Vendor Marketplace (Future)
**Model:** Open platform for Etsy/Shopify-style creators to distribute products through Tapify's retail network.

**Shopify Usage:**
- Pawpaya Shopify store evolves into **marketplace host**
- Each vendor gets a managed **collection** or **section** within the Shopify store
- Vendors can update listings, pricing, and inventory through Tapify admin
- Payouts expand to **4-party split**: Vendor, Retailer, Sourcing Agent, Tapify

**Vendor Integration:**
- Vendors connect their existing Shopify/Etsy stores via OAuth (optional)
- Tapify syncs product data to create unified catalog
- Vendors retain fulfillment control (ship direct-to-consumer)
- Tapify manages display production and retail distribution

**Checkout Experience:**
- Customers still check out through Tapify's Shopify backend
- Line item properties identify vendor attribution
- Multi-vendor carts supported (all items processed in single transaction)

**Goal:** Scale to a self-propagating marketplace while maintaining centralized payment infrastructure.

---

## 🔗 Integration Points

### 1. NFC/UID → Shopify Redirect
**File:** `pages/api/uid-redirect.js`

**Flow:**
1. Customer taps NFC display → loads `/t?u=<UID>`
2. Next.js checks Supabase `uids` table for claim status
3. If unclaimed → redirect to `/claim` (retailer registration)
4. If claimed → redirect to `affiliate_url` (Shopify product/collection with retailer attribution)

**Example Affiliate URL:**
```
https://pawpayaco.com/collections/friendship-collars?ref=ABC123
```

**Attribution Tracking:**
- `?ref=<UID>` parameter identifies the retailer
- Captured in Shopify checkout via cart/note attributes
- Webhook returns `note_attributes.ref` for payout mapping

---

### 2. Shopify Webhooks → Supabase Orders
**File:** `pages/api/shopify-webhook.js` *(verify implementation)*

**Flow:**
1. Customer completes Shopify checkout
2. Shopify fires `orders/create` webhook to Tapify API
3. API validates HMAC signature for security
4. Extracts order data: line items, customer email, total, attribution params
5. Inserts into Supabase `orders` table
6. Creates matching `payout_job` with commission splits

**Webhook Events:**
- `orders/create` – New order placed
- `orders/updated` – Order status changed *(future)*
- `orders/cancelled` – Order cancelled *(future)*

**Security:**
- HMAC-SHA256 signature validation using `SHOPIFY_WEBHOOK_SECRET`
- Prevents unauthorized webhook spoofing

**Database Impact:**
```sql
-- Orders table insert
INSERT INTO orders (
  shopify_order_id,
  customer_email,
  total,
  retailer_id,  -- from note_attributes.ref → uids.retailer_id
  vendor_id,    -- Phase 1: hardcoded 'pawpaya-id'
  created_at
) VALUES (...);

-- Payout job creation
INSERT INTO payout_jobs (
  order_id,
  retailer_id,
  vendor_id,
  retailer_cut,  -- e.g., 20% of total
  vendor_cut,    -- e.g., 70% of total
  tapify_cut,    -- e.g., 10% of total
  status         -- 'pending'
) VALUES (...);
```

---

### 3. Vendor Shopify OAuth (Phase 2)
**File:** `pages/onboard/shopify-connect.js` *(future)*

**Purpose:** Allow vendors to connect their existing Shopify stores for product sync.

**Flow:**
1. Vendor clicks "Connect Shopify Store" during onboarding
2. OAuth redirect to Shopify consent screen
3. User approves → Shopify redirects with `code` parameter
4. Tapify exchanges code for `access_token` via Shopify API
5. Stores token in `vendors.shopify_access_token`
6. Fetches product catalog via Shopify Admin API
7. Creates display previews for admin approval

**Scopes Required:**
- `read_products` – Fetch product data
- `read_orders` – Track vendor-specific orders
- `read_inventory` – Monitor stock levels

---

### 4. Product Sync (Phase 2)
**Endpoint:** `/api/shopify/sync-products` *(future)*

**Use Case:** Automatically sync vendor products from their Shopify store to Tapify catalog.

**Flow:**
```js
// Fetch products from vendor's Shopify
const response = await fetch(
  `https://${shopUrl}/admin/api/2024-01/products.json`,
  {
    headers: {
      'X-Shopify-Access-Token': accessToken
    }
  }
);

// Store in Tapify products table
await supabase.from('products').insert(products.map(p => ({
  vendor_id,
  shopify_product_id: p.id,
  title: p.title,
  price: p.variants[0].price,
  image_url: p.images[0]?.src
})));
```

---

## 🔄 Data Flow: Customer Journey

### Step-by-Step Transaction Flow

1. **In-Store Discovery**
   - Customer sees Tapify display in retail location
   - Taps NFC tag or scans QR code

2. **NFC Routing**
   - Browser loads `/t?u=<UID>`
   - Next.js API checks `uids` table in Supabase
   - If claimed → redirect to Shopify affiliate URL

3. **Shopify Checkout**
   - Customer lands on Shopify product page
   - Retailer attribution embedded via `?ref=<UID>` parameter
   - Customer adds to cart and completes checkout
   - Payment processed through Shopify (Stripe/Shopify Payments)

4. **Webhook Sync**
   - Shopify sends `orders/create` webhook to `/api/shopify-webhook`
   - API extracts `note_attributes.ref` to identify retailer
   - Queries `uids` table: `ref` → `retailer_id`

5. **Order Logging**
   - Insert order into Supabase `orders` table
   - Link to `retailer_id` and `vendor_id`
   - Record total revenue, line items, customer email

6. **Payout Creation**
   - Auto-create `payout_job` with commission splits
   - Phase 1: Retailer + Pawpaya
   - Phase 2: Retailer + Vendor + Sourcing Agent + Tapify

7. **Admin Approval**
   - Admin views pending payout in Tapify dashboard
   - Triggers payout via `/api/payout`
   - Dwolla executes ACH transfers to bank accounts

8. **Fulfillment**
   - Vendor (or Pawpaya) ships product direct to customer
   - Updates Shopify order status to "fulfilled"

---

## 💳 Attribution Methods

### Current: Query Parameter
```
https://pawpayaco.com/products/friendship-collar?ref=ABC123
```
- Retailer UID passed via `?ref` parameter
- Captured in Shopify cart attributes *(verify implementation)*
- Returned in webhook `note_attributes.ref`

### Alternative: Discount Codes
```
https://pawpayaco.com/discount/RETAILER-ABC123
```
- Each retailer gets unique discount code
- Webhook includes `discount_codes` array
- Extract UID from code pattern

### Future: Line Item Properties (Most Robust)
```js
// Add to cart with custom properties
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{
      id: productId,
      quantity: 1,
      properties: {
        '_retailer_uid': 'ABC123',
        '_vendor_id': 'vendor-uuid'
      }
    }]
  })
});
```
- Properties appear in webhook `line_items[].properties`
- Supports multi-vendor orders with per-item attribution

---

## 🧩 Shopify Data Model (Tapify Context)

### Key Webhook Fields

**From `orders/create` payload:**
```json
{
  "id": 123456789,
  "email": "customer@example.com",
  "total_price": "59.99",
  "line_items": [
    {
      "id": 987654321,
      "title": "Friendship Collar - Blue",
      "quantity": 1,
      "price": "49.99",
      "product_id": 111222333,
      "properties": []  // Future: vendor/retailer attribution
    }
  ],
  "note_attributes": [
    { "name": "ref", "value": "ABC123" }  // Retailer UID
  ],
  "customer": {
    "id": 111222333,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

**Mapping to Supabase:**
- `id` → `orders.shopify_order_id`
- `email` → `orders.customer_email`
- `total_price` → `orders.total`
- `note_attributes.ref` → lookup `uids` → `orders.retailer_id`
- `line_items` → parse for vendor attribution (Phase 2)

---

## 🔐 Security & Environment Variables

### Required Environment Variables
```env
# Webhook validation
SHOPIFY_WEBHOOK_SECRET=shpss_...

# OAuth (vendor connections - Phase 2)
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# Tapify's Shopify Store (Pawpaya)
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...  # (verify if needed)
```

### Webhook Security Pattern
```js
// HMAC signature validation (critical)
const hmac = req.headers['x-shopify-hmac-sha256'];
const hash = crypto
  .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('base64');

if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### OAuth Token Storage
- Store `shopify_access_token` in `vendors` table
- Use server-side only (never expose to browser)
- Encrypt tokens at rest *(verify)*

---

## 📊 Analytics & Conversion Tracking

### Funnel Metrics
Tapify tracks the full conversion funnel from scan to purchase:

1. **Scan** → Log in `scans` table (`clicked: false`)
2. **Click** → Update `scans.clicked = true` when redirect occurs
3. **Checkout** → Shopify webhook updates `scans.converted = true`
4. **Revenue** → Store in `scans.revenue` for analytics

**Implementation Pattern:**
```js
// On NFC tap (/api/uid-redirect)
await supabase.from('scans').insert([{
  uid,
  retailer_id,
  clicked: true,
  converted: false,
  timestamp: new Date()
}]);

// On Shopify webhook (/api/shopify-webhook)
await supabase
  .from('scans')
  .update({ converted: true, revenue: orderTotal })
  .eq('uid', ref)
  .eq('converted', false)
  .order('created_at', { ascending: false })
  .limit(1);
```

---

## 🚀 Future Enhancements

### Planned Features (Phase 2+)
- **Multi-Vendor Collections:** Each vendor gets dedicated Shopify collection
- **Inventory Sync:** Auto-sync stock levels from vendor Shopify stores
- **Fulfillment Webhooks:** Notify customers when vendor ships orders
- **Dynamic Pricing:** Vendors control pricing via Tapify dashboard
- **Metafields:** Custom metafields for vendor attribution, UID mapping
- **Shopify Plus Features:** Custom checkout extensions, wholesale pricing

---

## 🧭 Dependencies

### What Relies on Shopify

**Upstream (feeds into Shopify):**
- NFC displays → generate affiliate URLs pointing to Shopify
- Retailer claim flow → creates affiliate attribution parameters

**Downstream (receives from Shopify):**
- Supabase `orders` table ← webhook syncs
- Supabase `payout_jobs` table ← auto-created from orders
- Admin dashboard analytics ← displays order/revenue data
- Retailer dashboards ← shows commission earnings

### What Shopify Relies On

**From Tapify:**
- Webhook endpoint (`/api/shopify-webhook`) to receive order events
- Valid HMAC signature for security
- Properly formatted affiliate URLs with `?ref=<UID>` parameters

**From Vendors (Phase 2):**
- OAuth consent for product/order access
- Valid Shopify store URL and API credentials

---

## 📖 Related Documentation

### Core Context
- **@context/GAME_PLAN_2.0.md** – Strategic vision, business model, and phase evolution
- **@context/data_model.md** – Entity relationships, data architecture, and flow patterns
- **@context/supabase/overview.md** – Database schema, tables, and foreign keys

### Next.js Integration
- **@context/nextjs/pages_api_summary.md** – API routes, endpoints, and request/response specs
- **@context/nextjs/shopify_integration.md** – Frontend-to-Shopify connection patterns

### Shopify Deep Dive
- **@context/shopify/flows.md** – Step-by-step transaction sequences (customer purchase, payouts, UID claims, multi-vendor orders, OAuth, analytics)
- **@context/shopify/integration_points.md** – API connection details, webhook configuration, OAuth setup, security patterns
- **@context/shopify/webhooks.md** – Webhook payload structures, HMAC validation, event processing, testing
- **@context/shopify/store_structure.md** – Collections organization, product types, vendor attribution, Phase 1→2 evolution
- **@context/shopify/metafields.md** – Custom field definitions, vendor metadata, commission tracking, implementation methods

---

## ✅ Summary

Shopify is the **commerce backbone** of Tapify's hybrid architecture:

- **Phase 1:** Powers Pawpaya-branded DTC sales through retail affiliate network
- **Phase 2:** Scales into marketplace host for multi-vendor product catalog
- **Always:** Centralized merchant of record, simplifying payments and compliance

**Key Integration:**
NFC displays → Next.js routing → Shopify checkout → Webhooks → Supabase attribution → Dwolla payouts

**Core Philosophy:**
One Shopify backend, infinite vendor collections—maintaining unified infrastructure while enabling creator independence.
