# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tapify is a marketplace platform connecting vendors, retailers, and sourcers through physical displays in retail locations. The platform handles product displays, QR code scanning, order tracking, and automated payouts.

**Tech Stack**: Next.js (React), Supabase (PostgreSQL + Auth), Dwolla (payouts), Plaid (bank connections), Tailwind CSS, Framer Motion

## ⚠️ IMPORTANT: Recent Database Migration (October 2025)

The database underwent a **major consolidation migration** on 2025-10-06. Key changes:

### ✅ What Changed:
1. **New Columns Added:**
   - `retailers.recruited_by_sourcer_id` - Sourcer tracking (Phase 2 ready)
   - `retailers.created_by_user_id` - Proper FK to auth.users
   - `vendors.created_by_user_id` - Proper FK to auth.users

2. **Data Consolidated:**
   - Phone/email moved from `retailer_owners` → `retailers` (single source of truth)
   - `retailer_owners` table is now DEPRECATED (do not use for new code)

3. **Query Pattern Changes:**
   - **Auth Lookups:** Use `created_by_user_id` FK (NOT email string matching)
   - **Registrations:** Only insert into `retailers` (NOT retailer_owners)
   - **Payout Jobs:** Auto-include `sourcer_id` from retailer lookup

### ❌ Deprecated (Do Not Use):
- `retailers.location` → Use `address` instead
- `retailers.store_phone` → Use `phone` instead
- `retailers.onboarding_completed` → Use `converted` instead
- `retailer_owners` inserts → Data now in `retailers` table

### 📚 Migration Documentation:
- See `MIGRATION_SCRIPT.sql` for SQL changes
- See `CHANGES_SUMMARY.md` for complete changelog
- See `DATABASE_CONSOLIDATION_PLAN.md` for analysis

---

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server (port 3000)
npm start
```

## Architecture

### User Roles & Access

**Admins** (`/pages/admin.js`, `/pages/admin/stores.js`):
- Server-side auth check via `getServerSideProps` using `@supabase/ssr`
- Admin status verified against `admins` table
- Access to vendor/retailer/sourcer/payout management
- Uses `supabaseAdmin` (service role) for bypassing RLS

**Retailers** (`/pages/onboard/dashboard.js`):
- Client-side auth via `AuthContext`
- Dashboard showing scans, revenue, displays, payouts
- Bank connection via Plaid integration

**Vendors** (`/pages/onboard/`):
- Onboarding flow: index → register → shopify-connect → dashboard
- Shopify OAuth integration for product syncing

### Authentication Flow

1. **Browser**: `lib/supabase.js` exports `supabase` (browser client using `@supabase/ssr`)
   - Sets cookies that SSR can read
   - Used in client components and API routes

2. **Server**: `lib/supabase.js` exports `supabaseAdmin` (service role client)
   - Bypasses Row Level Security (RLS)
   - Only for `getServerSideProps` and API routes
   - **NEVER** use in browser code

3. **Context**: `context/AuthContext.js` provides `useAuthContext()` hook
   - Wraps app in `pages/_app.js`
   - Provides `{ user, loading, signIn, signUp, signOut }`

4. **SSR Auth Pattern** (see `pages/admin.js:15-214`):
   ```js
   import { createServerClient } from '@supabase/ssr';

   export async function getServerSideProps(context) {
     const supabaseServer = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
       { cookies: { /* custom cookie handlers */ } }
     );
     const { data: { user } } = await supabaseServer.auth.getUser();
     // Then check admin status with supabaseAdmin
   }
   ```

### Database Schema (Key Tables)

- **admins**: User IDs with admin access
- **vendors**: Vendor profiles, linked to Shopify stores
- **retailers**: Retail store locations with displays
- **sourcer_accounts**: Users who source products for vendors
- **uids**: Unique display IDs (QR codes) assigned to retail locations
- **scans**: Scan events (timestamp, clicked, converted, revenue)
- **payout_jobs**: Pending/paid payouts with revenue splits
- **vendor_accounts / retailer_accounts / sourcer_accounts**: Bank account info (Dwolla funding sources, Plaid tokens)

### Payout System

**Flow** (`/pages/api/payout.js`):
1. Admin triggers payout from admin dashboard
2. API fetches payout_job with vendor/retailer/sourcer splits
3. Retrieves Dwolla funding source IDs from account tables
4. Creates Dwolla transfers from master funding source
5. Updates payout_job status to 'paid'

**Key Env Vars**:
- `DWOLLA_KEY`, `DWOLLA_SECRET`, `DWOLLA_ENV` (sandbox/production)
- `DWOLLA_MASTER_FUNDING_SOURCE`: Your business bank account funding source ID
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`
- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Styling Conventions

**Tabs Pattern** (used consistently across admin + dashboard pages):
```jsx
<motion.div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-4 mb-6">
  <div className="flex flex-wrap gap-3">
    {tabs.map(tab => (
      <motion.button
        className={active
          ? "bg-gradient-to-r from-[#ff7a4a] to-[#ff6fb3] text-white shadow-lg rounded-2xl px-6 py-3 text-sm font-bold"
          : "text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-2xl px-6 py-3 text-sm font-bold"
        }
      />
    ))}
  </div>
</motion.div>
```

**Design System**:
- Primary gradient: `from-[#ff7a4a] to-[#ff6fb3]`
- Background: `#faf8f3`
- Rounded corners: `rounded-3xl` for cards, `rounded-2xl` for buttons
- Shadow: `shadow-xl` for cards, `shadow-lg` for hover states
- Border: `border-2 border-gray-100` for card containers

### API Routes Structure

- `/api/payout.js`: Process Dwolla payouts
- `/api/plaid-link-token.js`: Generate Plaid Link tokens
- `/api/plaid-exchange.js`: Exchange Plaid public token for access token
- `/api/uid-redirect.js`: Handle QR code scans (via `/t` rewrite in `next.config.js`)
- `/api/admin/*`: Admin-only operations (add owners, prospects)
- `/api/onboard/register.js`: Vendor/retailer registration

### Important Patterns

**UID Redirect** (`next.config.js`):
- `/t?uid={uid}` → `/api/uid-redirect`
- Logs scan, redirects to product/vendor page

**Multi-step Forms**:
- Onboarding uses step-based progression with local state
- See `pages/onboard/register.js` for multi-step form pattern

**Error Handling**:
- Client errors: Toast notifications (see dashboard/admin pages)
- Server errors: Return JSON with `{ error: string }`
- Auth errors: Return props with error messages + debug info (never redirect)

**Framer Motion**:
- Consistent animation variants: `fadeInUp`, `staggerContainer`
- `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}` for buttons
- Page transitions with `initial`, `animate`, `transition`

## Environment Setup

Required `.env.local` variables:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DWOLLA_KEY=
DWOLLA_SECRET=
DWOLLA_ENV=sandbox
DWOLLA_MASTER_FUNDING_SOURCE=

PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
```

## Key Files Reference

- `lib/supabase.js`: Supabase client exports (browser + admin)
- `context/AuthContext.js`: Auth provider + useAuthContext hook
- `pages/_app.js`: App wrapper with AuthProvider + Layout
- `pages/admin.js`: Main admin dashboard (vendors/retailers/payouts)
- `pages/onboard/dashboard.js`: Retailer dashboard
- `services/dwolla.js`: Dwolla API helpers
- `services/plaid.js`: Plaid API helpers
