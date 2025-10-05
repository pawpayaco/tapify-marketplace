# Shopify Integration Points

## Purpose
Maps the specific connection points between Tapify's Next.js application and Shopify's commerce platform. This document serves as a technical reference for all API routes, webhook endpoints, and data synchronization mechanisms.

---

## 🔗 Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TAPIFY ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Next.js    │◄───────►│   Supabase   │                │
│  │  Frontend    │         │  PostgreSQL  │                │
│  └──────┬───────┘         └──────────────┘                │
│         │                                                   │
│         │ API Routes                                        │
│         │                                                   │
│  ┌──────▼────────────────────────────────┐                │
│  │     Next.js API Layer                 │                │
│  │  • /api/uid-redirect                  │                │
│  │  • /api/shopify-webhook               │                │
│  │  • /api/shopify/sync-products         │                │
│  │  • /api/payout                        │                │
│  └──────┬────────────────────────────────┘                │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SHOPIFY PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │  Storefront  │         │  Admin API   │                │
│  │ pawpayaco.com│         │ (REST/GraphQL)│                │
│  └──────────────┘         └──────────────┘                │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Webhooks   │────────►│  OAuth Flow  │                │
│  │ orders/create│         │ (vendors only)│                │
│  └──────────────┘         └──────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## =� Connection Point 1: NFC Redirect � Shopify Storefront

### Purpose
Route customers from physical NFC displays to Shopify product pages with retailer attribution.

### Integration Components

**Next.js API Route:**
```
/api/uid-redirect
```
**File:** `pages/api/uid-redirect.js`

**HTTP Method:** `GET`

**Request Pattern:**
```
GET /t?u=ABC123
```

**Shopify Destination:**
```
https://pawpayaco.com/collections/{collection}?ref=ABC123
```

### Data Flow

```
NFC Tag � Tapify API � Supabase UID Lookup � Shopify Storefront
```

### Implementation Details

**Query Parameters:**
- `u` or `uid`  The NFC tag's unique identifier

**Supabase Query:**
```sql
SELECT affiliate_url, is_claimed, retailer_id
FROM uids
WHERE uid = $1;
```

**Response Logic:**
```js
if (!uid.is_claimed) {
  return res.redirect(302, `/claim?u=${uid}`);
}

return res.redirect(302, uid.affiliate_url);
```

**Shopify URL Format:**
```
{SHOPIFY_DOMAIN}/collections/{collection_handle}?ref={uid}
or
{SHOPIFY_DOMAIN}/products/{product_handle}?ref={uid}
```

### Attribution Capture

**Method:** Query parameter stored in Shopify checkout

**Implementation Options:**

1. **Cart Attributes (Current):**
```js
// Shopify liquid theme
{% if request.GET.ref %}
  <script>
    fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: { 'ref': '{{ request.GET.ref }}' }
      })
    });
  </script>
{% endif %}
```

2. **Note Attributes (Alternative):**
```js
// Add to cart form
<input type="hidden" name="attributes[ref]" value="{{ request.GET.ref }}" />
```

3. **Line Item Properties (Phase 2):**
```js
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{
      id: variantId,
      quantity: 1,
      properties: {
        '_retailer_uid': uidFromQueryParam
      }
    }]
  })
});
```

---

## =� Connection Point 2: Shopify Webhooks � Tapify API

### Purpose
Sync order data from Shopify to Supabase for payout attribution and analytics.

### Integration Components

**Next.js API Route:**
```
/api/shopify-webhook
```
**File:** `pages/api/shopify-webhook.js` *(verify implementation)*

**HTTP Method:** `POST`

**Shopify Webhook Configuration:**
- **Event:** `orders/create`
- **Format:** JSON
- **URL:** `https://tapify.co/api/shopify-webhook`
- **API Version:** `2024-01` (or latest stable)

### Webhook Registration

**Via Shopify Admin:**
```
Settings � Notifications � Webhooks � Create webhook
Event: Order creation
Format: JSON
URL: https://tapify.co/api/shopify-webhook
```

**Via Shopify API:**
```bash
POST https://{shop}.myshopify.com/admin/api/2024-01/webhooks.json

{
  "webhook": {
    "topic": "orders/create",
    "address": "https://tapify.co/api/shopify-webhook",
    "format": "json"
  }
}
```

### Security: HMAC Validation

**Headers Sent by Shopify:**
```
X-Shopify-Hmac-SHA256: {base64_encoded_hash}
X-Shopify-Shop-Domain: pawpayaco.myshopify.com
X-Shopify-Topic: orders/create
X-Shopify-Webhook-Id: {unique_id}
```

