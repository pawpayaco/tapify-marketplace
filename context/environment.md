# 🔐 Environment Configuration

Documents every environment variable, secret, and configuration key used across Tapify Infrastructure System v2.0 — including Next.js, Supabase, Shopify, Dwolla, Plaid, and third-party APIs.

---

## 📋 Purpose
This file provides a complete reference for all environment variables required to run Tapify locally or in production. It includes authentication keys, API secrets, database connections, and service configurations for the entire marketplace platform.

---

## 🌍 Environment Variables

### Supabase Configuration

**Browser-Side (Public)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://hoaixfylzqnpkojsfnvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:**
- Used in browser-side Supabase client (`lib/supabase.js:19`)
- Required for client-side authentication and database queries
- Safe to expose in frontend code

**Server-Side (Secret)**
```env
SUPABASE_URL=https://hoaixfylzqnpkojsfnvv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage:**
- Used in `supabaseAdmin` client (`lib/supabase.js:50`)
- Bypasses Row Level Security (RLS)
- **ONLY** use in `getServerSideProps` or API routes
- **NEVER** expose to browser

**PostgreSQL Direct Connection**
```env
DATABASE_URL=postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres
```

**Usage:**
- Direct PostgreSQL connection for complex queries
- Used in registration API for address autocomplete (`pages/api/onboard/register.js:29`)
- Format: `postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres`

**Files:**
- `lib/supabase.js:4-6` (browser + admin clients)
- `pages/api/onboard/register.js:8-9` (registration endpoint)
- `pages/api/uid-redirect.js:14-15` (QR redirect handler)

---

### Plaid Configuration (Bank Connections)

**API Credentials**
```env
PLAID_CLIENT_ID=68db07dc1059f30020727751
PLAID_SECRET=a0e905ba7d104e24e66408023f6351
PLAID_ENV=sandbox
```

**Usage:**
- `PLAID_CLIENT_ID` & `PLAID_SECRET` authenticate with Plaid API
- `PLAID_ENV` determines environment (`sandbox` | `development` | `production`)
- Used for:
  - Creating Link tokens (`pages/api/plaid-link-token.js:21-22`)
  - Exchanging public tokens (`pages/api/plaid-exchange.js:28-29`)
  - Creating Dwolla processor tokens (`pages/api/plaid-link.js:30-31, 47-48`)

**Plaid API Endpoints:**
- `https://sandbox.plaid.com/link/token/create` — Generate Link token
- `https://sandbox.plaid.com/item/public_token/exchange` — Exchange public token
- `https://sandbox.plaid.com/processor/dwolla/bank_account_token/create` — Create Dwolla processor token
- `https://sandbox.plaid.com/accounts/get` — Fetch account details

**Files:**
- `pages/api/plaid-link-token.js` (generate Link token)
- `pages/api/plaid-exchange.js` (exchange public token)
- `pages/api/plaid-link.js` (full Plaid → Dwolla flow)
- `services/plaid.js` (client-side helpers)

---

### Dwolla Configuration (ACH Payouts)

**API Credentials**
```env
DWOLLA_ENV=https://api-sandbox.dwolla.com
DWOLLA_KEY=your-dwolla-key-here
DWOLLA_SECRET=your-dwolla-secret-here
```

**Usage:**
- `DWOLLA_ENV` sets base URL:
  - Sandbox: `https://api-sandbox.dwolla.com`
  - Production: `https://api.dwolla.com`
- `DWOLLA_KEY` & `DWOLLA_SECRET` authenticate via OAuth2 client credentials grant
- Used in payout flow (`pages/api/payout.js:21-22`)

**Master Funding Source**
```env
DWOLLA_MASTER_FUNDING_SOURCE=funding-source-id-here
```

**Usage:**
- Tapify's business bank account funding source ID
- Source account for all vendor/retailer/sourcer payouts
- Retrieved from Dwolla dashboard after onboarding
- Used in payout transfers (`pages/api/payout.js:109`)

**Dwolla API Endpoints:**
- `{DWOLLA_ENV}/token` — OAuth2 authentication
- `{DWOLLA_ENV}/customers` — Create customer accounts
- `{DWOLLA_ENV}/customers/{id}/funding-sources` — Add bank accounts
- `{DWOLLA_ENV}/transfers` — Initiate ACH transfers

**Files:**
- `pages/api/payout.js` (multi-party payout execution)
- `pages/api/plaid-link.js` (Plaid → Dwolla integration)
- `services/dwolla.js` (client-side helpers)

---

### Shopify Configuration (Future Phase 2)

**Webhook Validation**
```env
SHOPIFY_WEBHOOK_SECRET=shpss_...
```

**Usage:**
- Validates HMAC signature on incoming Shopify webhooks
- Used in `pages/api/shopify-webhook.js` (verify — file exists but may be placeholder)
- Example validation:
  ```js
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('base64');
  ```

**OAuth Credentials (Vendor Store Connections)**
```env
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
```

