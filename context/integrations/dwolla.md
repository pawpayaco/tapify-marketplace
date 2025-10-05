# 💸 Dwolla Integration

Documents Dwolla ACH transfer integration for automated multi-party payouts in Tapify Infrastructure System v2.0.

---

## 📋 Purpose
Dwolla powers Tapify's automated payout system by executing ACH bank transfers to vendors, retailers, and sourcing agents. This file explains customer onboarding, funding source linking, transfer execution, and payout timing.

---

## 🔄 Integration Flow

### High-Level Payout Sequence
1. **Order Created** → Shopify webhook → Supabase `orders` table
2. **Payout Job Created** → Supabase `payout_jobs` table with commission splits
3. **Admin Approval** → Admin dashboard triggers `/api/payout`
4. **Dwolla Authentication** → OAuth2 client credentials grant
5. **Multi-Party Transfer** → ACH transfers to vendor/retailer/sourcer
6. **Status Update** → `payout_jobs.status` = `'paid'`

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Tapify Payout Flow                       │
└─────────────────────────────────────────────────────────────┘

Admin Dashboard (/pages/admin.js)
        │
        │ POST /api/payout { payoutJobId }
        ↓
Payout API (/pages/api/payout.js)
        │
        ├─→ 1. Fetch payout_jobs (Supabase)
        │
        ├─→ 2. Fetch account funding sources
        │      - vendor_accounts.dwolla_funding_source_id
        │      - retailer_accounts.dwolla_funding_source_id
        │      - sourcer_accounts.dwolla_funding_source_id
        │
        ├─→ 3. Authenticate with Dwolla
        │      POST {DWOLLA_ENV}/token
        │
        ├─→ 4. Create transfers (1-3 transfers)
        │      POST {DWOLLA_ENV}/transfers
        │      Source: DWOLLA_MASTER_FUNDING_SOURCE
        │      Destination: vendor/retailer/sourcer
        │
        └─→ 5. Update payout_jobs.status = 'paid'

┌──────────────────────────────────────────────────────────┐
│  Dwolla ACH Network (1-3 business days)                  │
│  - Vendor receives vendor_cut                            │
│  - Retailer receives retailer_cut                        │
│  - Sourcer receives sourcer_cut                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🏗️ Dwolla Customer & Funding Source Creation

### Customer Onboarding Flow
**Triggered by:** Retailer/Vendor/Sourcer connecting bank account via Plaid

**Endpoint:** `/api/plaid-link.js` (lines 59-79)

**Steps:**
1. User completes Plaid Link flow
2. API exchanges Plaid public token for access token
3. API creates Dwolla processor token via Plaid
4. **Create Dwolla Customer:**
   ```js
   POST {DWOLLA_ENV}/customers
   Authorization: Basic {base64(DWOLLA_KEY:DWOLLA_SECRET)}

   {
     "firstName": "John",
     "email": "john@example.com",
     "type": "receive-only"
   }
   ```
5. Dwolla returns `Location` header with customer URL:
   ```
   https://api-sandbox.dwolla.com/customers/{dwolla_customer_id}
   ```

**Customer Types:**
- `receive-only` — Used for retailers/vendors (Phase 1)
- `unverified` — Basic customer (verify — not currently used)
- `verified` — Requires SSN/EIN (future for high-volume vendors)

---

### Funding Source Attachment
**Triggered by:** After Dwolla customer creation

**Endpoint:** `/api/plaid-link.js` (lines 84-101)

**Request:**
```js
POST {DWOLLA_ENV}/customers/{dwolla_customer_id}/funding-sources
Authorization: Basic {base64(DWOLLA_KEY:DWOLLA_SECRET)}

{
  "plaidToken": "{plaid_processor_token}",
  "name": "Retailer's Bank"
}
```

**Response:**
- Returns `Location` header with funding source URL:
  ```
  https://api-sandbox.dwolla.com/funding-sources/{dwolla_funding_source_id}
  ```