**Validation Code:**
```js
import crypto from 'crypto';

export default async function handler(req, res) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const body = JSON.stringify(req.body);

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Process webhook...
}
```

### Payload Processing

**Extract Key Fields:**
```js
const {
  id: shopifyOrderId,
  email: customerEmail,
  total_price: total,
  line_items: lineItems,
  note_attributes: noteAttributes,
  created_at: createdAt
} = req.body;

// Extract retailer UID
const refAttr = noteAttributes?.find(attr => attr.name === 'ref');
const uid = refAttr?.value;
```

**Lookup Retailer:**
```js
const { data: uidData } = await supabase
  .from('uids')
  .select('retailer_id, business_id')
  .eq('uid', uid)
  .single();
```

**Insert Order:**
```js
const { data: order } = await supabase
  .from('orders')
  .insert([{
    shopify_order_id: shopifyOrderId,
    customer_email: customerEmail,
    total: parseFloat(total),
    retailer_id: uidData.retailer_id,
    vendor_id: 'pawpaya-id', // Phase 1 hardcoded
    created_at: createdAt
  }])
  .select()
  .single();
```

**Create Payout Job:**
```js
await supabase
  .from('payout_jobs')
  .insert([{
    order_id: order.id,
    retailer_id: uidData.retailer_id,
    vendor_id: 'pawpaya-id',
    retailer_cut: parseFloat(total) * 0.20,
    vendor_cut: parseFloat(total) * 0.80,
    status: 'pending'
  }]);
```

### Supported Webhook Events

| Event | Purpose | Status |
|-------|---------|--------|
| `orders/create` | New order placed | **Active** |
| `orders/updated` | Order status changed | *Future* |
| `orders/cancelled` | Order cancelled | *Future* |
| `orders/fulfilled` | All items shipped | *Future* |
| `refunds/create` | Refund issued | *Future* |

---

## =� Connection Point 3: Shopify Admin API (Product Sync)

### Purpose
Fetch vendor product data from their Shopify stores for display creation (Phase 2).

### Integration Components

**Next.js API Route:**
```
/api/shopify/sync-products
```
**File:** `pages/api/shopify/sync-products.js` *(future implementation)*

**HTTP Method:** `POST`

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "shopUrl": "vendor-shop.myshopify.com",
  "accessToken": "shpat_xxxxx"
}
```

### Shopify API Calls

**1. Fetch Products:**
```js
const response = await fetch(
  `https://${shopUrl}/admin/api/2024-01/products.json?limit=250`,
  {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  }
);

const { products } = await response.json();
```

**2. Fetch Collections:**
```js
const response = await fetch(
  `https://${shopUrl}/admin/api/2024-01/custom_collections.json`,
  {
    headers: {
      'X-Shopify-Access-Token': accessToken
    }
  }
);

const { custom_collections } = await response.json();
```

**3. Fetch Inventory Levels:**
```js
const response = await fetch(
  `https://${shopUrl}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${ids}`,
  {
    headers: {
      'X-Shopify-Access-Token': accessToken
    }
  }
);
```

### Data Transformation

**Map Shopify Product � Tapify Product:**
```js
const tapifyProduct = {
  vendor_id: vendorId,
  shopify_product_id: product.id,
  title: product.title,
  description: product.body_html,
  price: product.variants[0].price,
  compare_at_price: product.variants[0].compare_at_price,
  image_url: product.images[0]?.src,
  product_type: product.product_type,
  tags: product.tags.split(', '),
  created_at: product.created_at
};

await supabase.from('products').insert([tapifyProduct]);
```

### Rate Limiting

**Shopify REST API Limits:**
- **Standard Plan:** 2 requests/second
- **Shopify Plus:** 4 requests/second

**Implementation:**
```js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

for (const product of products) {
  await processProduct(product);
  await delay(500); // 2 req/sec max
}
```

---

## =� Connection Point 4: Shopify OAuth (Vendor Connection)

### Purpose
Allow vendors to connect their Shopify stores via OAuth for product/order access (Phase 2).

### Integration Components

**Next.js Pages:**
- `/onboard/shopify-connect`  OAuth callback handler
- `/onboard/dashboard`  "Connect Shopify" button

**Shopify App Credentials:**
- `SHOPIFY_API_KEY`  App client ID
- `SHOPIFY_API_SECRET`  App client secret

### OAuth Flow

**1. Initiate OAuth:**
```js
// User clicks "Connect Shopify"
const shopDomain = 'vendor-shop.myshopify.com';
const redirectUri = 'https://tapify.co/onboard/shopify-connect';
const scopes = 'read_products,read_orders,read_inventory';

