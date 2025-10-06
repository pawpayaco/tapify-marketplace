# 🛍️ SHOPIFY AI CODER BRIEFING DOCUMENT

> **Mission:** Fix, optimize, and integrate the Tapify Shopify store (pawpayaco.com) to seamlessly work with the Next.js/Supabase marketplace infrastructure.

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#-project-overview)
2. [Critical Context: Business Strategy](#-critical-context-business-strategy)
3. [System Architecture](#-system-architecture)
4. [Your Mission: Shopify Integration](#-your-mission-shopify-integration)
5. [Current State & Known Issues](#-current-state--known-issues)
6. [Technical Specifications](#-technical-specifications)
7. [Integration Points Reference](#-integration-points-reference)
8. [Testing & Validation](#-testing--validation)
9. [Deployment Checklist](#-deployment-checklist)

---

## 🎯 PROJECT OVERVIEW

**Tapify** is a hybrid marketplace platform that bridges DTC e-commerce and physical retail through NFC-enabled displays. It operates on a **two-phase growth strategy**:

### Phase 1: TROJAN HORSE (Current)
- **Brand:** Pawpaya (dog collars and pet products)
- **Goal:** Validate the system, build retailer relationships, generate early cashflow
- **Shopify Role:** Single-brand e-commerce backend (pawpayaco.com)
- **Revenue Model:** 2-party split (Retailer 20% + Pawpaya 80%)

### Phase 2: MARKETPLACE EXPANSION (Future)
- **Platform:** Multi-vendor marketplace ("Amazon meets Etsy for physical retail")
- **Shopify Role:** Marketplace host with vendor collections
- **Revenue Model:** 4-party split (Vendor 60% + Retailer 20% + Sourcer 10% + Tapify 10%)

---

## 🧠 CRITICAL CONTEXT: BUSINESS STRATEGY

### How Tapify Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE TAPIFY FLYWHEEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Retail Store receives FREE NFC-enabled product display      │
│     (no inventory risk, no cost)                                │
│                                                                 │
│  2. Customer in store sees product, taps NFC tag/QR code        │
│     → Phone opens Shopify product page with retailer tracking   │
│                                                                 │
│  3. Customer orders online (Shopify checkout)                   │
│     → Shopify webhook sends order to Next.js API                │
│                                                                 │
│  4. Next.js API logs order in Supabase                          │
│     → Creates payout job with commission splits                 │
│                                                                 │
│  5. Admin processes payout via Dwolla                           │
│     → ACH transfers to retailer + vendor bank accounts          │
│                                                                 │
│  6. Vendor ships product direct to customer                     │
│     → Retailer earned passive income with zero effort           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Business Entities

| Entity | Description | Revenue Share |
|--------|-------------|---------------|
| **Vendor** | Product creator (Pawpaya in Phase 1, Etsy-style makers in Phase 2) | 60-80% |
| **Retailer** | Physical store hosting Tapify displays | 20% |
| **Sourcing Agent** | Affiliate who recruited vendor/retailer (Phase 2 only) | 10% |
| **Tapify** | Platform owner (you're building this) | 10% |

### Why Shopify Integration Matters

**Shopify is the transaction engine.** Every sale flows through it, which means:
- Order data must sync to Supabase via webhooks
- Retailer attribution must be captured in checkout (`?ref=UID` parameter)
- Line item properties will enable multi-vendor orders (Phase 2)
- Product catalog needs to support vendor collections

**If Shopify breaks, the entire payout system fails.**

---

## 🏗️ SYSTEM ARCHITECTURE

### Three-Layer Hybrid Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                               │
│  Next.js (tapify.co)                                             │
│  • NFC redirect handler (/api/uid-redirect)                      │
│  • Claim page for retailers (/claim)                             │
│  • Admin dashboard (/admin)                                      │
│  • Retailer dashboard (/onboard/dashboard)                       │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    COMMERCE LAYER                                │
│  Shopify (pawpayaco.com)                                         │
│  • Product catalog & collections                                 │
│  • Checkout & payment processing                                 │
│  • Order creation & webhooks                                     │
│  • Vendor OAuth (Phase 2)                                        │
└───────────────────┬──────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  Supabase (PostgreSQL)                                           │
│  • retailers, vendors, uids, orders, payout_jobs                 │
│  • scans (analytics tracking)                                    │
│  • Authentication (auth.users)                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Customer Purchase Journey

```
Customer taps NFC display in retail store
    ↓
Phone loads: tapify.co/t?u=ABC123
    ↓
Next.js API checks Supabase uids table
    ↓
If claimed → Redirect to: pawpayaco.com/collections/collars?ref=ABC123
If unclaimed → Redirect to: tapify.co/claim?u=ABC123
    ↓
Customer browses Shopify, adds to cart
    ↓
Checkout complete (ref=ABC123 stored in cart attributes)
    ↓
Shopify fires orders/create webhook → POST to /api/shopify-webhook
    ↓
Next.js API validates HMAC signature
    ↓
Extract retailer UID from note_attributes.ref
    ↓
Lookup retailer_id from uids table
    ↓
INSERT order into Supabase orders table
    ↓
INSERT payout_job with commission splits
    ↓
Admin approves payout → Dwolla transfers funds
```

---

## 🎯 YOUR MISSION: SHOPIFY INTEGRATION

### Primary Objectives

You are responsible for ensuring the **Shopify store works flawlessly** with the Tapify ecosystem. This includes:

#### 1. **Webhook Integration** (CRITICAL)
- [ ] Verify `orders/create` webhook is properly configured
- [ ] Ensure webhook endpoint returns 200 OK reliably
- [ ] Validate HMAC signature security
- [ ] Confirm retailer attribution (`note_attributes.ref`) is captured
- [ ] Test duplicate order prevention

#### 2. **Attribution Tracking** (CRITICAL)
- [ ] Implement `?ref=UID` parameter capture in Shopify theme
- [ ] Store `ref` value in cart attributes via JavaScript
- [ ] Ensure `ref` appears in webhook payload as `note_attributes.ref`
- [ ] Test attribution flow end-to-end

#### 3. **Product Catalog Structure**
- [ ] Organize collections for Phase 1 (Pawpaya products)
- [ ] Prepare metafields for Phase 2 (vendor attribution)
- [ ] Ensure product data is webhook-compatible
- [ ] Optimize images and descriptions

#### 4. **Checkout Experience**
- [ ] Streamline checkout flow for mobile (NFC tap users)
- [ ] Test cart abandonment recovery
- [ ] Verify payment processing (Shopify Payments)
- [ ] Ensure order confirmation emails work

#### 5. **Theme Customization**
- [ ] Apply Tapify/Pawpaya branding
- [ ] Mobile-first design (90% of NFC taps are mobile)
- [ ] Fast load times (<2s)
- [ ] Accessibility compliance

---

## ⚠️ CURRENT STATE & KNOWN ISSUES

### What's Working ✅
- Shopify store exists at pawpayaco.com
- Products are listed (Pawpaya pet products)
- Basic checkout flow operational
- Next.js API routes exist for NFC redirect

### What Needs Verification ❓
- **Webhook endpoint:** `/api/shopify-webhook` may not be fully implemented
- **HMAC validation:** Security check may be missing
- **Attribution capture:** `?ref=UID` parameter capture likely broken
- **Database sync:** Orders may not be syncing to Supabase correctly

### Known Issues to Fix 🔧

1. **Retailer Attribution Not Capturing**
   - **Problem:** `?ref=ABC123` parameter in URL is not stored during checkout
   - **Impact:** Orders can't be linked to retailers → payouts fail
   - **Fix Required:** Add JavaScript to Shopify theme to capture query param and add to cart attributes

2. **Webhook Endpoint Missing or Incomplete**
   - **Problem:** `/api/shopify-webhook` may not exist or lacks HMAC validation
   - **Impact:** Orders don't sync to Supabase → no payout jobs created
   - **Fix Required:** Implement complete webhook handler with security

3. **Mobile Performance Issues**
   - **Problem:** Theme may be slow on mobile devices
   - **Impact:** Lost conversions from NFC tap users
   - **Fix Required:** Optimize theme, reduce JavaScript, compress images

4. **Multi-Vendor Preparation**
   - **Problem:** Store structure assumes single vendor (Pawpaya)
   - **Impact:** Can't scale to Phase 2 without major refactoring
   - **Fix Required:** Add metafields, prepare line item properties structure

---

## 🔧 TECHNICAL SPECIFICATIONS

### Environment Variables Required

```env
# Shopify Store Configuration
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com

# Webhook Security
SHOPIFY_WEBHOOK_SECRET=shpss_xxxxx

# OAuth (Phase 2 - vendor connections)
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx

# Admin API (optional, for product sync)
SHOPIFY_ADMIN_API_KEY=xxxxx
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx
```

### Database Schema (Supabase)

**⚠️ IMPORTANT - October 2025 Migration:**
The database was recently consolidated (2025-10-06). Key changes:
- ✅ Added `retailers.created_by_user_id` and `retailers.recruited_by_sourcer_id`
- ✅ Phone/email consolidated from `retailer_owners` → `retailers`
- ⚠️ `retailer_owners` table still exists but is DEPRECATED (do not use for new code)
- ⚠️ `retailers.location`, `retailers.store_phone`, `retailers.onboarding_completed` are DEPRECATED

**Key Tables You'll Interact With:**

```sql
-- UIDs (NFC tags) - FULL SCHEMA
CREATE TABLE uids (
  uid TEXT PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  retailer_id UUID REFERENCES retailers(id),
  affiliate_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  is_connected BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  claimed_by_user_id UUID,
  last_scan_at TIMESTAMPTZ,
  last_scan_ip TEXT,
  last_scan_user_agent TEXT,
  last_scan_location TEXT,
  last_order_at TIMESTAMPTZ,
  last_order_total NUMERIC,
  scan_count INTEGER DEFAULT 0
);

-- Orders (synced from Shopify) - FULL SCHEMA
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_order_id TEXT,  -- Shopify's order ID
  shopify_order_number TEXT,  -- Human-readable order number
  shop_domain TEXT,
  customer_email TEXT,
  customer_name TEXT,
  retailer_id UUID REFERENCES retailers(id),
  vendor_id UUID REFERENCES vendors(id),
  business_id UUID REFERENCES businesses(id),
  currency TEXT DEFAULT 'USD',
  total NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  financial_status TEXT,  -- paid, pending, refunded, etc.
  fulfillment_status TEXT,  -- fulfilled, unfulfilled, partial, etc.
  processed_at TIMESTAMPTZ,
  source_uid TEXT,  -- UID that generated this order
  line_items JSONB DEFAULT '[]'::jsonb,  -- Product details (Phase 2: vendor attribution)
  raw_payload JSONB,  -- Full Shopify webhook payload for audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payout Jobs (commission tracking) - FULL SCHEMA
CREATE TABLE payout_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  retailer_id UUID REFERENCES retailers(id),
  sourcer_id UUID REFERENCES sourcer_accounts(id),  -- Phase 2 ready!
  order_id UUID REFERENCES orders(id),
  total_amount NUMERIC DEFAULT 0,
  vendor_cut NUMERIC DEFAULT 0,
  retailer_cut NUMERIC DEFAULT 0,
  sourcer_cut NUMERIC DEFAULT 0,  -- Phase 2 ready!
  tapify_cut NUMERIC DEFAULT 0,  -- Phase 2 ready!
  status TEXT DEFAULT 'pending',  -- pending | paid | cancelled
  date_paid TIMESTAMPTZ,
  plaid_token TEXT,
  source_uid TEXT,
  transfer_ids JSONB DEFAULT '[]'::jsonb,  -- Dwolla transfer IDs
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scans (analytics) - FULL SCHEMA
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT REFERENCES uids(uid),
  timestamp TIMESTAMPTZ DEFAULT now(),
  location TEXT,
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  revenue NUMERIC DEFAULT 0,
  retailer_id UUID REFERENCES retailers(id),
  business_id UUID REFERENCES businesses(id),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB
);

-- Retailers (stores hosting displays) - KEY COLUMNS ONLY
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  linked_vendor_id UUID REFERENCES vendors(id),
  business_id UUID REFERENCES businesses(id),
  address TEXT,
  phone TEXT,  -- Consolidated from retailer_owners
  email TEXT,  -- Consolidated from retailer_owners
  owner_name TEXT,
  manager_name TEXT,
  converted BOOLEAN DEFAULT false,  -- True if actively using Tapify
  converted_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES auth.users(id),  -- NEW from migration
  recruited_by_sourcer_id UUID REFERENCES sourcer_accounts(id),  -- NEW from migration (Phase 2)
  created_at TIMESTAMPTZ DEFAULT now()
  -- NOTE: location, store_phone, onboarding_completed are DEPRECATED (still exist, don't use)
);
```

**⚠️ DEPRECATED - DO NOT USE:**
- `retailer_owners` table (data consolidated into `retailers`)
- `retailers.location` (use `retailers.address`)
- `retailers.store_phone` (use `retailers.phone`)
- `retailers.onboarding_completed` (use `retailers.converted`)

### API Routes Reference

**File Locations in Next.js Project:**

```
pages/api/
├── uid-redirect.js        # NFC tap handler
├── shopify-webhook.js     # Orders/create webhook (VERIFY THIS)
├── register-store.js      # Retailer onboarding
├── payout.js              # Admin payout processing
└── shopify/
    └── sync-products.js   # Phase 2: Vendor product sync
```

---

## 🔗 INTEGRATION POINTS REFERENCE

### Integration Point 1: NFC Redirect → Shopify

**Next.js Handler:** `/api/uid-redirect`

**Flow:**
```
GET /t?u=ABC123
    ↓
Query: SELECT affiliate_url FROM uids WHERE uid = 'ABC123'
    ↓
302 Redirect to: https://pawpayaco.com/collections/collars?ref=ABC123
```

**Shopify Theme Requirement:**
- Must capture `?ref=` parameter from URL
- Store in cart attributes via JavaScript
- Persist through checkout

**Implementation (Add to Shopify theme.liquid):**

```html
{% if request.GET.ref %}
<script>
(function() {
  const ref = '{{ request.GET.ref }}';

  // Store ref in cart attributes
  fetch('/cart/update.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attributes: { 'ref': ref }
    })
  })
  .then(response => response.json())
  .then(cart => console.log('Retailer attribution captured:', ref))
  .catch(error => console.error('Attribution failed:', error));
})();
</script>
{% endif %}
```

---

### Integration Point 2: Shopify Webhook → Next.js API

**Shopify Webhook Configuration:**

```
Event: orders/create
Format: JSON
URL: https://tapify.co/api/shopify-webhook
API Version: 2024-01
```

**Setup Location in Shopify:**
```
Settings → Notifications → Webhooks → Create webhook
```

**Next.js Handler:** `/pages/api/shopify-webhook.js`

**Required Implementation:**

```javascript
import crypto from 'crypto';
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // STEP 1: Validate HMAC (CRITICAL FOR SECURITY)
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac) {
    return res.status(401).json({ error: 'Missing HMAC' });
  }

  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hash))) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // STEP 2: Extract order data
  const order = req.body;
  const refAttr = order.note_attributes?.find(attr => attr.name === 'ref');
  const uid = refAttr?.value;

  // STEP 3: Lookup retailer from UID
  let retailerId = null;
  if (uid) {
    const { data: uidData } = await supabase
      .from('uids')
      .select('retailer_id')
      .eq('uid', uid)
      .single();

    retailerId = uidData?.retailer_id;
  }

  // STEP 4: Insert order into Supabase (FULL SCHEMA)
  const { data: orderRecord, error: orderError } = await supabase
    .from('orders')
    .insert([{
      shopify_order_id: order.id.toString(),
      shopify_order_number: order.order_number?.toString(),
      shop_domain: order.shop_domain || 'pawpayaco.myshopify.com',
      customer_email: order.email,
      customer_name: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : null,
      retailer_id: retailerId,
      vendor_id: 'pawpaya-vendor-id', // Hardcoded for Phase 1
      business_id: uidData?.business_id,
      currency: order.currency || 'USD',
      total: parseFloat(order.total_price || 0),
      subtotal: parseFloat(order.subtotal_price || 0),
      tax_total: parseFloat(order.total_tax || 0),
      discount_total: parseFloat(order.total_discounts || 0),
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      processed_at: order.processed_at || order.created_at,
      source_uid: uid,
      line_items: order.line_items || [],
      raw_payload: order,  // Store full webhook payload for audit
      created_at: order.created_at
    }])
    .select()
    .single();

  if (orderError) {
    console.error('Order insert failed:', orderError);
    // Still return 200 to Shopify to prevent retries
    return res.status(200).json({ received: true, error: 'db_error' });
  }

  // STEP 5: Lookup sourcer (if retailer was recruited by someone)
  const { data: retailerData } = await supabase
    .from('retailers')
    .select('recruited_by_sourcer_id')
    .eq('id', retailerId)
    .single();

  const sourcerId = retailerData?.recruited_by_sourcer_id;

  // STEP 6: Create payout job with multi-party splits
  if (retailerId) {
    const total = parseFloat(order.total_price);

    // Calculate splits
    // Phase 1: Retailer 20%, Vendor 80%, no sourcer/tapify cuts
    // Phase 2: Retailer 20%, Vendor 60%, Sourcer 10%, Tapify 10%
    const retailerCut = total * 0.20;
    const vendorCut = sourcerId ? total * 0.60 : total * 0.80;  // Lower if sourcer exists
    const sourcerCut = sourcerId ? total * 0.10 : 0;
    const tapifyCut = sourcerId ? total * 0.10 : 0;

    await supabase
      .from('payout_jobs')
      .insert([{
        order_id: orderRecord.id,
        retailer_id: retailerId,
        vendor_id: 'pawpaya-vendor-id',
        sourcer_id: sourcerId,  // Null in Phase 1, populated in Phase 2
        total_amount: total,
        retailer_cut: retailerCut,
        vendor_cut: vendorCut,
        sourcer_cut: sourcerCut,
        tapify_cut: tapifyCut,
        source_uid: uid,
        status: 'pending'
      }]);
  }

  // STEP 6: Update scan conversion
  if (uid) {
    await supabase
      .from('scans')
      .update({
        converted: true,
        revenue: parseFloat(order.total_price)
      })
      .eq('uid', uid)
      .eq('converted', false)
      .order('timestamp', { ascending: false })
      .limit(1);
  }

  // ALWAYS return 200 OK to Shopify
  return res.status(200).json({ received: true });
}
```

**Webhook Payload Example:**

```json
{
  "id": 123456789,
  "email": "customer@example.com",
  "total_price": "59.99",
  "line_items": [
    {
      "id": 987654321,
      "title": "Friendship Collar - Blue",
      "price": "49.99",
      "quantity": 1,
      "properties": []
    }
  ],
  "note_attributes": [
    {
      "name": "ref",
      "value": "ABC123"
    }
  ],
  "created_at": "2025-01-15T10:35:00-05:00"
}
```

---

### Integration Point 3: Product Sync (Phase 2 Preparation)

**Purpose:** Allow external vendors to connect their Shopify stores

**Shopify Metafields to Add:**

```javascript
// Product metafield namespace: "tapify"
{
  "vendor_id": "vendor-uuid-123",
  "vendor_name": "Handmade Collars Co.",
  "vendor_commission_rate": "0.60",
  "fulfillment_days": "2-3",
  "ships_from": "Austin, TX"
}
```

**Line Item Properties (Phase 2):**

```javascript
// Add to cart via JavaScript
fetch('/cart/add.js', {
  method: 'POST',
  body: JSON.stringify({
    items: [{
      id: variantId,
      quantity: 1,
      properties: {
        '_vendor_id': 'vendor-uuid',
        '_retailer_uid': 'ABC123'
      }
    }]
  })
});
```

---

## 🧪 TESTING & VALIDATION

### Local Development Setup

```bash
# 1. Start Next.js dev server
npm run dev

# 2. Start ngrok tunnel (for webhook testing)
ngrok http 3000

# 3. Update Shopify webhook URL
https://abc123.ngrok.io/api/shopify-webhook
```

### Test Checklist

#### Attribution Flow Test
```
1. Create test UID in Supabase:
   INSERT INTO uids (uid, is_claimed, affiliate_url)
   VALUES ('TEST123', true, 'https://pawpayaco.com/collections/all?ref=TEST123');

2. Visit: http://localhost:3000/t?u=TEST123
   Expected: 302 redirect to Shopify with ?ref=TEST123

3. On Shopify page, open browser console
   Expected: Log message "Retailer attribution captured: TEST123"

4. Add item to cart, view /cart.json
   Expected: "attributes": { "ref": "TEST123" }

5. Complete test checkout
   Expected: Webhook fires with note_attributes.ref = "TEST123"
```

#### Webhook Test

```bash
# Using Shopify CLI
shopify webhook trigger orders/create --address https://abc123.ngrok.io/api/shopify-webhook

# Expected response
✓ Webhook sent successfully
Response: 200 OK
```

#### Database Verification

```sql
-- After test order, check Supabase:
SELECT * FROM orders WHERE shopify_order_id = '123456789';
SELECT * FROM payout_jobs WHERE order_id = (
  SELECT id FROM orders WHERE shopify_order_id = '123456789'
);
SELECT * FROM scans WHERE converted = true ORDER BY timestamp DESC LIMIT 1;
```

---

## ✅ DEPLOYMENT CHECKLIST

### Before Going Live

- [ ] **Webhook endpoint deployed** to production Next.js app
- [ ] **HMAC validation** working correctly
- [ ] **Shopify webhook configured** with production URL
- [ ] **Attribution JavaScript** added to Shopify theme
- [ ] **Test order completed** end-to-end (NFC tap → purchase → payout job)
- [ ] **Environment variables** set in production (.env.production)
- [ ] **Database foreign keys** exist for orders → retailers
- [ ] **Error logging** implemented (Sentry, LogRocket, etc.)
- [ ] **Mobile performance** tested (<3s page load)
- [ ] **Cart abandonment recovery** enabled in Shopify
- [ ] **Analytics tracking** configured (Shopify Analytics + Supabase scans)

### Security Checklist

- [ ] **SHOPIFY_WEBHOOK_SECRET** stored securely (not in code)
- [ ] **HMAC validation** uses `crypto.timingSafeEqual()`
- [ ] **Supabase service role key** only used server-side
- [ ] **API routes** protected from CSRF attacks
- [ ] **Webhook endpoint** returns 200 OK even on internal errors (prevent Shopify retry spam)

---

## 📚 ADDITIONAL CONTEXT FILES

The main repo contains comprehensive documentation in `/context/`:

**Shopify-Specific:**
- `context/shopify/overview.md` - Integration architecture
- `context/shopify/flows.md` - Transaction flow sequences
- `context/shopify/integration_points.md` - API connection details
- `context/shopify/webhooks.md` - Webhook payload specifications
- `context/shopify/store_structure.md` - Collections, products, tagging
- `context/shopify/metafields.md` - Custom field definitions

**System-Wide:**
- `context/GAME_PLAN_2.0.md` - Business strategy and vision
- `context/CLAUDE.md` - Developer guidance and recent migration notes
- `context/data_model.md` - Database schema and relationships
- `context/README_CONTEXT.md` - Context directory overview

**Next.js Integration:**
- `context/nextjs/pages_api_summary.md` - API routes catalog
- `context/nextjs/shopify_integration.md` - Frontend Shopify connections
- `context/nextjs/db_calls_summary.md` - Supabase query patterns

**Database:**
- `context/supabase/tables_and_columns.md` - Full schema reference
- `context/supabase/foreign_keys.md` - Relationship documentation

---

## 🎯 SUCCESS CRITERIA

**You will have succeeded when:**

1. A customer can tap an NFC display in a retail store
2. Their phone opens the Shopify product page with retailer tracking
3. They complete checkout on mobile
4. Shopify webhook fires and syncs order to Supabase
5. A payout job is created with correct retailer + vendor commission splits
6. Admin can view pending payout in dashboard
7. Admin approves payout → Dwolla transfers funds to bank accounts
8. **All of this happens automatically without manual intervention**

**The entire Tapify business model depends on this integration working flawlessly.**

---

## 🚨 CRITICAL WARNINGS

### DO NOT:
- ❌ Skip HMAC validation (security vulnerability)
- ❌ Hardcode secrets in code (use environment variables)
- ❌ Return 4xx/5xx from webhook endpoint on business logic errors (causes Shopify retry spam)
- ❌ Modify Shopify checkout without testing mobile experience
- ❌ Delete or rename existing collections without checking Next.js API dependencies

### ALWAYS:
- ✅ Test attribution flow end-to-end before deploying
- ✅ Return 200 OK from webhook endpoint
- ✅ Log errors to external service (not just console)
- ✅ Use `crypto.timingSafeEqual()` for HMAC comparison
- ✅ Validate webhook payloads have required fields before processing

---

## 🤝 COMMUNICATION PROTOCOL

**If you encounter blockers:**

1. **Missing environment variables** → Check `.env.local` and production hosting platform
2. **Supabase schema mismatches** → Refer to `context/supabase/tables_and_columns.md`
3. **Unclear business logic** → Re-read `context/GAME_PLAN_2.0.md`
4. **Integration questions** → Check `context/shopify/` documentation first

**When making changes:**

1. Document all modifications
2. Test locally with ngrok before deploying
3. Verify database inserts in Supabase dashboard
4. Check Shopify webhook delivery logs

---

## 🎬 GETTING STARTED

### Immediate Next Steps

1. **Clone the repo** and install dependencies
   ```bash
   git clone [repo-url]
   cd tapify-marketplace
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add Shopify credentials
   ```

3. **Verify webhook endpoint exists**
   ```bash
   cat pages/api/shopify-webhook.js
   # If missing, implement from spec above
   ```

4. **Test NFC redirect flow**
   ```bash
   npm run dev
   curl http://localhost:3000/t?u=TEST123
   ```

5. **Set up ngrok for webhook testing**
   ```bash
   ngrok http 3000
   # Update Shopify webhook URL with ngrok URL
   ```

6. **Read all `/context/shopify/` documentation**
   - Understand the full integration architecture
   - Review transaction flows
   - Study webhook payload examples

---

## 📞 FINAL NOTES

**This is a real business with paying customers.** The Shopify integration is the revenue engine. Handle with care.

**Phase 1 is live.** Phase 2 is coming. Build with both in mind:
- Make it work perfectly for single-vendor (Pawpaya) first
- Architect for multi-vendor scalability second

**The user (Oscar) has built extensive context documentation.** Use it. Every file in `/context/` is there for a reason.

**Your success = Tapify's success.** When this integration works flawlessly, retailers earn passive income, vendors reach new customers, and Tapify becomes a self-propagating marketplace.

**Let's build something great.**

---

*Document Version: 1.0*
*Last Updated: 2025-10-05*
*Generated for: AI Coding Agent (Shopify Integration)*