**Stored in Supabase:**
```js
// Example for retailer_accounts table
{
  retailer_id: "uuid",
  plaid_access_token: "access-sandbox-xxx",
  dwolla_customer_id: "customer-id-xxx",
  dwolla_funding_source_id: "funding-source-id-xxx"
}
```

**Files:**
- `pages/api/plaid-link.js:84-101` (funding source creation)
- `pages/api/plaid-exchange.js:64-103` (simplified flow without Dwolla)

---

## 💰 Payout Execution

### Authentication
**Method:** OAuth2 Client Credentials Grant

**Endpoint:** `POST {DWOLLA_ENV}/token`

**Implementation:** `pages/api/payout.js:16-29`

**Request:**
```js
POST https://api-sandbox.dwolla.com/token
Content-Type: application/x-www-form-urlencoded

client_id={DWOLLA_KEY}&
client_secret={DWOLLA_SECRET}&
grant_type=client_credentials
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Token Lifecycle:**
- Valid for 1 hour
- Generate new token for each payout batch (recommended)
- Not stored in Supabase (regenerated on demand)

---

### Transfer Creation
**Method:** Create ACH transfer from master funding source to recipient

**Endpoint:** `POST {DWOLLA_ENV}/transfers`

**Implementation:** `pages/api/payout.js:32-52`

**Request:**
```js
POST https://api-sandbox.dwolla.com/transfers
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/vnd.dwolla.v1.hal+json

{
  "_links": {
    "source": {
      "href": "https://api-sandbox.dwolla.com/funding-sources/{DWOLLA_MASTER_FUNDING_SOURCE}"
    },
    "destination": {
      "href": "https://api-sandbox.dwolla.com/funding-sources/{recipient_funding_source_id}"
    }
  },
  "amount": {
    "currency": "USD",
    "value": "42.50"
  }
}
```

**Response:**
```json
{
  "_links": {
    "self": { "href": "https://api-sandbox.dwolla.com/transfers/{transfer-id}" },
    "source": { "href": "..." },
    "destination": { "href": "..." }
  },
  "id": "transfer-id",
  "status": "pending",
  "amount": { "value": "42.50", "currency": "USD" },
  "created": "2025-01-15T10:30:00.000Z"
}
```

**Transfer States:**
- `pending` — Initiated, awaiting processing
- `processed` — Funds sent to ACH network
- `failed` — Transfer failed (insufficient funds, invalid account, etc.)
- `cancelled` — Manually cancelled before processing

---

### Multi-Party Payout Logic
**Implementation:** `pages/api/payout.js:54-158`

**Step-by-Step:**

1. **Fetch Payout Job:**
   ```js
   const { data: job } = await supabase
     .from('payout_jobs')
     .select('*')
     .eq('id', payoutJobId)
     .single();
   ```

2. **Validate Status:**
   ```js
   if (job.status !== 'pending') {
     return res.status(400).json({ error: 'Payout already processed' });
   }
   ```

3. **Fetch Funding Sources:**
   ```js
   const { data: vendor } = await supabase
     .from('vendor_accounts')
     .select('dwolla_funding_source_id')
     .eq('vendor_id', job.vendor_id)
     .single();

   const { data: retailer } = await supabase
     .from('retailer_accounts')
     .select('dwolla_funding_source_id')
     .eq('retailer_id', job.retailer_id)
     .single();
   ```

4. **Execute Transfers:**
   ```js
   // Transfer 1: Vendor
   if (job.vendor_cut > 0) {
     await createDwollaTransfer(
       dwollaToken,
       DWOLLA_MASTER_FUNDING_SOURCE,
       vendor.dwolla_funding_source_id,
       job.vendor_cut
     );
   }

   // Transfer 2: Retailer
   if (retailer?.dwolla_funding_source_id && job.retailer_cut > 0) {
     await createDwollaTransfer(
       dwollaToken,
       DWOLLA_MASTER_FUNDING_SOURCE,
       retailer.dwolla_funding_source_id,
       job.retailer_cut
     );
   }

   // Transfer 3: Sourcer (if applicable)
   if (sourcer?.dwolla_funding_source_id && job.sourcer_cut > 0) {
     await createDwollaTransfer(
       dwollaToken,
       DWOLLA_MASTER_FUNDING_SOURCE,
       sourcer.dwolla_funding_source_id,
       job.sourcer_cut
     );
   }
   ```

5. **Update Status:**
   ```js
   await supabase
     .from('payout_jobs')
     .update({
       status: 'paid',
       date_paid: new Date().toISOString()
     })
     .eq('id', payoutJobId);
   ```

---

## 🌐 Environment Configuration

### Required Variables
```env
# Dwolla Base URL
DWOLLA_ENV=https://api-sandbox.dwolla.com