const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
  `client_id=${process.env.SHOPIFY_API_KEY}&` +
  `scope=${scopes}&` +
  `redirect_uri=${redirectUri}&` +
  `state=${csrfToken}`;

window.location.href = authUrl;
```

**2. Handle Callback:**
```js
// pages/onboard/shopify-connect.js
export default async function ShopifyConnect({ code, shop, state }) {
  // Verify CSRF token
  if (state !== expectedState) {
    return { error: 'Invalid state' };
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    `https://${shop}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    }
  );

  const { access_token, scope } = await tokenResponse.json();

  // Store in Supabase
  await supabase
    .from('vendors')
    .update({
      shopify_access_token: access_token,
      shopify_shop_url: shop,
      shopify_scopes: scope,
      oauth_completed_at: new Date().toISOString()
    })
    .eq('id', vendorId);
}
```

**3. Required OAuth Scopes:**
```
read_products        // Fetch product catalog
read_orders          // Track vendor-specific orders
read_inventory       // Monitor stock levels
write_products       // (Future) Update pricing/inventory
```

### Token Storage

**Supabase `vendors` Table:**
```sql
shopify_access_token   TEXT      -- Encrypted OAuth token
shopify_shop_url       TEXT      -- vendor-shop.myshopify.com
shopify_scopes         TEXT      -- Granted permissions
oauth_completed_at     TIMESTAMP -- When vendor connected
```

---

## =� Connection Point 5: Storefront API (Future)

### Purpose
Fetch product data directly on the frontend for faster page loads (optional enhancement).

### Integration Components

**Shopify Storefront Access Token:**
```env
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxx
```

**GraphQL Query Example:**
```js
const query = `{
  productByHandle(handle: "friendship-collar") {
    id
    title
    description
    variants(first: 10) {
      edges {
        node {
          id
          title
          priceV2 {
            amount
            currencyCode
          }
          availableForSale
        }
      }
    }
    images(first: 5) {
      edges {
        node {
          originalSrc
          altText
        }
      }
    }
  }
}`;

const response = await fetch(
  `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query })
  }
);
```

---

## = Environment Variables Reference

### Required for All Integrations

```env
# Webhook validation
SHOPIFY_WEBHOOK_SECRET=shpss_xxxxx

# Admin API (product sync, webhooks)
SHOPIFY_ADMIN_API_KEY=xxxxx
SHOPIFY_ADMIN_API_PASSWORD=xxxxx  # (deprecated, use access tokens)

# OAuth (vendor connections - Phase 2)
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx

# Tapify's Shopify Store
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com

# Storefront API (optional)
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxxxx
```

---

## =� Integration Status Matrix

| Integration Point | Status | Phase | Priority |
|-------------------|--------|-------|----------|
| **NFC � Storefront** |  Active | 1 | **Critical** |
| **Webhooks (orders/create)** | = Verify | 1 | **Critical** |
| **Admin API (products)** | =� Future | 2 | Medium |
| **OAuth (vendors)** | =� Future | 2 | Medium |
| **Storefront API** | =� Future | 2 | Low |
| **Inventory Sync** | =� Future | 2 | Medium |
| **Fulfillment Webhooks** | =� Future | 2 | Low |

**Legend:**
-  Active  Currently implemented and tested
- = Verify  Implemented but needs verification
- =� Future  Planned for future phases

---

## >� Testing Integration Points

### Webhook Testing

**Using Shopify CLI:**
```bash
shopify webhook trigger orders/create --address https://tapify.co/api/shopify-webhook
```

**Manual Test Payload:**
```bash
curl -X POST https://localhost:3000/api/shopify-webhook \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-SHA256: {valid_hmac}" \
  -d @test-order.json
```

### NFC Redirect Testing

```bash
curl -i http://localhost:3000/t?u=TEST-UID-123
```

**Expected Response:**
```
HTTP/1.1 302 Found
Location: https://pawpayaco.com/collections/collars?ref=TEST-UID-123
```

### OAuth Testing (Sandbox)

1. Create Shopify Partner account
2. Create test store
3. Generate test OAuth credentials
4. Test full OAuth flow in development

---

## =� Related Documentation

- **@context/shopify/overview.md**  Architecture and purpose
- **@context/shopify/webhooks.md**  Webhook payload details
- **@context/shopify/flows.md**  Transaction flow sequences
- **@context/nextjs/pages_api_summary.md**  API route specifications
- **@context/data_model.md**  Database schema
