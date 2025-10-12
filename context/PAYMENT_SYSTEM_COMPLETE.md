# PAYMENT_SYSTEM_COMPLETE.md

## 1. System Overview

### High-Level Architecture

The Tapify marketplace payment system is a multi-party commission distribution platform that automates revenue sharing between vendors, retailers, sourcers, and the platform itself. The system processes orders from Shopify webhooks, calculates commission splits, and executes ACH bank transfers via Dwolla.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TAPIFY PAYMENT ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────┘

Customer Purchase (Shopify) → Shopify Webhook → Tapify API
         │
         ├─→ Order Processing (/api/shopify-webhook.js)
         │   ├─→ Extract UID from order attributes
         │   ├─→ Lookup retailer (via UID or email)
         │   ├─→ Detect Priority Display product
         │   ├─→ Insert order into Supabase
         │   └─→ Create payout_job with commission splits
         │
         ├─→ Commission Calculation (configurable per vendor)
         │   ├─→ Phase 1 (No Sourcer): Retailer 20%, Vendor 80%
         │   └─→ Phase 2 (With Sourcer): Retailer 20%, Vendor 60%,
         │                                 Sourcer 10%, Tapify 10%
         │
         └─→ Payout Processing (/api/payout.js) - Admin Triggered
             ├─→ Authenticate with Dwolla (OAuth2 token)
             ├─→ Fetch funding source IDs from Supabase
             ├─→ Execute ACH transfers (retailer, sourcer)
             ├─→ Vendor cut stays in master account
             └─→ Update payout_job status → 'paid'

┌─────────────────────────────────────────────────────────────────────┐
│  Bank Account Integration: Plaid → Dwolla                          │
├─────────────────────────────────────────────────────────────────────┤
│  User connects bank → Plaid Link → Exchange public_token →         │
│  Create Dwolla processor token → Create Dwolla customer →          │
│  Attach funding source → Store IDs in Supabase                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Shopify Webhook** | Order intake, UID extraction | Next.js API Routes |
| **Commission Engine** | Calculate splits per vendor config | PostgreSQL + JavaScript |
| **Payout Executor** | ACH transfer orchestration | Dwolla API |
| **Bank Connection** | Secure account verification | Plaid Link |
| **Payment Storage** | Transaction history & state | Supabase (PostgreSQL) |
| **Admin Dashboard** | Manual payout triggers | React + Framer Motion |
| **Retailer Dashboard** | Earnings visibility | React + Framer Motion |

---

## 2. Data Flow: Shopify Order → Payout Complete

### Step-by-Step Process

#### **Phase 1: Order Reception** (`/pages/api/shopify-webhook.js`)

```
1. Shopify sends POST to /api/shopify-webhook
   Headers: x-shopify-hmac-sha256 (HMAC signature)
   Body: Full Shopify order JSON payload

2. Webhook Handler Validates Request
   - Verify HMAC signature using SHOPIFY_WEBHOOK_SECRET
   - Reject if signature invalid (lines 142-157)

3. Extract UID (Unique Display ID)
   Priority order:
   a) note_attributes.ref (cart attribute via theme) [lines 167-171]
   b) order.attributes.ref (alternative format) [lines 174-177]
   c) landing_site_ref (Shopify tracking) [lines 180-183]
   d) landing_site URL ?ref parameter [lines 186-197]
   e) referring_site URL ?ref parameter [lines 200-211]

4. UID Lookup Logic
   - Standard UID format: Query uids table [lines 249-268]
   - retailer-{id} format: Direct retailer lookup [lines 227-246]
   - Email fallback: Match customer email to retailers.email [lines 275-297]

5. Detect Priority Display Product
   - Search line_items for "priority display" or "priority placement" [lines 302-307]
   - Used to set payout_job.status = 'priority_display' vs 'pending'

6. Create Order Record
   - Insert into orders table with normalized data [lines 309-369]
   - Handles updates for duplicate shopify_order_id [lines 345-352]

7. Update Retailer Priority Flag (if Priority Display detected)
   - Set retailers.priority_display_active = true [lines 372-384]

8. Create Payout Job (if retailer_id exists)
   - Call createPayoutJob() with commission calculation [lines 387-408]
   - Skip if no retailer attribution
```

#### **Phase 2: Commission Calculation** (`createPayoutJob` function, lines 63-127)