# OAuth2 Credentials
DWOLLA_KEY=your-dwolla-key
DWOLLA_SECRET=your-dwolla-secret

# Master Funding Source (Tapify's business bank account)
DWOLLA_MASTER_FUNDING_SOURCE=funding-source-id-xxx
```

### Environment Differences

| Environment | Base URL | Use Case |
|------------|----------|----------|
| **Sandbox** | `https://api-sandbox.dwolla.com` | Development, testing with fake bank accounts |
| **Production** | `https://api.dwolla.com` | Live ACH transfers with real bank accounts |

**Key Differences:**
- **Sandbox:** Instant transfers, no real money, test bank accounts
- **Production:** 1-3 business day ACH processing, real funds, KYC required

**Environment Detection:**
```js
const DWOLLA_BASE_URL =
  process.env.DWOLLA_ENV === 'sandbox'
    ? 'https://api-sandbox.dwolla.com'
    : 'https://api.dwolla.com';
```
**File:** `pages/api/payout.js:10-13`

---

## ⏱️ ACH Payout Timing

### Transfer Timeline
| Stage | Sandbox | Production |
|-------|---------|------------|
| **Transfer Created** | Instant | T+0 (same day) |
| **ACH Processing** | Instant | 1-3 business days |
| **Funds Available** | Instant | T+1 to T+3 |

### Business Day Rules
- Weekends and federal holidays **do not count** as business days
- Transfers initiated after 4:00 PM ET process next business day
- Friday transfers typically clear Monday (T+3)

### Status Tracking
**Check transfer status** (verify — webhook or polling):
```js
GET {DWOLLA_ENV}/transfers/{transfer-id}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "transfer-id",
  "status": "processed",
  "amount": { "value": "42.50", "currency": "USD" },
  "created": "2025-01-15T10:30:00.000Z",
  "clearing": {
    "source": "standard",
    "destination": "standard"
  }
}
```

---

## 🔔 Webhook Handling (Future)

### Webhook Events
Dwolla can send webhooks for transfer status updates (verify — not currently implemented):

**Common Events:**
- `transfer_created` — Transfer initiated
- `transfer_completed` — Funds successfully transferred
- `transfer_failed` — Transfer failed
- `customer_funding_source_added` — Bank account linked

**Proposed Endpoint:** `/api/dwolla-webhook` (verify — does not exist)

**Security:**
- Validate webhook signature using `X-Request-Signature-SHA-256` header
- Use `DWOLLA_WEBHOOK_SECRET` for HMAC validation

