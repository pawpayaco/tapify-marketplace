# 🏦 Plaid Integration

Documents Plaid Link integration for secure bank account verification and Dwolla funding source creation in Tapify Infrastructure System v2.0.

---

## 📋 Purpose
Plaid enables Tapify users (vendors, retailers, sourcers) to securely connect their bank accounts for ACH payouts. This file explains the Plaid Link flow, token exchange, processor token creation for Dwolla, and security best practices.

---

## 🔄 Integration Flow

### High-Level Bank Connection Sequence
1. **User Initiates** → Clicks "Connect Bank Account" in dashboard
2. **Create Link Token** → API generates ephemeral Plaid Link token
3. **Plaid Link UI** → User selects bank, logs in, chooses account
4. **Public Token** → Plaid returns `public_token` + `account_id`
5. **Token Exchange** → API exchanges `public_token` for `access_token`
6. **Processor Token** → API creates Dwolla processor token
7. **Dwolla Customer** → API creates Dwolla customer + funding source
8. **Store in Supabase** → Save tokens and funding source IDs

### Architecture Diagram
```
┌────────────────────────────────────────────────────────────────┐
│                  Plaid → Dwolla Flow                           │
└────────────────────────────────────────────────────────────────┘

User Dashboard (/pages/onboard/dashboard.js)
        │
        │ Click "Connect Bank"
        ↓
POST /api/plaid-link-token
        │
        │ Request: { user_id, retailer_id }
        ↓
Plaid API: POST /link/token/create
        │
        │ Response: { link_token }
        ↓
Plaid Link UI (Browser)
        │
        │ User selects bank → Logs in → Chooses account
        ↓
        │ Success: { public_token, account_id, metadata }
        ↓
POST /api/plaid-link
        │
        ├─→ 1. Exchange public_token for access_token
        │      POST https://sandbox.plaid.com/item/public_token/exchange
        │
        ├─→ 2. Create Dwolla processor token
        │      POST https://sandbox.plaid.com/processor/dwolla/bank_account_token/create
        │
        ├─→ 3. Create Dwolla customer
        │      POST {DWOLLA_ENV}/customers
        │
        ├─→ 4. Attach funding source to Dwolla customer
        │      POST {DWOLLA_ENV}/customers/{id}/funding-sources
        │
        └─→ 5. Store in Supabase
               INSERT INTO retailer_accounts (
                 plaid_access_token,
                 dwolla_customer_id,
                 dwolla_funding_source_id
               )

┌───────────────────────────────────────────────────────────────┐
│  Bank Account Verified ✓                                      │
│  Ready for ACH payouts via Dwolla                            │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔑 Plaid Link Token Creation

### Purpose
Generates ephemeral token to initialize Plaid Link UI in browser.

### Endpoint
`POST /api/plaid-link-token`

### Implementation
**File:** `pages/api/plaid-link-token.js:1-49`

### Request
```js
POST /api/plaid-link-token

{
  "user_id": "auth-user-uuid",
  "retailer_id": "retailer-uuid"
}
```

### Plaid API Call
```js
POST https://sandbox.plaid.com/link/token/create
Content-Type: application/json

{
  "client_id": "{PLAID_CLIENT_ID}",
  "secret": "{PLAID_SECRET}",
  "client_name": "Tapify Marketplace",
  "user": {
    "client_user_id": "auth-user-uuid"
  },
  "products": ["auth", "transactions"],
  "country_codes": ["US"],
  "language": "en",
  "webhook": "{NEXT_PUBLIC_BASE_URL}/api/plaid-webhook"
}
```

### Response
```json
{
  "link_token": "link-sandbox-abc123...",
  "expiration": "2025-01-15T14:30:00Z",
  "request_id": "req-xyz"
}
```

### Link Token Properties
- **Expiration:** 4 hours (single-use)
- **Environment:** Sandbox or Production (based on credentials)
- **Products:** `auth` (account verification), `transactions` (future)

### Frontend Usage
**File:** `pages/onboard/dashboard.js:103-132`

```js
// 1. Request Link token
const response = await fetch('/api/plaid-link-token', {
  method: 'POST',
  body: JSON.stringify({ user_id, retailer_id })
});
const { link_token } = await response.json();

// 2. Initialize Plaid Link
const handler = window.Plaid.create({
  token: link_token,
  onSuccess: async (public_token, metadata) => {
    // Exchange token
    await fetch('/api/plaid-exchange', {
      method: 'POST',
      body: JSON.stringify({
        public_token,
        metadata,
        user_id,
        retailer_id
      })
    });
  }
});