**Usage:**
- Enables vendors to connect their Shopify stores
- Used in OAuth flow (`pages/onboard/shopify-connect.js`)
- Scopes: `read_products`, `read_orders` (verify)

**Tapify's Shopify Store (Pawpaya)**
```env
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=... (verify)
```

**Usage:**
- `NEXT_PUBLIC_SHOPIFY_DOMAIN` is Tapify's Pawpaya Shopify store
- Used for affiliate URL redirects (`pages/api/uid-redirect.js:40`)
- Storefront token for GraphQL queries (future)

**Phase Differences:**
- **Phase 1:** Only Pawpaya Shopify store, no vendor OAuth
- **Phase 2:** Multi-vendor Shopify OAuth, product sync

**Files:**
- `context/nextjs/shopify_integration.md` (integration docs)
- `context/shopify/webhooks.md` (webhook details)
- `pages/onboard/shopify-connect.js:22` (store URL usage)

---

### USPS Address Validation

**API Credentials**
```env
USPS_USERID=oscarmullikin
```

**Usage:**
- USPS Web Tools API user ID
- Validates retailer/vendor addresses during onboarding
- Used in address validation endpoint (`pages/api/validate-address.js:21`)

**USPS API Endpoint:**
- `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML={xml}`

**Files:**
- `pages/api/validate-address.js` (address validation)
- `pages/onboard/register.js` (address input form)

---

### Google Maps API

**API Key**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDOxRvaCvYc1K52-1jJQ5eO3v1IkcoOtoQ
```

**Usage:**
- Autocomplete for address input fields
- Used in:
  - Vendor registration (`pages/onboard/register.js:891`)
  - Retailer registration (`pages/onboard/register.js:1097`)
  - Shopify connect flow (`pages/onboard/shopify-connect.js:352`)
  - Admin store management (`components/StoresDataGrid.js:636`)

**Required APIs:**
- Places API (autocomplete)
- Geocoding API (address validation)

**Files:**
- `components/StoresDataGrid.js:636` (admin map view)
- `pages/onboard/register.js:891, 1097` (address autocomplete)

---

### Application Configuration

**Base URL**
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Usage:**
- Base URL for absolute links and API callbacks
- Used in Plaid webhook URL (`pages/api/plaid-link-token.js:30`)
- **Development:** `http://localhost:3000`
- **Production:** `https://yourdomain.com`

**Admin API Secret**
```env
ADMIN_API_SECRET=123abc123
NEXT_PUBLIC_ADMIN_API_SECRET=123abc123
```

**Usage:**
- Authentication for admin-only API routes
- Used in store registration (`components/StoreRegistrationForm.js:102`)
- **Security Note:** Should be strong, random string in production
- `NEXT_PUBLIC_ADMIN_API_SECRET` exposed to browser (verify — may need refactor)

**Development Mode**
```env
NODE_ENV=development | production
```

**Usage:**
- Set automatically by Next.js
- Controls error message verbosity
- Used in error responses:
  - `pages/api/validate-address.js:162` (show stack traces)
  - `pages/api/onboard/register.js:301` (debug info)
  - `components/ErrorBoundary.js:30` (detailed errors)

**Auth Bypass (Development Only)**
```env
NEXT_PUBLIC_DISABLE_AUTH=true
```

**Usage:**
- Disables authentication for local development
- Used in login page (`pages/login.js:16`)
- **NEVER** enable in production

---

### Shopify Display Configuration

**Product SKUs (Phase 1)**
```env
NEXT_PUBLIC_PRIORITY_SKU=PRIORITY_SHIPPING
NEXT_PUBLIC_FREE_DISPLAY_SKU=FREE_DISPLAY
NEXT_PUBLIC_SHOPIFY_STORE_URL=https://yourstore.myshopify.com
```

**Usage:**
- Identifies Tapify-specific Shopify products
- Used in vendor onboarding (`pages/onboard/shopify-connect.js:22-24`)
- Allows vendors to purchase display units and shipping

**Files:**
- `pages/onboard/shopify-connect.js:22-24`

---

## 🔒 Security Practices

### Secret Classification

**Public (NEXT_PUBLIC_* prefix)**
- Exposed to browser, included in client-side bundle
- Examples: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Safe for non-sensitive configuration

**Server-Side Only (no prefix)**
- Never exposed to browser
- Only accessible in API routes and `getServerSideProps`
- Examples: `SUPABASE_SERVICE_ROLE_KEY`, `DWOLLA_SECRET`, `PLAID_SECRET`

### Environment File Security

**Local Development**
- Store in `.env.local` (gitignored)
- Never commit to version control

**Production**
- Use hosting platform's environment variable manager:
  - Vercel: Project Settings → Environment Variables
  - Netlify: Site Settings → Build & Deploy → Environment
  - AWS: Parameter Store or Secrets Manager

### Token Rotation