**Implementation Pattern:**
```js
const crypto = require('crypto');

const signature = req.headers['x-request-signature-sha-256'];
const hash = crypto
  .createHmac('sha256', process.env.DWOLLA_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== hash) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

---

## 🔐 Security Considerations

### API Key Protection
- **NEVER** expose `DWOLLA_KEY` or `DWOLLA_SECRET` to browser
- Only use in server-side API routes
- Rotate credentials every 90 days (recommended)

### Funding Source Validation
- Verify `dwolla_funding_source_id` exists before creating transfers
- Check account status is `verified` (future — not currently enforced)
- Validate transfer amount > 0

### Error Handling
**Common Dwolla Errors:**
- `InvalidResourceState` — Customer not verified
- `InsufficientFunds` — Master funding source lacks balance
- `ValidationError` — Invalid funding source ID

**Implementation:** `pages/api/payout.js:154-157`
```js
catch (err) {
  console.error('[PAYOUT ERROR]', err);
  return res.status(500).json({ error: err.message });
}
```

---

## 📂 File Locations

### API Routes
- `pages/api/payout.js` — Multi-party payout execution
- `pages/api/plaid-link.js` — Plaid → Dwolla customer creation
- `pages/api/plaid-exchange.js` — Simplified Plaid token exchange (no Dwolla)

### Client-Side Services
- `services/dwolla.js` — Frontend helper functions:
  - `createCustomer(userData)` — Create Dwolla customer (verify — endpoint exists?)
  - `initiatePayout(payoutData)` — Trigger payout (verify — endpoint exists?)
  - `getPayoutStatus(payoutId)` — Check transfer status (verify — endpoint exists?)

### Database Tables
- `vendor_accounts` — Stores `dwolla_customer_id`, `dwolla_funding_source_id`
- `retailer_accounts` — Stores `dwolla_customer_id`, `dwolla_funding_source_id`
- `sourcer_accounts` — Stores `dwolla_customer_id`, `dwolla_funding_source_id`
- `payout_jobs` — Defines commission splits and payout status

---

## 🧩 Dependencies

### External Services
- **Plaid** — Bank account verification and processor token generation
  - See `@context/integrations/plaid.md` for Plaid → Dwolla flow
- **Supabase** — Stores funding source IDs and payout job metadata
  - See `@context/supabase/overview.md` for schema details

### NPM Packages
```json
{
  "dependencies": {
    "dwolla-v2": "^3.4.0",
    "node-fetch": "^3.x.x"
  }
}
```

**Note:** `dwolla-v2` SDK is installed but **not currently used**. API routes use `fetch` for direct HTTP requests.

---

## 🔗 Relations

**Related Documentation:**
- See **@context/integrations/plaid.md** for Plaid Link → Dwolla flow
- See **@context/environment.md** for environment variable setup
- See **@context/data_model.md** for payout job schema
- See **@context/supabase/overview.md** for database structure
- See **@context/nextjs/pages_api_summary.md** for API route details

**External Resources:**
- Dwolla API Docs: https://developers.dwolla.com/
- Dwolla Sandbox: https://developers.dwolla.com/guides/sandbox
- Dwolla Customer Types: https://developers.dwolla.com/docs/balance/customers

---

## 🚀 Phase Differences

### Phase 1 (Current — Pawpaya Only)
- ✅ Single vendor (Pawpaya) receives 70% vendor_cut
- ✅ Retailers receive 20% retailer_cut
- ❌ No sourcer commissions (sourcer_cut = 0)
- ✅ Tapify retains 10% tapify_cut (not transferred via Dwolla)

### Phase 2 (Future — Marketplace)
- ✅ Multi-vendor payouts with dynamic commission splits
- ✅ Sourcer commissions (5-10% sourcer_cut)
- ✅ Tiered retailer commissions based on performance
- ✅ Automated payout scheduling (weekly/monthly)
- ✅ Webhook-based transfer status updates

---

## ✅ Production Checklist

Before enabling Dwolla in production:

- [ ] Switch `DWOLLA_ENV` to `https://api.dwolla.com`
- [ ] Replace sandbox credentials with production `DWOLLA_KEY` and `DWOLLA_SECRET`
- [ ] Verify Tapify business account in Dwolla dashboard
- [ ] Link production bank account as `DWOLLA_MASTER_FUNDING_SOURCE`
- [ ] Test transfers with small amounts ($0.01) first
- [ ] Implement webhook handlers for transfer status updates
- [ ] Add retry logic for failed transfers
- [ ] Set up Slack/email alerts for failed payouts
- [ ] Enable transaction logging for audit compliance
- [ ] Review ACH transfer limits with Dwolla support
- [ ] Verify customer KYC requirements for high-volume vendors
- [ ] Test micro-deposit verification flow (if not using Plaid)
