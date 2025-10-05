# 🚀 Next.js Frontend Overview

The complete architectural guide to Tapify's Next.js frontend layer — mapping pages, API routes, components, and integrations into one cohesive system.

---

## 💡 Purpose
This overview document connects all Next.js documentation files, providing a high-level map of the frontend architecture and how it integrates with Supabase, Shopify, and external services.

---

## 📂 Documentation Structure

### Core Documents

| Document | Purpose | Key Topics |
|----------|---------|------------|
| **pages_api_summary.md** | Server-side API routes | Payout processor, webhook handlers, NFC redirects |
| **frontend_flow.md** | User journeys & routing | Onboarding flow, admin dashboard, claim pages |
| **auth_flow.md** | Authentication system | Session management, role-based access, SSR auth |
| **db_calls_summary.md** | Supabase queries | All database calls by table and operation type |
| **shopify_integration.md** | Commerce layer connection | Webhooks, OAuth, affiliate attribution |
| **components_overview.md** | React component library | Reusable UI, design patterns, animation |

---

## 🏗️ Architecture Layers

### Layer 1: Pages & Routing
**Directory:** `/pages`

**Public Pages:**
- `/` — Marketing landing (Pawpaya product showcase)
- `/onboard` — Retailer onboarding landing
- `/onboard/register` — Multi-step registration form
- `/claim` — UID claiming interface
- `/login` — User authentication
- `/privacy` — Legal/compliance

**Protected Pages:**
- `/onboard/dashboard` — Retailer dashboard (requires auth)
- `/onboard/shopify-connect` — Vendor Shopify OAuth
- `/admin` — Admin command center (requires admin role)
- `/admin/stores` — Detailed store management

**Special Routes:**
- `/t?u=<UID>` — NFC redirect (rewrites to `/api/uid-redirect`)

**See:** `frontend_flow.md` for complete routing map

---

### Layer 2: API Routes (Server-Side)
**Directory:** `/pages/api`

**Core APIs:**
- `/api/uid-redirect` — NFC tap handler
- `/api/payout` — Dwolla ACH transfers
- `/api/shopify-webhook` — Order sync from Shopify
- `/api/submit-vendor` — Vendor onboarding
- `/api/plaid-link-token` — Bank connection
- `/api/plaid-exchange` — Plaid → Dwolla integration

**Admin APIs:**
- `/api/admin/add-owner` — Add franchise owner
- `/api/admin/add-prospect` — Log outreach attempt

**See:** `pages_api_summary.md` for endpoint details

---

### Layer 3: Authentication
**System:** Supabase Auth + @supabase/ssr

**Client Auth:**
- Hook: `hooks/useAuth.js`
- Context: `context/AuthContext.js`
- Provider: Wraps app in `pages/_app.js`

**Server Auth:**
- SSR pattern in `getServerSideProps`
- Admin role check via `admins` table
- Cookie-based session management

**See:** `auth_flow.md` for complete auth lifecycle

---

### Layer 4: Database Integration
**Client:** Supabase (PostgreSQL)

**Browser Client:**
- `lib/supabase.js` → `supabase` export
- Uses `@supabase/ssr` for cookie handling
- Respects Row Level Security (RLS)

**Admin Client:**
- `lib/supabase.js` → `supabaseAdmin` export
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses RLS (server-side only)

**See:** `db_calls_summary.md` for query catalog

---

### Layer 5: Shopify Integration
**Purpose:** Commerce backend + order sync

**Integration Points:**
1. NFC redirect → Affiliate URL
2. Order webhooks → Supabase sync
3. Vendor OAuth (Phase 2)
4. Product sync (Future)

**Attribution Methods:**
- Query params: `?ref=<UID>`
- Discount codes: `RETAILER-<UID>`
- Line item properties (future)

**See:** `shopify_integration.md` for webhook flow

---

### Layer 6: Components
**Directory:** `/components`

**Layout:**
- `Layout` — App wrapper (navbar + footer)
- `Navbar` — Fixed header with auth state
- `Footer` — Global footer

**UI Primitives:**
- `Button` — Variant system (primary, outline, etc.)
- `FormInput` — Input with validation
- `DashboardCard` — KPI display