```sql
-- Lookup retailer sourcer relationship
SELECT recruited_by_sourcer_id
FROM retailers
WHERE id = {retailer_id}

-- Fetch vendor commission configuration
SELECT
  retailer_commission_percent,  -- Default: 20
  sourcer_commission_percent,   -- Default: 10 (if sourcer exists)
  tapify_commission_percent,    -- Default: 10 (if sourcer exists)
  vendor_commission_percent     -- Default: 60 (with sourcer) or 80 (no sourcer)
FROM vendors
WHERE id = {vendor_id}

-- Calculate dollar amounts (lines 102-105)
retailer_cut = total * (retailer_commission_percent / 100)
sourcer_cut = total * (sourcer_commission_percent / 100)  -- if sourcer exists
tapify_cut = total * (tapify_commission_percent / 100)    -- if sourcer exists
vendor_cut = total * (vendor_commission_percent / 100)

-- Insert payout job
INSERT INTO payout_jobs (
  order_id,
  retailer_id,
  vendor_id,
  sourcer_id,        -- NULL if no sourcer
  retailer_cut,
  vendor_cut,
  sourcer_cut,
  tapify_cut,
  total_amount,
  status,            -- 'pending' or 'priority_display'
  source_uid
) VALUES (...)
```

**Commission Logic Examples:**

| Scenario | Total | Retailer | Vendor | Sourcer | Tapify |
|----------|-------|----------|--------|---------|--------|
| **No Sourcer** (Phase 1) | $100 | $20 (20%) | $80 (80%) | $0 | $0 |
| **With Sourcer** (Phase 2) | $100 | $20 (20%) | $60 (60%) | $10 (10%) | $10 (10%) |
| **Custom Config** | $100 | $25 (25%) | $50 (50%) | $15 (15%) | $10 (10%) |

#### **Phase 3: Admin Payout Processing** (`/pages/api/payout.js`)

```
1. Admin Clicks "Pay" Button in Dashboard (/pages/admin.js)
   - Triggers POST /api/payout with { payoutJobId }
   - Admin authentication required (lines 101-102)

2. Fetch Payout Job from Supabase (lines 110-121)
   - Verify status = 'pending' (not already paid)
   - Reject if status ≠ 'pending'

3. Fetch Bank Account Funding Sources (lines 124-147)
   - retailer_accounts.dwolla_funding_source_id
   - sourcer_accounts.dwolla_funding_source_id (if sourcer_id exists)
   - Vendor cut does NOT require transfer (stays in master)

4. Validate Funding Sources Exist (lines 140-147)
   - Error if retailer_cut > 0 but no funding source
   - Error if sourcer_cut > 0 but no funding source
   - Vendor account not required (vendor cut retained)

5. Get Dwolla OAuth Token (lines 162-163)
   - POST {DWOLLA_ENV}/token with client credentials
   - Token valid for 1 hour

6. Execute ACH Transfers (lines 166-199)
   Transfer 1 (Vendor): NO TRANSFER - amount stays in master
   Transfer 2 (Retailer): Master → Retailer bank
   Transfer 3 (Sourcer): Master → Sourcer bank (if exists)

7. Record Payout Summary (lines 201-242)
   - Insert into payouts table with transfer_summary JSON
   - Log transfer IDs for reconciliation

8. Update Payout Job Status (lines 249-256)
   - Set status = 'paid'
   - Set date_paid = now()
   - Store transfer_ids array

9. Log Event for Audit Trail (lines 258-261)
   - Log to logs table with admin user ID
```

#### **Phase 4: ACH Transfer Execution** (`createDwollaTransfer`, lines 30-87)

```javascript
// Dwolla Transfer Request
POST {DWOLLA_ENV}/transfers
Authorization: Bearer {dwolla_token}
Content-Type: application/json

{
  "_links": {
    "source": {
      "href": "{DWOLLA_ENV}/funding-sources/{DWOLLA_MASTER_FUNDING_SOURCE}"
    },
    "destination": {
      "href": "{DWOLLA_ENV}/funding-sources/{recipient_funding_source_id}"
    }
  },
  "amount": {
    "currency": "USD",
    "value": "42.50"  // retailer_cut or sourcer_cut
  }
}

// Dwolla Response (HTTP 201)
Location: {DWOLLA_ENV}/transfers/{transfer-id}

// Transfer Status Progression
pending → processed → completed (1-3 business days)
```

---

## 3. Database Schema

### Payment-Related Tables

#### **orders**

Stores all orders received from Shopify webhooks.

