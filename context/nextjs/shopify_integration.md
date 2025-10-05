# =Í Shopify Integration  Next.js Layer

Documents how the Next.js frontend integrates with Shopify for order tracking, product sync, and affiliate attribution.

---

## =¡ Purpose
This file explains the Tapify ” Shopify connection points, showing how order webhooks, OAuth flows, and affiliate tracking work across the Next.js application.

---

## >é Integration Architecture

### Shopify's Role in Tapify
1. **Commerce Backend**  Handles checkout, payments, order fulfillment
2. **Product Catalog**  Stores Pawpaya products (and future vendor collections)
3. **Webhook Source**  Sends order events to Tapify API
4. **Affiliate Attribution**  Tracks retailer commissions via UTM params or line item properties

---

## = Integration Points

### 1. NFC Redirect ’ Shopify Affiliate URL
**Flow:**
1. Customer taps NFC display
2. Redirects to `/t?u=<UID>`
3. API checks `uids` table for `affiliate_url`
4. Redirects to Shopify collection with retailer attribution

**Example Affiliate URL:**
```
https://pawpayaco.com/collections/friendship-collars?ref=ABC123
```

**Attribution Method:**
- `?ref=<UID>` query param identifies the retailer
- Shopify checkout may capture this via:
  - UTM parameters (verify)
  - Line item properties (verify)
  - Custom checkout extension (future)

**File:** `pages/api/uid-redirect.js:40`

---

### 2. Shopify Webhooks ’ Supabase Orders
**Flow:**
1. Customer completes Shopify checkout
2. Shopify sends POST webhook to `/api/shopify-webhook`
3. API validates HMAC signature
4. Extracts order data (line items, customer, total)
5. Inserts into `orders` table
6. (Future) Creates `payout_job` with commission splits

**Webhook Events:**
- `orders/create`  New order placed
- `orders/updated`  Order status changed (verify)
- `orders/cancelled`  Order cancelled (verify)

**File:** `pages/api/shopify-webhook.js` (verify  file exists but may be placeholder)

**Webhook Security:**
```js
// HMAC validation (inferred)
const hmac = req.headers['x-shopify-hmac-sha256'];
const hash = crypto
  .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('base64');

if (hash !== hmac) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

### 3. Vendor Shopify OAuth (Future Phase 2)
**Purpose:** Allow vendors to connect their own Shopify stores for product sync.

**Flow:**
1. Vendor clicks "Connect Shopify Store" in onboarding
2. Redirects to Shopify OAuth consent screen:
   ```
   https://{shop}.myshopify.com/admin/oauth/authorize?
     client_id={SHOPIFY_API_KEY}&
     scope=read_products,read_orders&
     redirect_uri={TAPIFY_URL}/onboard/shopify-connect
   ```
3. User approves ’ Shopify redirects with `code` param
4. API exchanges code for access token via Shopify `/admin/oauth/access_token`
5. Stores `shopify_access_token` and `shopify_shop_url` in `vendors` table

**File:** `pages/onboard/shopify-connect.js`

**Database Update:**
```js
// Inferred usage
const { data } = await supabase
  .from('vendors')
  .update({
    shopify_access_token: token,
    shopify_shop_url: shopUrl,
    oauth_completed_at: new Date().toISOString()
  })
  .eq('id', vendor_id);
```

---

### 4. Product Sync (Future Enhancement)
**Purpose:** Automatically sync vendor products from Shopify to Tapify.

**Proposed Flow:**
1. Vendor connects Shopify store
2. Tapify fetches products via Shopify Admin API:
   ```js
   const response = await fetch(
     `https://${shopUrl}/admin/api/2024-01/products.json`,
     {
       headers: {
         'X-Shopify-Access-Token': accessToken
       }
     }
   );
   ```
3. Stores product data in `products` table (verify)
4. Creates display previews for admin approval

**API Endpoint:** (verify) `/api/shopify/sync-products`

---

## =Ê Shopify Data Model (Tapify Context)

### Order Webhook Payload
**Example payload from `orders/create`:**
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
      "price": "49.99"
    }
  ],
  "created_at": "2025-01-15T10:30:00Z",
  "customer": {
    "id": 111222333,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "note_attributes": [
    { "name": "ref", "value": "ABC123" }
  ]
}
```

**Key Fields for Tapify:**
- `id` ’ `orders.shopify_order_id`
- `email` ’ `orders.customer_email`
- `total_price` ’ `orders.total`
- `line_items` ’ Parse for vendor attribution
- `note_attributes.ref` ’ Map to `uids.uid` ’ find `retailer_id`

---

### Affiliate Attribution Logic
**Method 1: Query Parameters (Current)**
```
https://pawpayaco.com/products/friendship-collar?ref=ABC123
```
- Customer lands on page with `ref=ABC123`
- Shopify captures via cart attributes (verify)
- Webhook includes `note_attributes.ref = ABC123`

**Method 2: Shopify Discount Codes (Alternative)**
```
https://pawpayaco.com/discount/RETAILER-ABC123
```
- Each retailer gets unique discount code
- Shopify webhook includes `discount_codes` array
- Extract UID from code pattern