**Specialized:**
- `ProgressBar` — Multi-step form indicator
- `StoresDataGrid` — Admin table with pagination
- `ErrorBoundary` — Error fallback UI

**See:** `components_overview.md` for full catalog

---

## 🔄 Data Flow Diagrams

### NFC Tap → Purchase Flow
```
┌─────────────────────────────────────────────────────┐
│ 1. Customer taps NFC display                        │
│    └─> Browser loads /t?u=ABC123                    │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 2. Next.js rewrites to /api/uid-redirect            │
│    └─> Checks uids table for claim status           │
│        ├─> Unclaimed → /claim?u=ABC123              │
│        └─> Claimed → affiliate_url (Shopify)        │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 3. Customer lands on Shopify product page           │
│    └─> URL: pawpayaco.com/products/collar?ref=ABC123│
│        └─> Completes checkout                       │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 4. Shopify sends webhook to /api/shopify-webhook    │
│    └─> API validates HMAC signature                 │
│        └─> Extracts ref=ABC123 from order           │
│            └─> Looks up retailer_id from uids       │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 5. Create order + payout_job records                │
│    └─> INSERT INTO orders (...)                     │
│        └─> INSERT INTO payout_jobs (...)            │
│            └─> Status: pending                      │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 6. Admin approves payout in /admin                  │
│    └─> POSTs to /api/payout                         │
│        └─> Dwolla transfers to retailer/vendor      │
│            └─> UPDATE payout_jobs: status='paid'    │
└─────────────────────────────────────────────────────┘
```

---