| Column | Type | Description | Default | Status |
|--------|------|-------------|---------|--------|
| `id` | uuid | Primary key | uuid_generate_v4() | ✅ EXISTS |
| `shopify_order_id` | text | Shopify order ID (unique) | NULL | ✅ EXISTS |
| `shopify_order_number` | text | Human-readable order number | NULL | ✅ EXISTS |
| `shop_domain` | text | Shopify store domain | NULL | ✅ EXISTS |
| `customer_email` | text | Customer email | NULL | ✅ EXISTS |
| `customer_name` | text | Customer name | NULL | ✅ EXISTS |
| `retailer_id` | uuid | FK to retailers (SET NULL) | NULL | ✅ EXISTS |
| `vendor_id` | uuid | FK to vendors (SET NULL) | NULL | ✅ EXISTS |
| `business_id` | uuid | FK to businesses (SET NULL) | NULL | ✅ EXISTS |
| `currency` | text | Order currency | 'USD' | ✅ EXISTS |
| `total` | numeric | Order total (for commission) | 0 | ✅ EXISTS |
| `subtotal` | numeric | Subtotal before tax | 0 | ✅ EXISTS |
| `tax_total` | numeric | Tax amount | 0 | ✅ EXISTS |
| `discount_total` | numeric | Discounts applied | 0 | ✅ EXISTS |
| `financial_status` | text | Payment status | NULL | ✅ EXISTS |
| `fulfillment_status` | text | Shipping status | NULL | ✅ EXISTS |
| `processed_at` | timestamptz | Order creation time | NULL | ✅ EXISTS |
| `source_uid` | text | NFC UID that generated sale | NULL | ✅ EXISTS |
| `line_items` | jsonb | Order line items array | '[]' | ✅ EXISTS |
| `raw_payload` | jsonb | Full Shopify webhook payload | NULL | ✅ EXISTS |
| `created_at` | timestamptz | Record creation time | now() | ✅ EXISTS |
| **`is_priority_display`** | **boolean** | **Priority Display purchased** | **false** | **❌ MISSING** |

**🚨 CRITICAL ISSUE #3:** `is_priority_display` column **DOES NOT EXIST**. Cannot query or filter Priority Display orders. Priority Display orders are identified only by `payout_jobs.status = 'priority_display'`.