// 3. Open Plaid Link UI
handler.open();
```

---

## 🔄 Token Exchange & Processor Token Flow

### Full Flow: Public Token → Dwolla Funding Source

**Endpoint:** `POST /api/plaid-link`

**Implementation:** `pages/api/plaid-link.js:1-132`

---

### Step 1: Exchange Public Token for Access Token

**Plaid API:**
```js
POST https://sandbox.plaid.com/item/public_token/exchange

{
  "client_id": "{PLAID_CLIENT_ID}",
  "secret": "{PLAID_SECRET}",
  "public_token": "{public_token_from_link}"
}
```

**Response:**
```json
{
  "access_token": "access-sandbox-xxx...",
  "item_id": "item-id-xxx",
  "request_id": "req-yyy"
}
```

**Code:** `pages/api/plaid-link.js:26-38`

**Access Token Properties:**
- **Lifespan:** Permanent (until revoked)
- **Scope:** Linked bank account data
- **Storage:** Saved in `retailer_accounts.plaid_access_token`

---

### Step 2: Create Dwolla Processor Token

**Purpose:** Converts Plaid access token into Dwolla-compatible funding source token.

**Plaid API:**
```js
POST https://sandbox.plaid.com/processor/dwolla/bank_account_token/create

{
  "client_id": "{PLAID_CLIENT_ID}",
  "secret": "{PLAID_SECRET}",
  "access_token": "{plaid_access_token}",
  "account_id": "{selected_account_id}"
}
```

**Response:**
```json
{
  "processor_token": "processor-sandbox-dwolla-xxx...",
  "request_id": "req-zzz"
}
```

**Code:** `pages/api/plaid-link.js:43-56`

**Processor Token Properties:**
- **Lifespan:** Ephemeral (use immediately)
- **Purpose:** Create Dwolla funding source
- **Not stored:** Used once, then discarded

---

### Step 3: Create Dwolla Customer

**Dwolla API:**
```js
POST {DWOLLA_ENV}/customers
Authorization: Basic {base64(DWOLLA_KEY:DWOLLA_SECRET)}
Content-Type: application/json

{
  "firstName": "John",
  "email": "john@example.com",
  "type": "receive-only"
}
```

**Response Headers:**
```
Location: https://api-sandbox.dwolla.com/customers/{dwolla_customer_id}
```

**Code:** `pages/api/plaid-link.js:61-79`

**Customer Types:**
- `receive-only` — Simplified onboarding, no verification (used in Tapify)
- `unverified` — Basic customer (verify — not used)
- `verified` — Requires SSN/EIN for high-volume transfers

---

### Step 4: Attach Funding Source to Dwolla Customer

**Dwolla API:**
```js
POST {DWOLLA_ENV}/customers/{dwolla_customer_id}/funding-sources
Authorization: Basic {base64(DWOLLA_KEY:DWOLLA_SECRET)}
Content-Type: application/json

