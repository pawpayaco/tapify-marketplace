# = Next.js API Routes Summary

Documents all server-side API endpoints that connect Tapify's frontend to Supabase, Shopify, Dwolla, and Plaid.

---

## =¡ Purpose
This file maps every API route in `/pages/api` to its backend function, explaining request/response flow, database interactions, and external service integrations.

---

## >é Core API Routes

### = `/api/uid-redirect.js`  NFC/QR Tap Handler
**Purpose:** Central redirection logic for NFC tag scans (via `/t?u=<UID>` route).

**Flow:**
1. Customer taps NFC display ’ browser loads `/t?u=<UID>`
2. Next.js rewrites to `/api/uid-redirect?u=<UID>` (configured in `next.config.js`)
3. API checks `uids` table in Supabase for claim status
4. If unclaimed ’ redirects to `/claim?u=<UID>` (retailer registration)
5. If claimed ’ redirects to `affiliate_url` (Shopify collection/product)

**Database Calls:**
- `SELECT affiliate_url, is_claimed FROM uids WHERE uid = ?`

**Response:** HTTP 302 redirect to claim page or affiliate URL

---

### =° `/api/payout.js`  Multi-Party Payout Processor
**Purpose:** Executes Dwolla ACH transfers for vendor/retailer/sourcer commissions.

**Flow:**
1. Admin triggers payout from admin dashboard
2. API fetches `payout_jobs` record by ID
3. Retrieves Dwolla funding source IDs from `vendor_accounts`, `retailer_accounts`, `sourcer_accounts`
4. Authenticates with Dwolla API (client credentials grant)
5. Creates separate transfers for each stakeholder (vendor_cut, retailer_cut, sourcer_cut)
6. Updates payout_job status to 'paid' with timestamp

**Database Calls:**
- `SELECT * FROM payout_jobs WHERE id = ?`
- `SELECT dwolla_funding_source_id FROM vendor_accounts WHERE vendor_id = ?`
- `SELECT dwolla_funding_source_id FROM retailer_accounts WHERE retailer_id = ?`
- `SELECT dwolla_funding_source_id FROM sourcer_accounts WHERE id = ?`
- `UPDATE payout_jobs SET status = 'paid', date_paid = NOW() WHERE id = ?`

**External Services:**
- Dwolla: `/token` (auth), `/transfers` (initiate ACH)

**Request Body:**
```json
{
  "payoutJobId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transfers": [...]
}
```

---

### =Í `/api/shopify-webhook.js`  Order Event Sync
**Purpose:** Receives Shopify order webhooks and syncs to Supabase `orders` table.

**Flow:**
1. Shopify sends POST webhook on order creation/update
2. API validates webhook signature (HMAC)
3. Extracts order data (line items, customer, total)
4. Inserts/updates `orders` table
5. (Future) Creates `payout_job` record with commission splits

**Database Calls:**
- `INSERT INTO orders (shopify_order_id, customer_email, total, ...) VALUES (...)`
- (verify) `INSERT INTO payout_jobs (...)`

**Webhook Events:**
- `orders/create`
- `orders/updated`

**Security:** HMAC signature validation using `SHOPIFY_WEBHOOK_SECRET`

---

### >Ñ=¼ `/api/submit-vendor.js`  Vendor Onboarding Submission
**Purpose:** Saves vendor application form data to Supabase.

**Flow:**
1. Vendor completes `/onboard` form
2. Frontend POSTs to `/api/submit-vendor`
3. API validates required fields (name, platformUrl, collectionName)
4. Inserts into `vendors` table with optional sourcing agent attribution

**Database Calls:**
- `INSERT INTO vendors (name, email, store_type, platform_url, ...) VALUES (...)`

**Request Body:**
```json
{
  "name": "Vendor Name",
  "email": "vendor@example.com",
  "storeType": "Etsy|Shopify",
  "websiteUrl": "https://...",
  "platformUrl": "https://etsy.com/shop/...",
  "fulfillmentSpeed": "2-3 days",
  "inventoryCap": 50,
  "productPhotoUrl": "https://...",
  "collectionName": "Handmade Collars",
  "sourcedBy": "sourcer-id-optional"
}
```

---

### <ê `/api/register-store.js`  Retailer Registration
**Purpose:** Registers a new retailer and claims a UID (verify).

**Flow:**
1. Retailer submits store details via `/onboard/register`
2. API creates entry in `retailers` table
3. Links retailer to `business` (franchise parent)
4. (verify) Updates `uids` table to mark UID as claimed

**Database Calls:**
- `INSERT INTO retailers (name, address, phone, business_id) VALUES (...)`
- (verify) `UPDATE uids SET is_claimed = true, business_id = ? WHERE uid = ?`

---

### =³ `/api/plaid-link-token.js`  Generate Plaid Link Token
**Purpose:** Creates ephemeral Plaid Link token for bank connection UI.

**Flow:**
1. Retailer/vendor clicks "Connect Bank Account" in dashboard
2. Frontend requests link token from this API
3. API calls Plaid `/link/token/create` with user metadata
4. Returns token to frontend for Plaid Link initialization

**External Services:**
- Plaid: `/link/token/create`

**Request:** None (GET or POST with user context)

**Response:**
```json
{
  "link_token": "link-sandbox-..."
}
```

---

### = `/api/plaid-exchange.js`  Exchange Plaid Public Token
**Purpose:** Converts Plaid public token to access token and creates Dwolla funding source.

**Flow:**
1. User completes Plaid Link flow ’ receives `public_token`
2. Frontend POSTs to `/api/plaid-exchange` with public token
3. API exchanges for `access_token` via Plaid `/item/public_token/exchange`
4. Retrieves bank account details via Plaid `/accounts/get`
5. Creates Dwolla funding source using bank account + routing numbers
6. Stores Dwolla funding source ID in `vendor_accounts`/`retailer_accounts`/`sourcer_accounts`