**Method 3: Line Item Properties (Future)**
```js
// Cart API (JavaScript)
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{
      id: productId,
      quantity: 1,
      properties: {
        '_retailer_uid': 'ABC123'
      }
    }]
  })
});
```
- Properties appear in webhook `line_items[].properties`
- Most robust method for multi-product orders

---

## = Order ’ Payout Flow

### Step-by-Step
1. **Order Created** ’ Shopify webhook fires
2. **Webhook Received** ’ `/api/shopify-webhook` validates & parses
3. **Extract UID** ’ From `note_attributes.ref` or `discount_codes`
4. **Lookup Retailer** ’ Query `uids` table:
   ```js
   const { data: uid } = await supabase
     .from('uids')
     .select('business_id, retailer_id')
     .eq('uid', ref)
     .single();
   ```
5. **Create Order Record** ’ Insert into `orders`:
   ```js
   const { data: order } = await supabase
     .from('orders')
     .insert([{
       shopify_order_id: orderData.id,
       customer_email: orderData.email,
       total: orderData.total_price,
       retailer_id: uid.retailer_id,
       vendor_id: 'pawpaya-id', // Phase 1: hardcoded
       created_at: orderData.created_at
     }]);
   ```
6. **Create Payout Job** ’ Insert into `payout_jobs`:
   ```js
   const { data: payoutJob } = await supabase
     .from('payout_jobs')
     .insert([{
       order_id: order.id,
       retailer_id: uid.retailer_id,
       vendor_id: 'pawpaya-id',
       retailer_cut: orderData.total_price * 0.20, // 20%
       vendor_cut: orderData.total_price * 0.70,   // 70%
       tapify_cut: orderData.total_price * 0.10,   // 10%
       status: 'pending'
     }]);
   ```
7. **Admin Approval** ’ Admin dashboard shows pending payout
8. **Trigger Payout** ’ `/api/payout` executes Dwolla transfers

---

## =à Shopify Admin API Usage

### Product Fetching (Future)
**Endpoint:** `GET /admin/api/2024-01/products.json`

**Request:**
```js
const response = await fetch(
  `https://${shopUrl}/admin/api/2024-01/products.json`,
  {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  }
);

const { products } = await response.json();
```

**Response:**
```json
{
  "products": [
    {
      "id": 123456,
      "title": "Friendship Collar",
      "variants": [...],
      "images": [...],
      "product_type": "Pet Accessories"
    }
  ]
}
```

---

### Inventory Tracking (Future)
**Endpoint:** `GET /admin/api/2024-01/inventory_levels.json`

**Use Case:** Alert vendor when inventory falls below threshold.

---

### Order Fulfillment (Future)
**Endpoint:** `POST /admin/api/2024-01/orders/{order_id}/fulfillments.json`

**Use Case:** Automatically mark Tapify orders as fulfilled when vendor ships.

---

## >ê Environment Variables

**Required for Shopify Integration:**
```env
# Webhook validation
SHOPIFY_WEBHOOK_SECRET=shpss_...

# OAuth (vendors connecting stores)
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# Tapify's Shopify Store (Pawpaya)
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=... (verify)
```

---

## = Security Considerations

### Webhook Signature Validation
**Always validate HMAC:**
```js
const isValid = crypto.timingSafeEqual(
  Buffer.from(hmac),
  Buffer.from(hash)
);
```

### OAuth Token Storage
- Store `shopify_access_token` in `vendors` table
- Encrypt tokens at rest (verify)
- Use server-side only (never expose to browser)

### Rate Limiting
- Shopify API has rate limits (2 req/sec for REST)
- Implement backoff/retry logic for bulk operations

---

## =È Analytics Integration

### Track Conversion Funnel
1. **Scan** ’ Log in `scans` table
2. **Click** ’ Update `scans.clicked = true`
3. **Checkout** ’ Shopify webhook ’ update `scans.converted = true`
4. **Revenue** ’ Store in `scans.revenue`

**Implementation (verify):**
```js
// On UID redirect
await supabase.from('scans').insert([{
  uid,
  retailer_id,
  clicked: false,
  converted: false
}]);

// On Shopify webhook
await supabase
  .from('scans')
  .update({ converted: true, revenue: orderTotal })
  .eq('uid', ref)
  .eq('converted', false)
  .order('created_at', { ascending: false })
  .limit(1);
```

---

## = Phase Differences

### Phase 1 (Current  Pawpaya Only)
-  Single Shopify store (pawpayaco.com)
-  Webhook ’ Order sync
-  NFC redirect ’ Affiliate URL
- L No vendor OAuth
- L No multi-vendor collections

### Phase 2 (Future  Marketplace)
-  Multiple vendor Shopify stores
-  Vendor OAuth for product sync
-  Multi-vendor collections in Tapify Shopify
-  Dynamic commission splits per vendor
-  Inventory sync across vendors

---

## = Relations
- See **@context/shopify/overview.md** for Shopify architecture
- See **@context/shopify/webhooks.md** for webhook details
- See **@context/shopify/integration_points.md** for connection diagram
- See **@context/nextjs/pages_api_summary.md** for webhook API route
- See **@context/payouts_flow.md** for order ’ payout sequence