### Onboarding Flow (Retailer)
```
┌─────────────────────────────────────────────────────┐
│ 1. Manager visits pawpayaco.com (landing)           │
│    └─> Sees value prop + testimonials               │
│        └─> Clicks "Get Your Free Display"           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 2. Redirects to /onboard (onboard landing)          │
│    └─> Detailed benefits + 4-step process           │
│        └─> Clicks "Start Registration"              │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 3. Multi-step form at /onboard/register             │
│    └─> Step 1: Store details (name, address, phone) │
│        └─> Step 2: Business info (franchise parent) │
│            └─> Step 3: Contact preferences          │
│                └─> Step 4: Review & submit          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 4. POSTs to /api/onboard/register                   │
│    └─> INSERT INTO retailers (...)                  │
│        └─> Creates Supabase Auth account            │
│            └─> Auto-login with new session          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│ 5. Redirects to /onboard/dashboard                  │
│    └─> Shows welcome state (no scans yet)           │
│        └─> Prompts to connect bank account (Plaid)  │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Tech Stack

### Core Framework
- **Next.js 13** — React framework (Pages Router)
- **React 18** — UI library
- **Framer Motion** — Animations

### Styling
- **Tailwind CSS** — Utility-first CSS
- **Custom Design System** — Gradients, shadows, border-radius

### Database & Auth
- **Supabase** — PostgreSQL + Auth
- **@supabase/ssr** — Server-side session handling
- **@supabase/supabase-js** — Client library

### External Services
- **Shopify** — Commerce backend
- **Dwolla** — ACH payouts
- **Plaid** — Bank account linking
- **Google Maps API** — Address validation (verify)

---

## 🔐 Security Architecture

### Authentication Layers
1. **Public Routes** — No auth required (`/`, `/onboard`, `/login`)
2. **User Routes** — Requires session (`/onboard/dashboard`)
3. **Admin Routes** — Requires admin role (`/admin`)

### Server-Side Security
- All API routes validate session server-side
- Admin routes check `admins` table with `supabaseAdmin`
- HMAC validation on Shopify webhooks
- Environment variables never exposed to client

### Client Selection Rules
- **Browser:** Use `supabase` (RLS enforced)
- **Server:** Use `supabaseAdmin` (bypasses RLS)
- **Never:** Expose service role key to browser

---

## 🎨 Design System

### Color Palette
- **Primary Gradient:** `from-[#ff7a4a] to-[#ff6fb3]`
- **Background:** `#faf8f3`
- **Text:** Gray scale (900/600/400)

### Typography
- **Headings:** Bold, large sizes (text-4xl to text-7xl)
- **Body:** Regular, medium sizes (text-base to text-xl)

### Spacing & Layout
- **Border Radius:** 2xl (buttons), 3xl (cards)
- **Shadows:** xl (cards), lg (hovers), 2xl (modals)
- **Padding:** Consistent 4/6/8 scale

### Animations
- **Fade In Up:** Entry animations
- **Hover Scale:** Button interactions (1.05)
- **Stagger Children:** List animations (0.1s delay)

---

## 📊 File Structure Map

```
tapify-marketplace/
├── pages/
│   ├── index.js                    # Marketing landing
│   ├── _app.js                     # App wrapper (AuthProvider + Layout)
│   ├── login.js                    # Auth page
│   ├── claim.js                    # UID claiming
│   ├── onboard/
│   │   ├── index.js                # Onboard landing
│   │   ├── register.js             # Multi-step form
│   │   ├── shopify-connect.js      # Vendor OAuth
│   │   └── dashboard.js            # Retailer dashboard
│   ├── admin/
│   │   ├── index.js                # Admin dashboard
│   │   └── stores.js               # Store management
│   └── api/
│       ├── uid-redirect.js         # NFC handler
│       ├── payout.js               # Dwolla transfers
│       ├── shopify-webhook.js      # Order sync
│       ├── submit-vendor.js        # Vendor onboarding
│       ├── plaid-link-token.js     # Bank connection
│       ├── plaid-exchange.js       # Plaid → Dwolla
│       └── admin/
│           ├── add-owner.js        # Add owner
│           └── add-prospect.js     # Log outreach
│
├── components/
│   ├── layout.js                   # App wrapper
│   ├── navbar.js                   # Header
│   ├── footer.js                   # Footer
│   ├── button.js                   # Base button
│   ├── FormInput.js                # Input component
│   ├── DashboardCard.js            # KPI card
│   ├── ProgressBar.js              # Multi-step indicator
│   └── ...                         # Other components
│
├── context/
│   └── AuthContext.js              # Auth provider
│
├── hooks/
│   └── useAuth.js                  # Auth hook
│
├── lib/
│   ├── supabase.js                 # DB clients
│   └── auth.js                     # Auth helpers
│
└── services/
    ├── dwolla.js                   # Dwolla SDK
    └── plaid.js                    # Plaid SDK
```

---

## 🔗 Cross-References

### Internal Context
- **@context/GAME_PLAN_2.0.md** — Business strategy & phases
- **@context/data_model.md** — Database schema & relationships
- **@context/supabase/overview.md** — Supabase architecture
- **@context/shopify/overview.md** — Shopify integration
- **@context/payouts_flow.md** — Payout sequence
- **@context/ui/ui_overview.md** — Design system

### External Docs
- [Next.js Pages Router](https://nextjs.org/docs/pages)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✅ Quick Start Checklist

**For New Developers:**
1. ✅ Read `GAME_PLAN_2.0.md` for business context
2. ✅ Read this overview for architecture map
3. ✅ Review `auth_flow.md` for session management
4. ✅ Check `frontend_flow.md` for user journeys
5. ✅ Browse `pages_api_summary.md` for API endpoints
6. ✅ Explore `components_overview.md` for UI library

**For AI Agents:**
1. ✅ Load all @context/nextjs files for frontend context
2. ✅ Reference `db_calls_summary.md` for query patterns
3. ✅ Check `shopify_integration.md` for commerce logic
4. ✅ Use `components_overview.md` for UI patterns

---

## 🧠 Key Takeaways

1. **Dual-Client Pattern** — Browser (`supabase`) vs Server (`supabaseAdmin`)
2. **SSR Auth** — Always validate server-side, return error props (no redirects)
3. **NFC Attribution** — UID → Retailer → Affiliate URL → Payout
4. **Shopify Webhooks** — Order sync → Payout job creation
5. **Component Reusability** — Consistent design tokens across all UI

---

**This overview serves as the master index for all Next.js documentation. Start here, then dive into specific files as needed.**