**Database Calls:**
- `UPDATE {account_type}_accounts SET dwolla_funding_source_id = ?, plaid_access_token = ? WHERE id = ?`

**External Services:**
- Plaid: `/item/public_token/exchange`, `/auth/get`
- Dwolla: `/funding-sources` (create bank funding source)

**Request Body:**
```json
{
  "public_token": "public-sandbox-...",
  "account_id": "user-uuid",
  "account_type": "vendor|retailer|sourcer"
}
```

---

### = `/api/supabase-hook.js`  Supabase Event Listener
**Purpose:** (verify) Handles Supabase database webhooks/triggers.

**Flow:**
- May listen for table insert/update events
- Triggers downstream logic (e.g., payout creation on order insert)

**Status:** (verify)  confirm implementation

---

### <â `/api/admin/add-owner.js`  Admin: Add Franchise Owner
**Purpose:** Admin manually adds a franchise owner to `retailer_owners` table.

**Database Calls:**
- `INSERT INTO retailer_owners (name, email, phone, business_id) VALUES (...)`

**Auth:** Requires admin session (verify via `admins` table)

---

### =Ý `/api/admin/add-prospect.js`  Admin: Add Outreach Prospect
**Purpose:** Admin logs a cold outreach prospect in `retailer_outreach` table.

**Database Calls:**
- `INSERT INTO retailer_outreach (store_name, phone, business_id, status) VALUES (...)`

---

### = `/api/retailers/search.js`  Search Retailers
**Purpose:** Returns retailers matching search query (name, address, etc.).

**Database Calls:**
- `SELECT * FROM retailers WHERE name ILIKE '%query%' OR address ILIKE '%query%'`

---

### <× `/api/retailers/create.js`  Create Retailer Entry
**Purpose:** Programmatic retailer creation (alternative to form submission).

**Database Calls:**
- `INSERT INTO retailers (...) VALUES (...)`

---

### =Í `/api/validate-address.js`  Address Validation Helper
**Purpose:** (verify) Validates/standardizes addresses using Google Maps API or similar.

**External Services:**
- Google Maps Geocoding API (verify)

---

### <ì `/api/stores/bulk-update.js`  Bulk Update Stores
**Purpose:** Admin batch updates for multiple retailers (status, settings, etc.).

**Database Calls:**
- `UPDATE retailers SET ... WHERE id IN (...)`

---

### = `/api/onboard/register.js`  Multi-Step Onboard Registration
**Purpose:** Unified registration endpoint for vendors/retailers during onboarding flow.

**Flow:**
1. User completes multi-step form
2. API determines user type (vendor/retailer) from request
3. Creates appropriate table entry
4. May trigger welcome email or notification

**Database Calls:**
- `INSERT INTO vendors/retailers (...) VALUES (...)`

---

## =Ê API Route Summary Table

| Route | Method | Purpose | DB Tables | External APIs |
|-------|--------|---------|-----------|---------------|
| `/api/uid-redirect` | GET | Handle NFC tap redirects | `uids` |  |
| `/api/payout` | POST | Execute Dwolla payouts | `payout_jobs`, `{type}_accounts` | Dwolla |
| `/api/shopify-webhook` | POST | Sync Shopify orders | `orders`, `payout_jobs` | Shopify |
| `/api/submit-vendor` | POST | Vendor onboarding | `vendors` |  |
| `/api/register-store` | POST | Retailer registration | `retailers`, `uids` |  |
| `/api/plaid-link-token` | POST | Generate Plaid Link token |  | Plaid |
| `/api/plaid-exchange` | POST | Exchange Plaid token ’ Dwolla | `{type}_accounts` | Plaid, Dwolla |
| `/api/admin/add-owner` | POST | Add franchise owner | `retailer_owners` |  |
| `/api/admin/add-prospect` | POST | Log outreach prospect | `retailer_outreach` |  |
| `/api/retailers/search` | GET | Search retailers | `retailers` |  |
| `/api/retailers/create` | POST | Create retailer | `retailers` |  |
| `/api/validate-address` | POST | Validate address |  | Google Maps (verify) |
| `/api/stores/bulk-update` | POST | Bulk update retailers | `retailers` |  |
| `/api/onboard/register` | POST | Unified onboard registration | `vendors`, `retailers` |  |

---

## = Authentication Patterns

**Admin Routes:**
- Check user session via `@supabase/ssr` server client
- Verify `user.id` exists in `admins` table using `supabaseAdmin`
- Return error props (never redirect) if unauthorized

**User Routes:**
- May use `NEXT_PUBLIC_SUPABASE_ANON_KEY` client for authenticated requests
- Session passed via cookies, validated server-side

---

## >à Dependencies
- **@supabase/supabase-js**  Database queries
- **@supabase/ssr**  Server-side auth (admin pages)
- **Dwolla Node SDK**  Payout transfers
- **Plaid Node SDK**  Bank account linking
- **next-auth** (verify)  Session management
- **node-fetch**  HTTP requests to external APIs

---

## = Relations
- See **@context/data_model.md** for database schema
- See **@context/supabase/overview.md** for table relationships
- See **@context/nextjs/auth_flow.md** for authentication logic
- See **@context/payouts_flow.md** for payout sequence diagrams
- See **@context/shopify/webhooks.md** for Shopify integration details

### /api/retailers/ready-for-claim.js - Claimable Retailers
**Purpose:** Returns fully onboarded retailers with displays queued or active so store managers can claim UIDs.

**Database Calls:**
- `SELECT displays.status, retailers.* FROM displays JOIN retailers ON displays.retailer_id = retailers.id`

---