**Indexes:**
- ✅ `idx_orders_retailer_processed_at` on `(retailer_id, processed_at DESC)` - EXISTS
- ❌ `idx_orders_is_priority_display` - MISSING (column doesn't exist)

**Key Relationships:**
- `retailer_id` → `retailers.id` (ON DELETE SET NULL) ✅
- `vendor_id` → `vendors.id` (ON DELETE SET NULL) ✅
- `business_id` → `businesses.id` (ON DELETE SET NULL) ✅

---

#### **payout_jobs**

Defines commission splits and payout status for each order.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | uuid | Primary key | Auto-generated |
| `order_id` | uuid | FK to orders | Linked order |
| `retailer_id` | uuid | FK to retailers | From order |
| `vendor_id` | uuid | FK to vendors | From order |
| `sourcer_id` | uuid | FK to sourcer_accounts | From retailer lookup |
| `total_amount` | numeric | Order total | `orders.total` |
| `retailer_cut` | numeric | Retailer commission $ | Calculated |
| `vendor_cut` | numeric | Vendor commission $ | Calculated |
| `sourcer_cut` | numeric | Sourcer commission $ | Calculated (0 if no sourcer) |
| `tapify_cut` | numeric | Platform fee $ | Calculated (0 if no sourcer) |
| `status` | text | Payment status | `'pending'` or `'priority_display'` → `'paid'` |
| `date_paid` | timestamptz | Payout execution time | Set when admin triggers payout |
| `source_uid` | text | Originating NFC UID | From order |
| `transfer_ids` | jsonb | Dwolla transfer ID array | Set during payout |
| `created_at` | timestamptz | Record creation time | Auto |

**Indexes:**
- `idx_payout_jobs_vendor` on `(vendor_id)`

**Key Relationships:**
- `order_id` → `orders.id` (ON DELETE SET NULL)
- `retailer_id` → `retailers.id` (implicit)
- `vendor_id` → `vendors.id` (implicit)
- `sourcer_id` → `sourcer_accounts.id` (implicit)

**Status Values:**
- `pending` - Awaiting admin approval
- `priority_display` - Priority Display product order (special handling)
- `paid` - Payout completed

---

#### **payouts**

Audit log of executed payouts with Dwolla transfer details.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | uuid | Primary key | Auto-generated |
| `payout_job_id` | uuid | FK to payout_jobs | Linked job |
| `retailer_id` | uuid | FK to retailers | From job |
| `vendor_id` | uuid | FK to vendors | From job |
| `sourcer_id` | uuid | FK to sourcer_accounts | From job (nullable) |
| `amount` | numeric | Total payout amount | Sum of all cuts |
| `total_amount` | numeric | Legacy total field | Same as amount |
| `status` | text | Payout status | `'pending'`, `'paid'`, or `'failed'` |
| `transfer_summary` | jsonb | Dwolla transfer details | Array of transfer objects |
| `triggered_by` | uuid | Admin user ID | From auth session |
| `payout_date` | timestamptz | Legacy date field | Deprecated |
| `created_at` | timestamptz | Record creation time | Auto |

**transfer_summary Structure:**
```json
[
  {
    "role": "vendor",
    "id": null,
    "status": "retained_in_master_account",
    "href": null,
    "amount": 80.00,
    "note": "Vendor portion kept in business account"
  },
  {
    "role": "retailer",
    "id": "transfer-abc123",
    "status": "pending",
    "href": "https://api-sandbox.dwolla.com/transfers/transfer-abc123",
    "amount": 20.00
  },
  {
    "role": "sourcer",
    "id": "transfer-def456",
    "status": "pending",
    "href": "https://api-sandbox.dwolla.com/transfers/transfer-def456",
    "amount": 10.00
  }
]
```

**Key Relationships:**
- `payout_job_id` → `payout_jobs.id` (ON DELETE SET NULL)

---

#### **retailer_accounts**

Stores Plaid and Dwolla credentials for retailer bank accounts.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | uuid | Primary key | Auto-generated |
| `retailer_id` | uuid | FK to retailers | Linked retailer |
| `plaid_access_token` | text | Plaid access token | Plaid token exchange |
| `dwolla_customer_id` | text | Dwolla customer ID | Dwolla customer creation |
| `dwolla_funding_source_id` | text | Dwolla bank account ID | Dwolla funding source |
| `created_at` | timestamptz | Record creation time | Auto |

**Security Notes:**
- `plaid_access_token` should be encrypted at rest (currently plain text - **SECURITY RISK**)
- Never expose these tokens to browser/frontend

---

#### **sourcer_accounts**

Stores Plaid and Dwolla credentials for sourcer bank accounts (Phase 2).

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `id` | uuid | Primary key | Auto-generated |
| `name` | text | Sourcer name | User input |
| `email` | text | Sourcer email | User input |
| `plaid_access_token` | text | Plaid access token | Plaid token exchange |
| `dwolla_customer_id` | text | Dwolla customer ID | Dwolla customer creation |
| `dwolla_funding_source_id` | text | Dwolla bank account ID | Dwolla funding source |
| `created_at` | timestamptz | Record creation time | Auto |

---

#### **vendors**

Vendor profiles with configurable commission percentages.

| Column | Type | Description | Default | Status |
|--------|------|-------------|---------|--------|
| `id` | uuid | Primary key | gen_random_uuid() | ✅ EXISTS |
| `name` | text | Vendor name | Required | ✅ EXISTS |
| `email` | text | Vendor email | Required | ✅ EXISTS |
| `store_type` | text | Store type (Etsy, Shopify) | NULL | ✅ EXISTS |
| `website_url` | text | Vendor website | NULL | ✅ EXISTS |
| `platform_url` | text | Store platform URL | NULL | ✅ EXISTS |
| `fulfillment_speed` | text | Shipping speed | NULL | ✅ EXISTS |
| `inventory_cap` | integer | Maximum inventory | NULL | ✅ EXISTS |
| `collection_name` | text | Product collection name | NULL | ✅ EXISTS |
| `product_photo_url` | text | Product image URL | NULL | ✅ EXISTS |
| `onboarded_by` | uuid | FK to sourcer_accounts | NULL | ✅ EXISTS |
| `created_by_user_id` | uuid | FK to auth.users | NULL | ✅ EXISTS (no FK constraint) |
| `created_at` | timestamptz | Record creation time | now() | ✅ EXISTS |
| **`retailer_commission_percent`** | **numeric** | **Retailer commission %** | **20** | **❌ MISSING** |
| **`sourcer_commission_percent`** | **numeric** | **Sourcer commission %** | **10** | **❌ MISSING** |
| **`tapify_commission_percent`** | **numeric** | **Platform fee %** | **10** | **❌ MISSING** |
| **`vendor_commission_percent`** | **numeric** | **Vendor commission %** | **60/80** | **❌ MISSING** |

**🚨 CRITICAL ISSUE #1:** Commission columns **DO NOT EXIST** in actual database. Code at `/pages/api/shopify-webhook.js:79-83` queries these columns but they are missing from schema. All commission calculations fall back to hardcoded defaults.

---

#### **retailers**

Retailer profiles with sourcer relationship and Priority Display status.

| Column | Type | Description | Default | Status |
|--------|------|-------------|---------|--------|
| `id` | uuid | Primary key | gen_random_uuid() | ✅ EXISTS |
| `name` | text | Retailer business name | Required | ✅ EXISTS |
| `email` | text | Retailer email | NULL | ✅ EXISTS |
| `linked_vendor_id` | uuid | FK to vendors | NULL | ✅ EXISTS |
| `business_id` | uuid | FK to businesses | NULL | ✅ EXISTS |
| `location` | text | **DEPRECATED** - use `address` | NULL | ✅ EXISTS |
| `address` | text | Full street address | NULL | ✅ EXISTS |
| `lat` | numeric | Latitude | NULL | ✅ EXISTS |
| `lng` | numeric | Longitude | NULL | ✅ EXISTS |
| `place_id` | text | Google Places ID | NULL | ✅ EXISTS |
| `store_phone` | text | **DEPRECATED** - use `phone` | NULL | ✅ EXISTS |
| `store_website` | text | Retailer website | NULL | ✅ EXISTS |
| `phone` | text | Contact phone | NULL | ✅ EXISTS |
| `owner_name` | text | Owner name | NULL | ✅ EXISTS |
| `manager_name` | text | Manager name | NULL | ✅ EXISTS |
| `source` | text | Lead source | NULL | ✅ EXISTS |
| `cold_email_sent` | boolean | **DEPRECATED** | false | ✅ EXISTS |
| `cold_email_sent_at` | timestamptz | **DEPRECATED** | NULL | ✅ EXISTS |
| `converted` | boolean | Registration completed | false | ✅ EXISTS |
| `converted_at` | timestamptz | Conversion timestamp | NULL | ✅ EXISTS |
| `onboarding_completed` | boolean | **DEPRECATED** - use `converted` | false | ✅ EXISTS |
| `onboarding_step` | text | Current onboarding step | NULL | ✅ EXISTS |
| `express_shipping` | boolean | Express shipping enabled | false | ✅ EXISTS |
| `outreach_notes` | text | Outreach notes | NULL | ✅ EXISTS |
| `created_by_user_id` | uuid | Should FK to auth.users | NULL | ✅ EXISTS (no FK constraint) |
| `recruited_by_sourcer_id` | uuid | Should FK to sourcer_accounts | NULL | ✅ EXISTS (no FK constraint) |
| `created_at` | timestamptz | Record creation time | now() | ✅ EXISTS |
| **`priority_display_active`** | **boolean** | **Has active Priority Display** | **false** | **❌ MISSING** |

**🚨 CRITICAL ISSUE #2:** `priority_display_active` column **DOES NOT EXIST**. Code at `/pages/api/shopify-webhook.js:372-384` attempts to update this column when Priority Display products are purchased. Priority Display tracking is broken.

**⚠️ Missing FK Constraints:**
- `created_by_user_id` → `auth.users(id)` (no constraint defined)
- `recruited_by_sourcer_id` → `sourcer_accounts(id)` (no constraint defined)

---

#### **uids**

NFC display IDs assigned to retailers for tracking scans and orders.

| Column | Type | Description | Source |
|--------|------|-------------|--------|
| `uid` | text | Primary key - unique NFC ID | Pre-generated |
| `retailer_id` | uuid | FK to retailers | Claimed by retailer |
| `business_id` | uuid | FK to businesses | Business location |
| `affiliate_url` | text | Shopify URL with ?ref={uid} | Generated |
| `is_claimed` | boolean | UID claimed by retailer | User action |
| `claimed_at` | timestamptz | Claim timestamp | User action |
| `claimed_by_user_id` | uuid | FK to auth.users | User who claimed |
| `last_order_at` | timestamptz | Most recent order | Updated by webhook |
| `last_order_total` | numeric | Most recent order $ | Updated by webhook |
| `scan_count` | integer | Total scans | Incremented by scan API |
| `registered_at` | timestamptz | Initial creation time | Auto |

**Key Relationships:**
- `retailer_id` → `retailers.id` (ON DELETE SET NULL)
- `business_id` → `businesses.id` (ON DELETE SET NULL)

---

## 4. Critical Issues Found

### 🚨 CRITICAL ISSUES (Confirmed Against Actual Database)

#### **1. Commission Columns Missing in vendors Table**

**Status:** ❌ **CONFIRMED - DOES NOT EXIST**

**Location:** `/pages/api/shopify-webhook.js:79-83`

**Issue:** Code queries vendor commission columns that **DO NOT EXIST** in database:
```javascript
const { data: vendor } = await supabaseAdmin
  .from('vendors')
  .select('retailer_commission_percent, sourcer_commission_percent, tapify_commission_percent, vendor_commission_percent')
```

**Database Reality:**
- ❌ `vendors.retailer_commission_percent` - **MISSING**
- ❌ `vendors.sourcer_commission_percent` - **MISSING**
- ❌ `vendors.tapify_commission_percent` - **MISSING**
- ❌ `vendors.vendor_commission_percent` - **MISSING**

**Impact:**
- All commissions use hardcoded fallback defaults (20%, 10%, 10%, 60%)
- Custom vendor commission rates **IMPOSSIBLE** to configure
- Admin UI commission settings modal cannot save changes

**Fix:**
```sql
ALTER TABLE vendors
  ADD COLUMN retailer_commission_percent numeric DEFAULT 20,
  ADD COLUMN sourcer_commission_percent numeric DEFAULT 10,
  ADD COLUMN tapify_commission_percent numeric DEFAULT 10,
  ADD COLUMN vendor_commission_percent numeric DEFAULT 60;
```

---

#### **2. priority_display_active Column Missing in retailers Table**

**Status:** ❌ **CONFIRMED - DOES NOT EXIST**

**Location:** `/pages/api/shopify-webhook.js:372-384`

**Issue:** Code attempts to update column that **DOES NOT EXIST**:
```javascript
await supabaseAdmin
  .from('retailers')
  .update({ priority_display_active: true })
  .eq('id', retailerId);
```

**Database Reality:**
- ❌ `retailers.priority_display_active` - **MISSING**

**Impact:**
- Priority Display product purchases fail to update retailer status
- Cannot track which retailers have active Priority Display subscriptions
- Webhook updates fail silently
- Cannot query retailers by Priority Display status

**Fix:**
```sql
ALTER TABLE retailers
  ADD COLUMN priority_display_active boolean DEFAULT false;

CREATE INDEX idx_retailers_priority_display_active
  ON retailers (priority_display_active)
  WHERE priority_display_active = TRUE;
```

---

#### **3. is_priority_display Column Missing in orders Table**

**Status:** ❌ **CONFIRMED - DOES NOT EXIST**

**Location:** Documentation references this column but it doesn't exist in database

**Database Reality:**
- ❌ `orders.is_priority_display` - **MISSING**

**Impact:**
- Cannot query or filter Priority Display orders directly
- Priority Display orders identified only via `payout_jobs.status = 'priority_display'` (indirect)
- Analytics and reporting impossible for Priority Display sales
- Missing index means slow queries

**Fix:**
```sql
ALTER TABLE orders
  ADD COLUMN is_priority_display boolean DEFAULT false;

CREATE INDEX idx_orders_is_priority_display
  ON orders (is_priority_display)
  WHERE is_priority_display = TRUE;

-- Backfill existing data
UPDATE orders o
SET is_priority_display = true
WHERE EXISTS (
  SELECT 1 FROM payout_jobs pj
  WHERE pj.order_id = o.id
  AND pj.status = 'priority_display'
);
```

---

#### **4. Plaid Access Tokens Stored Unencrypted**

**Status:** 🔥 **CRITICAL SECURITY VULNERABILITY - CONFIRMED**

**Location:**
- `retailer_accounts.plaid_access_token` (type: `text` - plain text)
- `sourcer_accounts.plaid_access_token` (type: `text` - plain text)

**Issue:** Sensitive bank credentials stored in plain text

**Database Reality:**
- ✅ `retailer_accounts.plaid_access_token` - EXISTS as **unencrypted text**
- ✅ `sourcer_accounts.plaid_access_token` - EXISTS as **unencrypted text**

**Impact:**
- **CRITICAL SECURITY RISK** - Anyone with database access can steal bank credentials
- Violates PCI/SOC2 security standards
- Potential compliance violations (GDPR, PCI-DSS)
- Service role key exposure = all tokens compromised

**Fix:** Implement encryption via Supabase Vault:
```sql
-- Option 1: Supabase Vault (recommended)
ALTER TABLE retailer_accounts
  ALTER COLUMN plaid_access_token TYPE uuid USING NULL;
-- Store actual token in vault, reference by key_id

-- Option 2: pgcrypto
ALTER TABLE retailer_accounts
  ALTER COLUMN plaid_access_token TYPE bytea
  USING pgp_sym_encrypt(plaid_access_token, current_setting('app.settings.encryption_key'));
```

---

#### **5. Missing Foreign Key Constraints to auth.users**

**Status:** ❌ **CONFIRMED - NO FK CONSTRAINTS**

**Issue:** Multiple user_id columns reference `auth.users` without FK constraints

**Database Reality:**
- ❌ `retailers.created_by_user_id` → `auth.users(id)` - **NO CONSTRAINT**
- ❌ `retailers.recruited_by_sourcer_id` → `sourcer_accounts(id)` - **NO CONSTRAINT**
- ❌ `vendors.created_by_user_id` → `auth.users(id)` - **NO CONSTRAINT**
- ❌ `uids.claimed_by_user_id` → `auth.users(id)` - **NO CONSTRAINT**
- ❌ `payouts.triggered_by` → `auth.users(id)` - **NO CONSTRAINT**

**Impact:**
- Orphaned records possible if users deleted from `auth.users`
- No referential integrity for user relationships
- Cannot cascade deletes properly
- Data integrity issues

**Fix:**
```sql
ALTER TABLE retailers
  ADD CONSTRAINT retailers_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE retailers
  ADD CONSTRAINT retailers_recruited_by_sourcer_id_fkey
    FOREIGN KEY (recruited_by_sourcer_id) REFERENCES sourcer_accounts(id) ON DELETE SET NULL;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE uids
  ADD CONSTRAINT uids_claimed_by_user_id_fkey
    FOREIGN KEY (claimed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE payouts
  ADD CONSTRAINT payouts_triggered_by_fkey
    FOREIGN KEY (triggered_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

#### **6. Rounding Errors in Commission Calculation**

**Status:** ⚠️ **LOGIC BUG - CONFIRMED IN CODE**

**Location:** `/pages/api/shopify-webhook.js:102-105`

**Issue:** Independent rounding causes penny discrepancies
```javascript
const retailerCut = Number((total * (retailerPercent / 100)).toFixed(2));
const vendorCut = Number((total * (vendorPercent / 100)).toFixed(2));
const sourcerCut = Number((total * (sourcerPercent / 100)).toFixed(2));
// Sum may not equal total due to rounding
```

**Impact:** Penny discrepancies accumulate over time (cents lost per transaction)

**Fix:** Calculate vendor cut as remainder:
```javascript
const retailerCut = Number((total * (retailerPercent / 100)).toFixed(2));
const sourcerCut = sourcerId ? Number((total * (sourcerPercent / 100)).toFixed(2)) : 0;
const tapifyCut = sourcerId ? Number((total * (tapifyPercent / 100)).toFixed(2)) : 0;
const vendorCut = Number((total - retailerCut - sourcerCut - tapifyCut).toFixed(2));
```

---

#### **7. No Dwolla Transfer Status Tracking**

**Status:** ⚠️ **MISSING WEBHOOK INTEGRATION**

**Location:** Payout flow lacks Dwolla webhook handler

**Issue:** Transfers marked as 'paid' immediately but actual ACH can fail silently

**Impact:**
- False positive payouts - retailers think they're paid but funds never arrive
- No way to detect failed transfers
- No retry mechanism for failed transfers
- Customer support nightmare when transfers fail

**Fix:** Implement Dwolla webhook handler:
```javascript
// /pages/api/dwolla-webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { topic, resourceId } = req.body;

  if (topic === 'transfer_failed') {
    await supabaseAdmin
      .from('payout_jobs')
      .update({ status: 'failed' })
      .eq('transfer_ids', 'cs', `["${resourceId}"]`);
  }

  if (topic === 'transfer_completed') {
    // Optionally update to mark as truly completed
  }

  res.status(200).json({ received: true });
}
```

---

#### **8. Priority Display Orders Cannot Be Paid**

**Status:** ❌ **CONFIRMED - PAYOUT BLOCKED**

**Location:** `/pages/api/payout.js:119`

**Issue:** Payout API only processes `status='pending'` but Priority Display orders have `status='priority_display'`

**Code:**
```javascript
const { data: job } = await supabaseAdmin
  .from('payout_jobs')
  .select('*')
  .eq('id', payoutJobId)
  .single();