**Recommended Schedule:**
- **Supabase Service Role Key:** Rotate every 90 days
- **Plaid/Dwolla Secrets:** Rotate every 90 days
- **USPS User ID:** Rotate annually
- **Google Maps API Key:** Use IP restrictions + HTTP referrer restrictions

### HMAC Validation

**Shopify Webhooks:**
```js
const isValid = crypto.timingSafeEqual(
  Buffer.from(hmac),
  Buffer.from(hash)
);
```

**Security Notes:**
- Always use `crypto.timingSafeEqual` to prevent timing attacks
- Validate **before** processing webhook payload
- Return `401 Unauthorized` on validation failure

---

## 📂 File Locations

### Environment Files
- `.env.local` — Local development environment variables (gitignored)
- `.env.example` — Template for required variables (verify — may not exist)

### Configuration Files
- `lib/supabase.js` — Supabase client initialization
- `lib/auth.js` — Authentication helpers
- `next.config.js` — Next.js configuration (URL rewrites)

### API Routes Using Environment Variables
- `pages/api/payout.js` — Dwolla payouts
- `pages/api/plaid-link-token.js` — Plaid Link token
- `pages/api/plaid-exchange.js` — Plaid token exchange
- `pages/api/plaid-link.js` — Plaid → Dwolla integration
- `pages/api/validate-address.js` — USPS address validation
- `pages/api/uid-redirect.js` — NFC/QR redirect handler
- `pages/api/onboard/register.js` — Vendor/retailer registration
- `pages/api/shopify-webhook.js` — Shopify order webhooks (verify)

### Client-Side Usage
- `components/StoresDataGrid.js:636` — Google Maps
- `pages/onboard/register.js:891, 1097` — Address autocomplete
- `pages/admin.js:33-34` — Supabase client init
- `pages/login.js:16` — Auth bypass check

---

## 🔗 Relations

**Related Documentation:**
- See **@context/nextjs/shopify_integration.md** for Shopify webhook setup
- See **@context/shopify/integration_points.md** for OAuth flow
- See **@context/nextjs/pages_api_summary.md** for API route details
- See **@context/supabase/overview.md** for database RLS policies
- See **@context/CLAUDE.md** for development setup guide

**External API Documentation:**
- Supabase: https://supabase.com/docs
- Plaid: https://plaid.com/docs/
- Dwolla: https://developers.dwolla.com/
- Shopify: https://shopify.dev/docs/api
- USPS Web Tools: https://www.usps.com/business/web-tools-apis/
- Google Maps: https://developers.google.com/maps/documentation

---

## ✅ Example .env.local

**Complete template for local development:**

```env
# ====================
# Supabase Configuration
# ====================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (server-side only, never expose to client)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PostgreSQL connection for autocomplete and registration APIs
DATABASE_URL=postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres

# ====================
# Plaid Configuration
# ====================
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox

# ====================
# Dwolla Configuration
# ====================
DWOLLA_ENV=https://api-sandbox.dwolla.com
DWOLLA_KEY=your-dwolla-key
DWOLLA_SECRET=your-dwolla-secret
DWOLLA_MASTER_FUNDING_SOURCE=your-funding-source-id

# ====================
# Shopify Configuration (Future)
# ====================
SHOPIFY_WEBHOOK_SECRET=shpss_your-webhook-secret
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
NEXT_PUBLIC_SHOPIFY_DOMAIN=pawpayaco.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token

# ====================
# Third-Party APIs
# ====================
USPS_USERID=your-usps-userid
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# ====================
# Application Configuration
# ====================
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ADMIN_API_SECRET=your-strong-admin-secret
NEXT_PUBLIC_ADMIN_API_SECRET=your-strong-admin-secret

# Development only (NEVER use in production)
NEXT_PUBLIC_DISABLE_AUTH=false

# ====================
# Shopify Display SKUs (Phase 1)
# ====================
NEXT_PUBLIC_PRIORITY_SKU=PRIORITY_SHIPPING
NEXT_PUBLIC_FREE_DISPLAY_SKU=FREE_DISPLAY
NEXT_PUBLIC_SHOPIFY_STORE_URL=https://yourstore.myshopify.com
```

---

## 🚨 Production Checklist

Before deploying to production:

- [ ] Rotate all secrets to production values
- [ ] Remove `NEXT_PUBLIC_DISABLE_AUTH` (or set to `false`)
- [ ] Change `PLAID_ENV` to `production`
- [ ] Change `DWOLLA_ENV` to `https://api.dwolla.com`
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Replace `ADMIN_API_SECRET` with cryptographically random string
- [ ] Verify `DWOLLA_MASTER_FUNDING_SOURCE` points to production account
- [ ] Enable IP restrictions on Google Maps API key
- [ ] Configure Shopify webhook endpoints in Shopify admin
- [ ] Test Plaid Link in production mode
- [ ] Verify USPS API works with production credentials
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure rate limiting for API routes
- [ ] Enable HTTPS for all external API callbacks