{
  "plaidToken": "{processor_token}",
  "name": "Retailer's Bank"
}
```

**Response Headers:**
```
Location: https://api-sandbox.dwolla.com/funding-sources/{dwolla_funding_source_id}
```

**Code:** `pages/api/plaid-link.js:84-101`

**Funding Source Properties:**
- **Status:** `verified` (instant verification via Plaid)
- **Type:** `bank` (checking or savings)
- **Used for:** ACH payout destination

---

### Step 5: Store in Supabase

**Database Table:** `retailer_accounts` (or `vendor_accounts`, `sourcer_accounts`)

**Insert Query:**
```js
await supabase.from('retailer_accounts').insert({
  retailer_id: "uuid",
  plaid_access_token: "access-sandbox-xxx",
  dwolla_customer_id: "customer-id-xxx",
  dwolla_funding_source_id: "funding-source-id-xxx"
});
```

**Code:** `pages/api/plaid-link.js:113-120`

**Stored Data:**
| Field | Purpose | Lifespan |
|-------|---------|----------|
| `plaid_access_token` | Retrieve account details, refresh tokens | Permanent |
| `dwolla_customer_id` | Identify Dwolla customer for transfers | Permanent |
| `dwolla_funding_source_id` | Destination for ACH payouts | Permanent |

---

## 🛡️ Security Notes

### Token Lifecycle

**Public Token:**
- **Lifespan:** 30 minutes
- **Scope:** Single-use only
- **Security:** Exchanged immediately, never stored

**Access Token:**
- **Lifespan:** Permanent (until user revokes)
- **Scope:** Full account read access
- **Security:** Stored server-side only, encrypted at rest (verify)

**Processor Token:**
- **Lifespan:** Ephemeral (use immediately)
- **Scope:** Create Dwolla funding source
- **Security:** Not stored, used once

### Environment Variable Protection

```env
# Server-side only (NEVER expose to browser)
PLAID_CLIENT_ID=your-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
```

**Security Rules:**
- ❌ **NEVER** use `NEXT_PUBLIC_` prefix for Plaid secrets
- ✅ Only use in API routes (`pages/api/*`)
- ✅ Use HTTPS for all Plaid API calls
- ✅ Rotate credentials every 90 days

### Webhook Security (Future)

**Endpoint:** `/api/plaid-webhook` (verify — not currently implemented)

**Events:**
- `ITEM_LOGIN_REQUIRED` — Bank login expired
- `ERROR` — Connection issue
- `TRANSACTIONS_REMOVED` — Historical data removed

**Verification:**
```js
// Plaid sends POST request with signature
const signature = req.headers['plaid-verification'];
// Verify signature using webhook secret (verify — not implemented)
```

---

## 🌐 Environment Configuration

### Required Variables
```env
# Plaid API Credentials
PLAID_CLIENT_ID=68db07dc1059f30020727751
PLAID_SECRET=a0e905ba7d104e24e66408023f6351
PLAID_ENV=sandbox

# Base URL for webhook callbacks
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Environment Differences

| Environment | Plaid Endpoint | Use Case |
|------------|----------------|----------|
| **Sandbox** | `https://sandbox.plaid.com` | Development with test bank credentials |
| **Development** | `https://development.plaid.com` | Limited production testing |
| **Production** | `https://production.plaid.com` | Live bank connections |

**Test Credentials (Sandbox):**
- Username: `user_good`
- Password: `pass_good`
- See: https://plaid.com/docs/sandbox/test-credentials/

**Environment Detection:**
```js
// Plaid environment is set via PLAID_ENV variable
// API endpoints change automatically based on credentials
```

---

## 📂 File Locations

### API Routes
- `pages/api/plaid-link-token.js` — Create Plaid Link token
- `pages/api/plaid-exchange.js` — Simplified exchange (no Dwolla creation)
- `pages/api/plaid-link.js` — Full flow (exchange + Dwolla customer + funding source)
- `pages/api/plaid-webhook.js` — Webhook handler (verify — not implemented)

### Client-Side Components
- `pages/onboard/dashboard.js:103-132` — Plaid Link initialization
- `services/plaid.js` — Frontend helper functions:
  - `createLinkToken()` — Request Link token
  - `exchangePublicToken(publicToken)` — Exchange token

### External Script
**Plaid Link CDN:**
```html
<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
```
**Loaded in:** `pages/onboard/dashboard.js:272`

---

## 🧩 Dependencies

### External Services
- **Dwolla** — ACH payout execution using Plaid-verified accounts
  - See `@context/integrations/dwolla.md` for transfer flow
- **Supabase** — Stores Plaid access tokens and Dwolla funding source IDs
  - See `@context/supabase/overview.md` for schema details

### NPM Packages
```json
{
  "dependencies": {
    "plaid": "^38.1.0",
    "react-plaid-link": "^4.1.1"
  }
}
```

**Package Usage:**
- `plaid` — Official Node.js SDK (verify — not currently used, API uses `fetch`)
- `react-plaid-link` — React wrapper for Plaid Link UI (verify — using CDN instead)

---

## 🔄 Alternative Flow: Simplified Exchange

### Endpoint: `/api/plaid-exchange`
**Purpose:** Exchange public token without creating Dwolla customer (Phase 1 — simplified flow)

**Implementation:** `pages/api/plaid-exchange.js:1-117`

**Differences from Full Flow:**
- ✅ Exchanges `public_token` for `access_token`
- ✅ Fetches account details
- ✅ Stores in `retailer_accounts.plaid_access_token`
- ❌ **Does NOT create Dwolla customer**
- ❌ **Does NOT create funding source**
- ❌ Sets `dwolla_customer_id` to `null` (manual creation later)

**Use Case:**
- Phase 1: Collect bank info, defer Dwolla onboarding
- Manual verification flow (not currently used)

**Code Example:**
```js
// Exchange token
const { access_token } = await exchangePublicToken(public_token);

// Get account details
const accountsData = await getAccountDetails(access_token);

// Store in Supabase
await supabase.from('retailer_accounts').insert({
  retailer_id,
  plaid_access_token: access_token,
  dwolla_customer_id: null // Will be set later
});
```

---

## 🔗 Relations

**Related Documentation:**
- See **@context/integrations/dwolla.md** for Dwolla customer creation and payout flow
- See **@context/environment.md** for environment variable setup
- See **@context/data_model.md** for account table schema
- See **@context/supabase/overview.md** for database structure
- See **@context/nextjs/pages_api_summary.md** for API route details

**External Resources:**
- Plaid API Docs: https://plaid.com/docs/
- Plaid Link Docs: https://plaid.com/docs/link/
- Plaid + Dwolla Integration: https://plaid.com/docs/auth/partnerships/dwolla/
- Plaid Sandbox: https://plaid.com/docs/sandbox/

---

## 🚀 Phase Differences

### Phase 1 (Current — Pawpaya Only)
- ✅ Retailer bank connections via Plaid Link
- ✅ Simplified exchange flow (`/api/plaid-exchange`)
- ✅ Full flow with Dwolla (`/api/plaid-link`)
- ❌ No webhook handlers (manual refresh required)
- ❌ No transaction history sync

### Phase 2 (Future — Marketplace)
- ✅ Vendor bank connections
- ✅ Sourcer bank connections
- ✅ Webhook handlers for account status updates
- ✅ Transaction history for reconciliation
- ✅ Multi-account support (business + personal accounts)
- ✅ Instant micro-deposit verification

---

## ✅ Production Checklist

Before enabling Plaid in production:

- [ ] Switch `PLAID_ENV` to `production`
- [ ] Replace sandbox credentials with production `PLAID_CLIENT_ID` and `PLAID_SECRET`
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Enable Plaid webhook endpoint (`/api/plaid-webhook`)
- [ ] Test bank connection flow with real bank accounts
- [ ] Implement error handling for `ITEM_LOGIN_REQUIRED` events
- [ ] Add user notifications for expired bank connections
- [ ] Test Plaid Link UI on mobile devices
- [ ] Verify HTTPS is enforced for all Plaid API calls
- [ ] Review Plaid rate limits (100 req/min for Link token creation)
- [ ] Enable Plaid Link customization (logo, colors)
- [ ] Test edge cases (account changes, bank mergers)
- [ ] Implement retry logic for failed token exchanges
- [ ] Add Slack alerts for Plaid API errors
- [ ] Document user support process for bank connection issues

---

## 🐛 Common Issues & Troubleshooting

### Issue: Link Token Expired
**Error:** `INVALID_LINK_TOKEN`

**Solution:**
- Link tokens expire after 4 hours
- Generate new token if expired
- Do not cache Link tokens

### Issue: Public Token Already Used
**Error:** `INVALID_PUBLIC_TOKEN`

**Solution:**
- Public tokens are single-use only
- If exchange fails, user must re-complete Plaid Link
- Do not retry exchange with same `public_token`

### Issue: Account Already Linked
**Error:** Duplicate `plaid_access_token` in Supabase

**Solution:**
- Check if account already exists before inserting
- Update existing record instead of inserting duplicate
- See `pages/api/plaid-exchange.js:69-103` for upsert logic

### Issue: Processor Token Creation Failed
**Error:** `PROCESSOR_TOKEN_CREATE_FAILED`

**Solution:**
- Verify `access_token` is valid
- Check `account_id` matches selected account
- Ensure Plaid account supports processor tokens
- Verify Dwolla partnership is enabled in Plaid dashboard

### Issue: Dwolla Customer Creation Failed
**Error:** `ValidationError` from Dwolla

**Solution:**
- Verify email format is valid
- Ensure customer type is `receive-only`
- Check Dwolla API credentials are correct
- See `@context/integrations/dwolla.md` for Dwolla troubleshooting

---

## 📊 Plaid Link Products

### Current: `auth` + `transactions`
**Usage:** `pages/api/plaid-link-token.js:27`

**Products Explained:**
| Product | Purpose | Used In Tapify |
|---------|---------|----------------|
| `auth` | Verify account & routing numbers | ✅ ACH payout verification |
| `transactions` | Fetch transaction history | ❌ Future (reconciliation) |
| `balance` | Real-time account balance | ❌ Future (fraud prevention) |
| `identity` | Account holder name & address | ❌ Future (KYC verification) |
| `assets` | Account asset reports | ❌ Not planned |

### Future Enhancements
- Add `balance` product to check account balance before payouts
- Add `identity` product for vendor KYC verification
- Implement transaction sync for automated reconciliation