if (job.status !== 'pending') {
  return res.status(400).json({ error: 'Payout already processed' });
}
```

**Impact:**
- Priority Display purchases create payout jobs that **NEVER EXECUTE**
- Retailers never get paid for Priority Display sales
- Admin cannot pay Priority Display orders without manual DB updates

**Fix:** Update payout query to include Priority Display status:
```javascript
if (!['pending', 'priority_display'].includes(job.status)) {
  return res.status(400).json({ error: 'Payout already processed' });
}
```

---

## 5. Environment Variables

### Required Configuration

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Plaid
PLAID_CLIENT_ID=your-client-id
PLAID_SECRET=your-secret
PLAID_ENV=sandbox  # sandbox | development | production

# Dwolla
DWOLLA_ENV=https://api-sandbox.dwolla.com  # or https://api.dwolla.com
DWOLLA_KEY=your-dwolla-key
DWOLLA_SECRET=your-dwolla-secret
DWOLLA_MASTER_FUNDING_SOURCE=funding-source-id-xxx  # Your business bank

# Shopify
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 6. Key API Endpoints

### **POST /api/shopify-webhook**
- Receives Shopify order webhooks
- Extracts UID from 5 different sources
- Creates orders and payout_jobs
- **File:** `/pages/api/shopify-webhook.js`

### **POST /api/payout**
- Executes Dwolla ACH transfers
- Requires admin authentication
- Updates payout_jobs to 'paid'
- **File:** `/pages/api/payout.js`

### **GET /api/admin/retailer-payouts**
- Aggregates payout data by retailer
- Filters by status (pending/paid/all)
- **File:** `/pages/api/admin/retailer-payouts.js`

### **GET /api/retailer-earnings**
- Returns earnings for logged-in retailer
- Calculates pending vs paid totals
- **File:** `/pages/api/retailer-earnings.js`

---

## 7. UI Components

### **Admin Dashboard** (`/pages/admin.js`)
- Payouts tab with retailer grouping
- Individual + batch payout processing
- Uses `RetailerPayoutRow` component

### **RetailerPayoutRow** (`/components/RetailerPayoutRow.jsx`)
- Expandable row per retailer
- Shows UIDs, payouts, summary stats
- "Pay All" button for batch processing

### **Retailer Dashboard** (`/pages/onboard/dashboard.js`)
- Earnings overview
- Payout history
- Bank account connection via Plaid

---

## 8. Production Readiness Checklist

### 🚨 Critical Blockers (Must Fix Before Production)

- [ ] **Issue #1:** Add commission columns to vendors table
  ```sql
  ALTER TABLE vendors
    ADD COLUMN retailer_commission_percent numeric DEFAULT 20,
    ADD COLUMN sourcer_commission_percent numeric DEFAULT 10,
    ADD COLUMN tapify_commission_percent numeric DEFAULT 10,
    ADD COLUMN vendor_commission_percent numeric DEFAULT 60;
  ```

- [ ] **Issue #2:** Add `priority_display_active` to retailers table
  ```sql
  ALTER TABLE retailers ADD COLUMN priority_display_active boolean DEFAULT false;
  CREATE INDEX idx_retailers_priority_display_active ON retailers (priority_display_active) WHERE priority_display_active = TRUE;
  ```

- [ ] **Issue #3:** Add `is_priority_display` to orders table
  ```sql
  ALTER TABLE orders ADD COLUMN is_priority_display boolean DEFAULT false;
  CREATE INDEX idx_orders_is_priority_display ON orders (is_priority_display) WHERE is_priority_display = TRUE;
  ```

- [ ] **Issue #4:** 🔥 Encrypt Plaid access tokens (SECURITY CRITICAL)
  - Implement Supabase Vault or pgcrypto encryption
  - Migrate existing tokens to encrypted storage
  - Update all API routes to encrypt/decrypt tokens

- [ ] **Issue #5:** Add missing Foreign Key constraints
  ```sql
  ALTER TABLE retailers ADD CONSTRAINT retailers_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE retailers ADD CONSTRAINT retailers_recruited_by_sourcer_id_fkey FOREIGN KEY (recruited_by_sourcer_id) REFERENCES sourcer_accounts(id) ON DELETE SET NULL;
  ALTER TABLE vendors ADD CONSTRAINT vendors_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE uids ADD CONSTRAINT uids_claimed_by_user_id_fkey FOREIGN KEY (claimed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  ALTER TABLE payouts ADD CONSTRAINT payouts_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  ```

- [ ] **Issue #6:** Fix rounding error in commission calculation
  - Update `/pages/api/shopify-webhook.js:102-105`
  - Calculate vendor cut as remainder instead of independent rounding

- [ ] **Issue #7:** Implement Dwolla webhook handler
  - Create `/pages/api/dwolla-webhook.js`
  - Handle `transfer_failed` and `transfer_completed` events
  - Update payout_jobs status based on transfer status

- [ ] **Issue #8:** Fix Priority Display payout handling
  - Update `/pages/api/payout.js:119` to accept `'priority_display'` status
  - Change: `if (job.status !== 'pending')` → `if (!['pending', 'priority_display'].includes(job.status))`

### ⚠️ High Priority (Before Scaling)

- [ ] Add pagination to admin payout list (performance issue with >100 retailers)
- [ ] Set up error monitoring (Sentry or similar)
- [ ] Add retry logic for failed Dwolla transfers
- [ ] Implement admin notification for failed payouts
- [ ] Add RLS policies review and testing
- [ ] Remove deprecated columns after data verification:
  - `retailers.location`, `retailers.store_phone`, `retailers.onboarding_completed`
  - `retailers.cold_email_sent`, `retailers.cold_email_sent_at`

### 📋 Pre-Launch

- [ ] Configure production Dwolla credentials
- [ ] Configure production Plaid credentials
- [ ] Test end-to-end payout flow in production
- [ ] Verify Dwolla webhook URL configured in dashboard
- [ ] Verify Shopify webhook URL configured in store settings
- [ ] Run load testing on payout processing
- [ ] Backup database before launch
- [ ] Create runbook for common payout issues

### 📊 Post-Launch Monitoring

- [ ] Monitor Dwolla transfer failure rates
- [ ] Monitor commission calculation accuracy
- [ ] Monitor Priority Display order processing
- [ ] Set up alerts for failed payouts
- [ ] Weekly review of payout_jobs stuck in 'pending' status

---

**Last Updated:** 2025-10-11
**Version:** 2.0 (Schema-Verified)
**Audit Performed By:** Claude Code AI Agent
**Database Source:** `full_dump.sql` (October 11, 2025)
